// Student AI Chat API — Conversational academic copilot
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAIResponse } from "@/lib/gemini";
import { buildStudentChatSystemPrompt } from "@/lib/ai-prompts";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
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

    // Fetch student data for context
    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.userId as string },
      include: {
        class: true,
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
      orderBy: { date: "desc" },
      take: 20, // Limit to recent grades for context window
    });

    // Also fetch activity marks
    const activityMarks = await prisma.activityMark.findMany({
      where: { studentProfileId: student.id },
      include: {
        activity: {
          include: { subject: true },
        },
      },
      take: 20,
    });

    // Build subject averages from BOTH grades and activity marks
    const subjectMap: Record<string, { total: number; count: number; name: string }> = {};
    grades.forEach((g: any) => {
      if (!subjectMap[g.subject.code]) {
        subjectMap[g.subject.code] = { total: 0, count: 0, name: g.subject.name };
      }
      subjectMap[g.subject.code].total += (g.score / g.maxScore) * 100;
      subjectMap[g.subject.code].count += 1;
    });

    activityMarks.forEach((am: any) => {
      const subj = am.activity.subject;
      if (!subjectMap[subj.code]) {
        subjectMap[subj.code] = { total: 0, count: 0, name: subj.name };
      }
      subjectMap[subj.code].total += (am.score / am.activity.totalMarks) * 100;
      subjectMap[subj.code].count += 1;
    });

    const subjectAverages = Object.keys(subjectMap).map((code) => ({
      name: subjectMap[code].name,
      average: Math.round(subjectMap[code].total / subjectMap[code].count),
    }));

    const gradesSummary = [
      ...grades.map(
        (g: any) =>
          `- ${g.subject.name} ${g.type}: ${g.score}/${g.maxScore} (${Math.round((g.score / g.maxScore) * 100)}%) — ${g.comments || "No comment"}`
      ),
      ...activityMarks.map(
        (am: any) =>
          `- ${am.activity.subject.name} Activity "${am.activity.name}": ${am.score}/${am.activity.totalMarks} (${Math.round((am.score / am.activity.totalMarks) * 100)}%) — Class Activity`
      ),
    ].join("\n");

    const systemPrompt = buildStudentChatSystemPrompt({
      studentName: student.user.name,
      className: student.class.name,
      subjectAverages,
      gradesSummary,
    });

    const response = await generateAIResponse(systemPrompt, message.trim());

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Student AI Chat Error:", error);

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
