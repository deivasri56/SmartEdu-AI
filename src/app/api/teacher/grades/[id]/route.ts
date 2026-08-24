import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id: gradeId } = params;

    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Get the grade record
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        student: { select: { classId: true } },
      },
    }) as any;

    if (!grade) {
      return NextResponse.json({ error: "Grade record not found" }, { status: 404 });
    }

    // Verify if the teacher teaches this subject and class
    const assignment = await prisma.teacherSubjectClass.findFirst({
      where: {
        teacherProfileId: teacher.id,
        subjectId: grade.subjectId,
        classId: grade.student.classId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not authorized to delete this grade record." },
        { status: 403 }
      );
    }

    // Delete the grade
    await prisma.grade.delete({
      where: { id: gradeId },
    });

    return NextResponse.json({ success: true, message: "Grade record deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Grade API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
