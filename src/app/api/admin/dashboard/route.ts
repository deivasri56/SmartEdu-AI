import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run parallel counts
    const [studentCount, teacherCount, classCount, subjectCount] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.teacherProfile.count(),
      prisma.class.count(),
      prisma.subject.count(),
    ]);

    // Get all classes with student count
    const classes = await prisma.class.findMany({
      include: {
        students: { select: { id: true } },
      },
    });

    const classesFormatted = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      studentCount: c.students.length,
      createdAt: c.createdAt.toISOString().split("T")[0],
    }));

    // Get all subjects
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    // Get all teachers with their subjects and classes taught
    const teachers = await prisma.teacherProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        assignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    const teachersFormatted = teachers.map((t: any) => ({
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      assignments: t.assignments.map((a: any) => ({
        class: a.class.name,
        subject: a.subject.name,
      })),
    }));

    // Get all students with their class and GPA percentage (from all subjects)
    const students = await prisma.studentProfile.findMany({
      include: {
        class: true,
        user: { select: { name: true, email: true } },
        grades: true,
      },
    });

    const studentsFormatted = students.map((s: any) => {
      let gpa = 0;
      if (s.grades.length > 0) {
        gpa = Math.round(
          s.grades.reduce((acc: number, g: any) => acc + (g.score / g.maxScore) * 100, 0) / s.grades.length
        );
      }
      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        class: s.class.name,
        gpa,
      };
    });

    // Compute next best action for Admin
    let nextBestAction = {
      action: "Review subject assignments",
      reason: "Ensure all newly created subjects have at least one assigned teacher and class mapping.",
    };

    if (studentCount === 0) {
      nextBestAction = {
        action: "Register students",
        reason: "The college has 0 students enrolled. Head to 'Manage Users' to add student accounts.",
      };
    } else if (teacherCount === 0) {
      nextBestAction = {
        action: "Recruit or assign teachers",
        reason: "No teacher profiles found. Assign teacher roles to begin scheduling classes.",
      };
    } else {
      // Find low performing student or class to suggest action
      const lowestGpaStudent = [...studentsFormatted].sort((a, b) => a.gpa - b.gpa)[0];
      if (lowestGpaStudent && lowestGpaStudent.gpa < 65) {
        nextBestAction = {
          action: `Initiate intervention for ${lowestGpaStudent.name}`,
          reason: `This student's GPA is currently ${lowestGpaStudent.gpa}%, which is below the threshold of 65%.`,
        };
      }
    }

    return NextResponse.json({
      stats: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        subjects: subjectCount,
      },
      classes: classesFormatted,
      subjects,
      teachers: teachersFormatted,
      students: studentsFormatted,
      nextBestAction,
    });
  } catch (error) {
    console.error("Admin Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
