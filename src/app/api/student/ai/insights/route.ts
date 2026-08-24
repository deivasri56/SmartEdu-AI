// Student AI Insights API — Generates structured academic analysis using agentic workflow
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runStudentAgenticWorkflow } from "@/lib/agentic-workflow";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // Validate session inside start block or just before stream creation
  let session: any = null;
  try {
    session = await getSession(req);
  } catch (err) {
    // Ignore, handoff to stream
  }

  if (!session || session.role !== "STUDENT") {
    return new Response(
      encoder.encode(JSON.stringify({ step: "error", message: "Unauthorized" }) + "\n"),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch student profile
  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.userId as string },
    include: {
      class: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!student) {
    return new Response(
      encoder.encode(JSON.stringify({ step: "error", message: "Student profile not found" }) + "\n"),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch all grades for this student
  const grades = await prisma.grade.findMany({
    where: { studentProfileId: student.id },
    include: { subject: true },
    orderBy: { date: "desc" },
  });

  if (grades.length === 0) {
    return new Response(
      JSON.stringify({
        insights: null,
        message: "No grades recorded yet. AI insights will appear once you have assessment data.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Calculate subject averages
  const subjectMap: Record<string, { total: number; count: number; name: string }> = {};
  grades.forEach((g: any) => {
    if (!subjectMap[g.subject.code]) {
      subjectMap[g.subject.code] = { total: 0, count: 0, name: g.subject.name };
    }
    subjectMap[g.subject.code].total += (g.score / g.maxScore) * 100;
    subjectMap[g.subject.code].count += 1;
  });

  const subjectAverages = Object.keys(subjectMap).map((code) => ({
    code,
    name: subjectMap[code].name,
    average: Math.round(subjectMap[code].total / subjectMap[code].count),
  }));

  const inputData = {
    studentName: student.user.name,
    className: student.class.name,
    grades: grades.map((g: any) => ({
      subject: g.subject.name,
      code: g.subject.code,
      type: g.type,
      score: g.score,
      maxScore: g.maxScore,
      percentage: Math.round((g.score / g.maxScore) * 100),
      date: g.date.toISOString().split("T")[0],
      comments: g.comments,
    })),
    subjectAverages,
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of runStudentAgenticWorkflow(inputData)) {
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
