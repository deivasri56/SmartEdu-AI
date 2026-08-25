import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateStructuredAIResponse } from "@/lib/gemini";

const CAREER_SYSTEM_PROMPT = `You are an expert Career Advisor and Skill Gap Analyst AI for students.
You will be given the student's academic performance data (grades and class activity marks) along with their target career role.

Analyze their academic profile against the selected career and produce a comprehensive career readiness report.

Return a JSON object with this EXACT structure:
{
  "careerOverview": {
    "title": "Software Engineer",
    "description": "Brief 2-3 sentence description of what this role involves",
    "averageSalary": "$85,000 - $150,000/year",
    "demandLevel": "high" | "medium" | "low",
    "industryGrowth": "15% over next 5 years"
  },
  "requiredSkills": {
    "technical": [
      { "skill": "Data Structures & Algorithms", "importance": "critical" | "important" | "nice-to-have", "description": "Foundation for solving complex problems efficiently" }
    ],
    "soft": [
      { "skill": "Communication", "importance": "critical" | "important" | "nice-to-have", "description": "Collaborate with cross-functional teams" }
    ],
    "tools": [
      { "name": "Git/GitHub", "category": "Version Control", "description": "Industry-standard source code management" }
    ],
    "certifications": [
      { "name": "AWS Cloud Practitioner", "provider": "Amazon", "level": "Beginner", "relevance": "Cloud deployment is standard in modern development" }
    ]
  },
  "existingSkills": [
    { "skill": "Data Analysis", "level": "Beginner" | "Intermediate" | "Advanced", "source": "Scored 85% average in Statistics", "matchStrength": "strong" | "moderate" | "weak" }
  ],
  "skillGaps": [
    { "skill": "Machine Learning", "priority": "high" | "medium" | "low", "reason": "Core requirement for Data Science roles", "howToLearn": "Take an online ML course on Coursera or edX" }
  ],
  "roadmap": [
    {
      "phase": "Phase 1: Build Foundations",
      "timeframe": "Month 1-2",
      "actions": ["Learn Python basics", "Complete a beginner coding course"],
      "milestones": ["Build first project", "Complete 50 coding challenges"],
      "resources": ["freeCodeCamp", "LeetCode"]
    }
  ],
  "readinessScore": 45,
  "keyInsight": "A brief motivational summary sentence about their career readiness"
}

IMPORTANT RULES:
- Provide exactly 3 technical skills, 2 soft skills, 2 tools, and 1 certification.
- Generate exactly 2 roadmap phases covering a realistic journey.
- The readinessScore should be 0-100 based on how well the student's current academics align with the career.
- If the student has relevant subject scores, reference them specifically in existingSkills.
- Be specific and actionable — avoid generic advice.`;

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
      include: {
        class: true,
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
    });

    // Fetch activity marks
    const activityMarks = await prisma.activityMark.findMany({
      where: { studentProfileId: student.id },
      include: {
        activity: {
          include: { subject: true },
        },
      },
    });

    const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

    if (!isGeminiAvailable) {
      // Fallback response when Gemini is not configured
      const fallbackAnalysis = {
        careerOverview: {
          title: careerRole,
          description: `${careerRole} is a dynamic career path with excellent growth opportunities. AI analysis is not available — please configure GEMINI_API_KEY for personalized insights.`,
          averageSalary: "Varies by location and experience",
          demandLevel: "high" as const,
          industryGrowth: "Growing steadily",
        },
        requiredSkills: {
          technical: [
            { skill: "Core Domain Knowledge", importance: "critical" as const, description: "Fundamental understanding of the field" },
            { skill: "Problem Solving", importance: "critical" as const, description: "Analytical thinking and troubleshooting" },
          ],
          soft: [
            { skill: "Communication", importance: "critical" as const, description: "Clear professional communication" },
          ],
          tools: [
            { name: "Industry Standard Tools", category: "General", description: "Tools specific to the career path" },
          ],
          certifications: [
            { name: "Domain-specific Certification", provider: "Various", level: "Beginner", relevance: "Validates foundational knowledge" },
          ],
        },
        existingSkills: [
          { skill: "Academic Foundation", level: "Intermediate", source: "Current coursework", matchStrength: "moderate" as const },
        ],
        skillGaps: [
          { skill: `${careerRole} Specialization`, priority: "high" as const, reason: "Required for entry-level positions", howToLearn: "Record assessment data for AI-powered analysis" },
        ],
        roadmap: [
          { phase: "Phase 1: Record Your Academics", timeframe: "Now", actions: ["Complete classroom assessments", "Build your academic profile"], milestones: ["All subjects graded"], resources: ["SmartEdu AI Platform"] },
        ],
        readinessScore: 30,
        keyInsight: "Add your assessment data to get a personalized AI-powered career roadmap!",
      };
      return NextResponse.json({ analysis: fallbackAnalysis });
    }

    // Build combined academic data
    const allAssessments = [
      ...grades.map((g: any) => ({
        subject: g.subject.name,
        type: g.type,
        score: g.score,
        maxScore: g.maxScore,
        percentage: Math.round((g.score / g.maxScore) * 100),
      })),
      ...activityMarks.map((am: any) => ({
        subject: am.activity.subject.name,
        type: `Activity: ${am.activity.name}`,
        score: am.score,
        maxScore: am.activity.totalMarks,
        percentage: Math.round((am.score / am.activity.totalMarks) * 100),
      })),
    ];

    // Calculate subject averages
    const subjectMap: Record<string, { total: number; count: number }> = {};
    allAssessments.forEach((a) => {
      if (!subjectMap[a.subject]) {
        subjectMap[a.subject] = { total: 0, count: 0 };
      }
      subjectMap[a.subject].total += a.percentage;
      subjectMap[a.subject].count += 1;
    });

    const subjectAverages = Object.entries(subjectMap).map(([name, data]) => ({
      subject: name,
      average: Math.round(data.total / data.count),
    }));

    const dataPayload = {
      studentName: student.user.name,
      className: student.class.name,
      careerRole,
      assessments: allAssessments,
      subjectAverages,
      totalAssessments: allAssessments.length,
    };

    const analysis = await generateStructuredAIResponse<any>(
      CAREER_SYSTEM_PROMPT,
      JSON.stringify(dataPayload)
    );

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("Career API error:", err);
    return NextResponse.json({ error: "Failed to perform skill gap analysis. Please try again." }, { status: 500 });
  }
}
