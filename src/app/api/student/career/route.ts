import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateStructuredAIResponse } from "@/lib/gemini";

const CAREER_SYSTEM_PROMPT = `You are the Career Skill Gap Analyst AI.
Analyze the student's academic performance and compare it to the selected career path.
Identify existing skills, missing/gap skills, and generate a development roadmap.
Return a JSON object with this EXACT structure:
{
  "existingSkills": [
    { "skill": "Data Analysis", "level": "Intermediate", "source": "A average in Statistics" }
  ],
  "missingSkills": [
    { "skill": "Machine Learning", "priority": "high" | "medium" | "low", "reason": "Required for Data Science roles" }
  ],
  "roadmap": [
    { "phase": "Phase 1: Foundations", "actions": ["Action 1", "Action 2"], "timeframe": "1-2 Months" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { careerRole } = await req.json();
    if (!careerRole) {
      return NextResponse.json({ error: "Missing careerRole parameter" }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.userId as string },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
    });

    const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

    if (!isGeminiAvailable || grades.length === 0) {
      // Fallback response
      const fallbackAnalysis = {
        existingSkills: [
          { skill: "Foundational Aptitude", level: "Intermediate", source: "Registered student profile class group" }
        ],
        missingSkills: [
          { skill: `${careerRole} Core Tools`, priority: "high", reason: "Directly utilized in the target industry" }
        ],
        roadmap: [
          { phase: "Academic Setup", actions: ["Record your classroom subjects and assessments first", `Build a basic ${careerRole} project`], timeframe: "Next 4 weeks" }
        ]
      };
      return NextResponse.json({ analysis: fallbackAnalysis });
    }

    const dataPayload = {
      careerRole,
      grades: grades.map((g: any) => ({
        subject: g.subject.name,
        score: g.score,
        maxScore: g.maxScore,
      })),
    };

    const analysis = await generateStructuredAIResponse<any>(
      CAREER_SYSTEM_PROMPT,
      JSON.stringify(dataPayload)
    );

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Career API error:", err);
    return NextResponse.json({ error: "Failed to perform skill gap analysis" }, { status: 500 });
  }
}
