import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const classId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    // Check if class exists
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
    }) as any;

    if (!targetClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const isIncharge = teacher.inchargeClass?.id === classId;

    // Check teacher assignments to this class
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: {
        teacherProfileId: teacher.id,
        classId,
      },
    });

    if (!isIncharge && assignments.length === 0) {
      return NextResponse.json(
        { error: "Access Denied: You are not assigned to this class" },
        { status: 403 }
      );
    }

    // Fetch students in this class
    const students = await prisma.studentProfile.findMany({
      where: { classId },
      include: {
        user: { select: { name: true } },
        grades: {
          include: { subject: true },
        },
      },
    }) as any[];

    // Subject restriction for non-incharge
    const taughtSubjectIds = assignments.map((a) => a.subjectId);

    const studentsList = students.map((student) => {
      // Filter grades based on role/incharge status
      const relevantGrades = isIncharge
        ? student.grades
        : student.grades.filter((g: any) => taughtSubjectIds.includes(g.subjectId));

      let average = 0;
      if (relevantGrades.length > 0) {
        const sum = relevantGrades.reduce(
          (acc: number, g: any) => acc + (g.score / g.maxScore) * 100,
          0
        );
        average = Math.round(sum / relevantGrades.length);
      }

      // Academic standing status
      let status = "Average";
      if (average >= 85) status = "Excellent";
      else if (average >= 70) status = "Good";
      else if (average > 0 && average < 65) status = "Needs Attention";
      else if (average === 0) status = "No Data";

      return {
        id: student.id,
        rollNumber: student.rollNumber || "N/A",
        name: student.user.name,
        average,
        status,
      };
    });

    return NextResponse.json({
      className: targetClass.name,
      isIncharge,
      students: studentsList,
    });
  } catch (err: any) {
    console.error("GET Class Students Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
