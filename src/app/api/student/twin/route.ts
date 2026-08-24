import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateStructuredAIResponse } from "@/lib/gemini";

const TWIN_SYSTEM_PROMPT = `You are the Student Digital Twin AI.
Analyze the student's grades and class information. Create an academic digital twin profile.
Return a JSON object with this EXACT structure:
{
  "academicPersona": "A creative title representing their style (e.g. Consistent Diligent Scholar, Hands-on Explorer)",
  "biography": "A 2-3 sentence description of their learning style and performance based on their grades.",
  "subjectMastery": [
    { "subject": "Math", "score": 85 },
    { "subject": "Science", "score": 90 }
  ],
  "learningPatterns": [
    { "pattern": "Active Exam Preparation", "details": "High scores in final tests compared to homework quizzes" }
  ],
  "personalizedInsights": [
    "Insight 1 from database data",
    "Insight 2 from database data"
  ]
}`;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get("studentId");

    let studentId = "";

    // RBAC check
    if (session.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.userId as string },
      });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      studentId = studentProfile.id;
    } else if (session.role === "TEACHER") {
      if (!targetStudentId) {
        return NextResponse.json({ error: "Missing studentId parameter" }, { status: 400 });
      }
      // Check if student belongs to teacher's class
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.userId as string },
      });
      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }
      const student = await prisma.studentProfile.findUnique({
        where: { id: targetStudentId },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      // Check if teacher is class incharge
      const studentClass = await prisma.class.findUnique({
        where: { id: student.classId },
      }) as any;
      const isIncharge = studentClass?.classInchargeId === teacherProfile.id;

      const assignment = await prisma.teacherSubjectClass.findFirst({
        where: {
          teacherProfileId: teacherProfile.id,
          classId: student.classId,
        },
      });

      if (!isIncharge && !assignment) {
        return NextResponse.json({ error: "Access Denied: Student not in your class" }, { status: 403 });
      }
      studentId = targetStudentId;
    } else if (session.role === "ADMIN") {
      if (!targetStudentId) {
        return NextResponse.json({ error: "Missing studentId parameter" }, { status: 400 });
      }
      studentId = targetStudentId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        user: { select: { name: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: { studentProfileId: student.id },
      include: { subject: true },
    });

    const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

    if (!isGeminiAvailable || grades.length === 0) {
      // Fetch subjects for student's class to generate generic progress indicators if database has them
      const classSubjects = await prisma.subject.findMany({
        where: { classId: student.classId } as any,
      });

      const subjectMastery = classSubjects.length > 0
        ? classSubjects.map((s) => ({ subject: s.name, score: 0 }))
        : [{ subject: "No subjects defined yet", score: 0 }];

      // Fallback Digital Twin
      const fallbackTwin = {
        academicPersona: "Active Learner",
        biography: `${student.user.name} is a student in ${student.class.name}. Add classes, subjects, and grades to see AI-driven learning patterns.`,
        subjectMastery,
        learningPatterns: [
          { pattern: "Pending assessments", details: "No activities or grades recorded yet." }
        ],
        personalizedInsights: [
          "Record classroom grades or exams to trigger personalized learning twin maps."
        ]
      };
      return NextResponse.json({ twin: fallbackTwin });
    }

    // Build academic text payload
    const dataPayload = {
      studentName: student.user.name,
      className: student.class.name,
      grades: grades.map((g: any) => ({
        subject: g.subject.name,
        type: g.type,
        score: g.score,
        maxScore: g.maxScore,
        comments: g.comments,
      })),
    };

    const twin = await generateStructuredAIResponse<any>(
      TWIN_SYSTEM_PROMPT,
      JSON.stringify(dataPayload)
    );

    return NextResponse.json({ twin });
  } catch (err: any) {
    console.error("Twin API error:", err);
    return NextResponse.json({ error: "Failed to generate digital twin" }, { status: 500 });
  }
}
