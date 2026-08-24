import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
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

    // Get teacher's assignments to filter subjects/classes they can see
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: { teacherProfileId: teacher.id },
      select: { subjectId: true, classId: true },
    });

    const subjectIds = assignments.map((a: any) => a.subjectId);
    const classIds = assignments.map((a: any) => a.classId);

    // Get grades matching subjects and classes taught by teacher
    const grades = await prisma.grade.findMany({
      where: {
        subjectId: { in: subjectIds },
        student: { classId: { in: classIds } },
      },
      include: {
        subject: { select: { name: true, code: true } },
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }) as any[];

    const formattedGrades = grades.map((g) => ({
      id: g.id,
      studentName: g.student.user.name,
      className: g.student.class.name,
      subjectName: g.subject.name,
      subjectCode: g.subject.code,
      type: g.type,
      score: g.score,
      maxScore: g.maxScore,
      date: g.date.toISOString().split("T")[0],
      comments: g.comments,
    }));

    return NextResponse.json({ grades: formattedGrades });
  } catch (error) {
    console.error("GET Grades API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentProfileId, subjectId, type, score, maxScore, comments } = await req.json();

    if (!studentProfileId || !subjectId || !type || score === undefined || !maxScore) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher profile exists
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Verify student exists and get their classId
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { classId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify the teacher is assigned to teach this student's class and this subject
    const assignment = await prisma.teacherSubjectClass.findFirst({
      where: {
        teacherProfileId: teacher.id,
        subjectId,
        classId: student.classId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not authorized to grade this student in this subject." },
        { status: 403 }
      );
    }

    // Save the grade
    const newGrade = await prisma.grade.create({
      data: {
        studentProfileId,
        subjectId,
        type,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        comments,
      },
    });

    return NextResponse.json({ success: true, grade: newGrade });
  } catch (error) {
    console.error("Post Grade API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
