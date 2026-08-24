import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.userId as string },
      include: {
        class: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get student's grades
    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
      orderBy: { date: "desc" },
    });

    // Get student's AI recommendations
    const recommendations = await prisma.aIRecommendation.findMany({
      where: { studentProfileId: student.id },
      orderBy: { createdAt: "desc" },
    });

    // Calculate subject-wise performance averages
    const subjectStatsMap: { [key: string]: { total: number; count: number; name: string } } = {};
    grades.forEach((g: any) => {
      if (!subjectStatsMap[g.subject.code]) {
        subjectStatsMap[g.subject.code] = { total: 0, count: 0, name: g.subject.name };
      }
      subjectStatsMap[g.subject.code].total += (g.score / g.maxScore) * 100;
      subjectStatsMap[g.subject.code].count += 1;
    });

    const subjectAverages = Object.keys(subjectStatsMap).map((code) => ({
      code,
      name: subjectStatsMap[code].name,
      average: Math.round(subjectStatsMap[code].total / subjectStatsMap[code].count),
    }));

    const s = student as any;
    // Determine Next Best Action based on lowest score
    let nextBestAction = {
      action: "Review syllabus overview",
      reason: "Start by checking subject resources to build a solid study plan.",
    };

    let personalizedActionPlan: string[] = [
      "Keep attending all classes consistently.",
      "Submit all weekly practice quizzes.",
    ];

    const lowGrades = grades.filter((g: any) => (g.score / g.maxScore) * 100 < 65);
    if (lowGrades.length > 0) {
      const worst = lowGrades[0];
      nextBestAction = {
        action: `Practice ${worst.subject.name} quizzes`,
        reason: `Your score of ${Math.round((worst.score / worst.maxScore) * 100)}% on the last assessment is below average.`,
      };
      personalizedActionPlan = [
        `Dedicate 30 mins extra daily to ${worst.subject.name}.`,
        `Solve past assessment problems for ${worst.subject.name}.`,
        `Ask your teacher for feedback on: "${worst.comments || 'recent quizzes'}"`,
      ];
    } else if (grades.length > 0) {
      const top = grades[0];
      nextBestAction = {
        action: `Explore advanced topics in ${top.subject.name}`,
        reason: `Excellent score of ${Math.round((top.score / top.maxScore) * 100)}% on your latest exam.`,
      };
    }

    return NextResponse.json({
      student: {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        class: s.class.name,
        classId: s.classId,
      },
      grades: grades.map((g: any) => ({
        id: g.id,
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
      recommendations,
      nextBestAction,
      personalizedActionPlan,
    });
  } catch (error) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
