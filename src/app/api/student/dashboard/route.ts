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

    // Get student's grades (assessments/exams/quizzes)
    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
      orderBy: { date: "desc" },
    });

    // Get student's class activity marks
    const activityMarks = await prisma.activityMark.findMany({
      where: { studentProfileId: student.id },
      include: {
        activity: {
          include: { subject: true },
        },
      },
    });

    // Get student's AI recommendations
    const recommendations = await prisma.aIRecommendation.findMany({
      where: { studentProfileId: student.id },
      orderBy: { createdAt: "desc" },
    });

    // Calculate subject-wise performance averages from BOTH grades and activities
    const subjectStatsMap: { [key: string]: { total: number; count: number; name: string } } = {};
    
    // Add grades
    grades.forEach((g: any) => {
      if (!subjectStatsMap[g.subject.code]) {
        subjectStatsMap[g.subject.code] = { total: 0, count: 0, name: g.subject.name };
      }
      subjectStatsMap[g.subject.code].total += (g.score / g.maxScore) * 100;
      subjectStatsMap[g.subject.code].count += 1;
    });

    // Add activity marks
    activityMarks.forEach((am: any) => {
      const subj = am.activity.subject;
      if (!subjectStatsMap[subj.code]) {
        subjectStatsMap[subj.code] = { total: 0, count: 0, name: subj.name };
      }
      subjectStatsMap[subj.code].total += (am.score / am.activity.totalMarks) * 100;
      subjectStatsMap[subj.code].count += 1;
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

    // Check lowest performing score from either grades or activities
    const lowGrades = grades.filter((g: any) => (g.score / g.maxScore) * 100 < 65);
    const lowActivities = activityMarks.filter((am: any) => (am.score / am.activity.totalMarks) * 100 < 65);

    if (lowGrades.length > 0 || lowActivities.length > 0) {
      let worstName = "";
      let worstScore = 100;
      let worstComments = "";

      if (lowGrades.length > 0) {
        const worstGrade = lowGrades[0];
        worstScore = Math.round((worstGrade.score / worstGrade.maxScore) * 100);
        worstName = worstGrade.subject.name;
        worstComments = worstGrade.comments || "";
      }

      if (lowActivities.length > 0) {
        const worstAct = lowActivities[0];
        const actScore = Math.round((worstAct.score / worstAct.activity.totalMarks) * 100);
        if (actScore < worstScore) {
          worstScore = actScore;
          worstName = worstAct.activity.subject.name;
          worstComments = `activity "${worstAct.activity.name}"`;
        }
      }

      nextBestAction = {
        action: `Practice ${worstName} quizzes`,
        reason: `Your score of ${worstScore}% on the last assessment is below average.`,
      };
      personalizedActionPlan = [
        `Dedicate 30 mins extra daily to ${worstName}.`,
        `Solve past assessment problems for ${worstName}.`,
        `Ask your teacher for feedback on: "${worstComments || 'recent activities'}"`,
      ];
    } else if (grades.length > 0 || activityMarks.length > 0) {
      let topName = "";
      let topScore = 0;

      if (grades.length > 0) {
        const topGrade = grades[0];
        topScore = Math.round((topGrade.score / topGrade.maxScore) * 100);
        topName = topGrade.subject.name;
      }

      if (activityMarks.length > 0) {
        const topAct = activityMarks[0];
        const actScore = Math.round((topAct.score / topAct.activity.totalMarks) * 100);
        if (actScore > topScore) {
          topScore = actScore;
          topName = topAct.activity.subject.name;
        }
      }

      nextBestAction = {
        action: `Explore advanced topics in ${topName}`,
        reason: `Excellent score of ${topScore}% on your latest exam.`,
      };
    }

    // Format grades & include activity marks as grades in dashboard recent feed
    const formattedGrades = [
      ...grades.map((g: any) => ({
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
      ...activityMarks.map((am: any) => ({
        id: am.id,
        subject: am.activity.subject.name,
        code: am.activity.subject.code,
        type: `Activity: ${am.activity.name}`,
        score: am.score,
        maxScore: am.activity.totalMarks,
        percentage: Math.round((am.score / am.activity.totalMarks) * 100),
        date: am.activity.date.toISOString().split("T")[0],
        comments: "Class Activity Grade",
      }))
    ];

    // Sort combined roster by date descending
    formattedGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      student: {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        class: s.class.name,
        classId: s.classId,
      },
      grades: formattedGrades,
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

