import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const subjectId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    // Fetch Subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { class: true } as any,
    }) as any;

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const isClassIncharge = teacher.inchargeClass?.id === subject.classId;
    const isSubjectIncharge = subject.subjectInchargeId === teacher.id;

    // Security check: must be either Class Incharge or Subject Incharge
    if (!isClassIncharge && !isSubjectIncharge) {
      return NextResponse.json(
        { error: "Access Denied: You do not manage this subject" },
        { status: 403 }
      );
    }

    // Fetch all activities for this subject
    const activities = await (prisma as any).subjectActivity.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
    });

    // Fetch enrolled students in the class
    const students = await prisma.studentProfile.findMany({
      where: { classId: subject.classId },
      include: {
        user: { select: { name: true } },
        activityMarks: true,
      } as any,
    }) as any[];

    // Format students with their marks for all activities
    const studentsList = students.map((student) => {
      const marksMap: Record<string, number> = {};
      student.activityMarks.forEach((m: any) => {
        marksMap[m.activityId] = m.score;
      });

      return {
        id: student.id,
        rollNumber: student.rollNumber || "N/A",
        name: student.user.name,
        marks: marksMap,
      };
    });

    return NextResponse.json({
      subjectName: subject.name,
      className: subject.class.name,
      isEditable: isSubjectIncharge || isClassIncharge,
      activities,
      students: studentsList,
    });
  } catch (err: any) {
    console.error("GET Subject Activities Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create an activity
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const subjectId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    }) as any;

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const isClassIncharge = teacher.inchargeClass?.id === subject.classId;
    const isSubjectIncharge = subject.subjectInchargeId === teacher.id;

    if (!isClassIncharge && !isSubjectIncharge) {
      return NextResponse.json(
        { error: "Access Denied: You do not manage this subject" },
        { status: 403 }
      );
    }

    const { name, date, totalMarks } = await req.json();

    if (!name || !date || !totalMarks) {
      return NextResponse.json(
        { error: "Activity Name, Date, and Total Marks are required" },
        { status: 400 }
      );
    }

    const activity = await (prisma as any).subjectActivity.create({
      data: {
        subjectId,
        name,
        date: new Date(date),
        totalMarks: Number(totalMarks),
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    console.error("POST Create Activity Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
