// Teacher AI Insights API — Generates structured class analysis using agentic workflow
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runTeacherAgenticWorkflow } from "@/lib/agentic-workflow";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let session: any = null;
  try {
    session = await getSession(req);
  } catch (err) {
    // Ignore
  }

  if (!session || session.role !== "TEACHER") {
    return new Response(
      encoder.encode(JSON.stringify({ step: "error", message: "Unauthorized" }) + "\n"),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch teacher profile
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId as string },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!teacher) {
    return new Response(
      encoder.encode(JSON.stringify({ step: "error", message: "Teacher profile not found" }) + "\n"),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get teacher's class and subject assignments
  const assignments = await prisma.teacherSubjectClass.findMany({
    where: { teacherProfileId: teacher.id },
    include: { class: true, subject: true },
  });

  if (assignments.length === 0) {
    return new Response(
      JSON.stringify({
        insights: null,
        message: "No class assignments found. AI insights will appear once you are assigned classes.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const classIds = [...new Set(assignments.map((a: any) => a.classId))];
  const subjectIds = assignments.map((a: any) => a.subjectId);

  // Fetch students in assigned classes
  const students = await prisma.studentProfile.findMany({
    where: { classId: { in: classIds } },
    include: {
      class: true,
      user: { select: { name: true } },
      grades: {
        where: { subjectId: { in: subjectIds } },
        include: { subject: true },
        orderBy: { date: "desc" },
      },
    },
  });

  // Build class performance stats
  const classPerformance = await Promise.all(
    assignments.map(async (assign: any) => {
      const gradesForClassSubject = await prisma.grade.findMany({
        where: {
          subjectId: assign.subjectId,
          student: { classId: assign.classId },
        },
      });

      let avg = 0;
      if (gradesForClassSubject.length > 0) {
        const sum = gradesForClassSubject.reduce(
          (acc: number, g: any) => acc + (g.score / g.maxScore) * 100,
          0
        );
        avg = Math.round(sum / gradesForClassSubject.length);
      }

      return {
        className: assign.class.name,
        subjectName: assign.subject.name,
        subjectCode: assign.subject.code,
        average: avg,
        submissionsCount: gradesForClassSubject.length,
      };
    })
  );

  // Build student summaries
  const studentsFormatted = students.map((s: any) => {
    const relevantGrades = s.grades.filter((g: any) =>
      subjectIds.includes(g.subjectId)
    );
    let gpa = 0;
    if (relevantGrades.length > 0) {
      gpa = Math.round(
        relevantGrades.reduce(
          (acc: number, g: any) => acc + (g.score / g.maxScore) * 100,
          0
        ) / relevantGrades.length
      );
    }
    return {
      name: s.user.name,
      className: s.class.name,
      gpa,
      totalGrades: relevantGrades.length,
    };
  });

  // Build detailed grades for AI analysis
  const detailedGrades: any[] = [];
  students.forEach((s: any) => {
    s.grades.forEach((g: any) => {
      detailedGrades.push({
        studentName: s.user.name,
        className: s.class.name,
        subject: g.subject.name,
        type: g.type,
        score: g.score,
        maxScore: g.maxScore,
        percentage: Math.round((g.score / g.maxScore) * 100),
        comments: g.comments,
      });
    });
  });

  if (detailedGrades.length === 0) {
    return new Response(
      JSON.stringify({
        insights: null,
        message: "No grades recorded yet for your classes. AI insights will appear once assessment data exists.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const inputData = {
    teacherName: teacher.user.name,
    assignments: assignments.map((a: any) => ({
      className: a.class.name,
      subjectName: a.subject.name,
      subjectCode: a.subject.code,
    })),
    students: studentsFormatted,
    classPerformance,
    detailedGrades,
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runTeacherAgenticWorkflow(inputData)) {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
        }
        controller.close();
      } catch (e: any) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ step: "error", message: e.message }) + "\n")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
