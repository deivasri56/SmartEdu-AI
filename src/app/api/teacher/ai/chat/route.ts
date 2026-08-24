// Teacher AI Chat API — Conversational teaching copilot
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAIResponse } from "@/lib/gemini";
import { buildTeacherChatSystemPrompt } from "@/lib/ai-prompts";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch teacher data for context
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Get assignments
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: { teacherProfileId: teacher.id },
      include: { class: true, subject: true },
    });

    const classIds = [...new Set(assignments.map((a: any) => a.classId))];
    const subjectIds = assignments.map((a: any) => a.subjectId);

    // Get students with grades
    const students = await prisma.studentProfile.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: true,
        user: { select: { name: true } },
        grades: {
          where: { subjectId: { in: subjectIds } },
          include: { subject: true },
          orderBy: { date: "desc" },
          take: 10, // Limit per student for context window
        },
      },
    });

    // Build context strings
    const assignmentsSummary = assignments
      .map((a: any) => `- ${a.subject.name} (${a.subject.code}) → ${a.class.name}`)
      .join("\n");

    const studentsSummary = students
      .map((s: any) => {
        const relevantGrades = s.grades;
        let gpa = 0;
        if (relevantGrades.length > 0) {
          gpa = Math.round(
            relevantGrades.reduce(
              (acc: number, g: any) => acc + (g.score / g.maxScore) * 100,
              0
            ) / relevantGrades.length
          );
        }
        const gradeDetails = relevantGrades
          .map(
            (g: any) =>
              `  • ${g.subject.name} ${g.type}: ${g.score}/${g.maxScore} (${Math.round((g.score / g.maxScore) * 100)}%)`
          )
          .join("\n");
        return `${s.user.name} (${s.class.name}) — Average: ${gpa}%\n${gradeDetails}`;
      })
      .join("\n\n");

    // Class performance
    const perfSummary = await Promise.all(
      assignments.map(async (a: any) => {
        const grades = await prisma.grade.findMany({
          where: {
            subjectId: a.subjectId,
            student: { classId: a.classId },
          },
        });
        let avg = 0;
        if (grades.length > 0) {
          avg = Math.round(
            grades.reduce((acc: number, g: any) => acc + (g.score / g.maxScore) * 100, 0) /
              grades.length
          );
        }
        return `- ${a.class.name} | ${a.subject.name}: ${avg}% average (${grades.length} grades)`;
      })
    );

    const systemPrompt = buildTeacherChatSystemPrompt({
      teacherName: teacher.user.name,
      assignments: assignmentsSummary,
      studentsSummary,
      performanceSummary: perfSummary.join("\n"),
    });

    const response = await generateAIResponse(systemPrompt, message.trim());

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Teacher AI Chat Error:", error);

    if (error.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI service is not configured. Please set GEMINI_API_KEY in .env" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}
