import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Get teacher's class and subject assignments
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: { teacherProfileId: teacher.id },
      include: {
        class: true,
        subject: true,
      },
    });

    const classIds = assignments.map((a: any) => a.classId);
    const uniqueClassIds = Array.from(new Set(classIds));

    // Get all students enrolled in teacher's assigned classes
    const students = uniqueClassIds.length > 0 ? await prisma.studentProfile.findMany({
      where: { classId: { in: uniqueClassIds } },
      include: {
        class: true,
        user: { select: { name: true, email: true } },
        grades: {
          include: { subject: true },
        },
      },
    }) : [];

    // Compute academic performance metrics
    // Calculate class averages for the subjects taught by this teacher
    const subjectIdsTaught = assignments.map((a: any) => a.subjectId);
    const subjectAverages = await Promise.all(
      assignments.map(async (assign: any) => {
        const gradesForClassSubject = await prisma.grade.findMany({
          where: {
            subjectId: assign.subjectId,
            student: { classId: assign.classId },
          },
        });
        
        let avg = 0;
        if (gradesForClassSubject.length > 0) {
          const sum = gradesForClassSubject.reduce((acc: number, g: any) => acc + (g.score / g.maxScore) * 100, 0);
          avg = Math.round(sum / gradesForClassSubject.length);
        }

        return {
          classId: assign.classId,
          className: assign.class.name,
          subjectId: assign.subjectId,
          subjectName: assign.subject.name,
          subjectCode: assign.subject.code,
          average: avg,
          submissionsCount: gradesForClassSubject.length,
        };
      })
    );

    // Format students list
    const studentsFormatted = students.map((s: any) => {
      // Filter grades to only show ones relevant to this teacher's subjects
      const relevantGrades = s.grades.filter((g: any) => subjectIdsTaught.includes(g.subjectId));
      let gpaPercentage = 0;
      if (relevantGrades.length > 0) {
        gpaPercentage = Math.round(
          relevantGrades.reduce((acc: number, g: any) => acc + (g.score / g.maxScore) * 100, 0) / relevantGrades.length
        );
      }

      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        class: s.class.name,
        gpa: gpaPercentage,
        totalGradesRecorded: relevantGrades.length,
      };
    });

    // Compute Next Best Action for Teacher
    let nextBestAction = {
      action: "Create your first class",
      reason: "Get started by defining classes, subjects, and credits.",
    };

    // Calculate early interventions (flag students under 65% GPA)
    const earlyInterventions = studentsFormatted
      .filter((s: any) => s.gpa > 0 && s.gpa < 65)
      .map((s: any) => {
        const riskLevel = s.gpa < 50 ? "high" : "medium";
        return {
          id: s.id,
          studentName: s.name,
          className: s.class,
          gpa: s.gpa,
          riskLevel,
          suggestedIntervention: `Schedule a 1-on-1 feedback session and assign a targeted revision worksheet.`,
        };
      });

    if (earlyInterventions.length > 0) {
      const worst = earlyInterventions[0];
      nextBestAction = {
        action: `Intervene for ${worst.studentName}`,
        reason: `Student's overall grade has dropped to ${worst.gpa}%. Intervention recommended.`,
      };
    } else if (assignments.length > 0) {
      nextBestAction = {
        action: `Review curriculum for ${assignments[0].subject.name}`,
        reason: `Assigned class ${assignments[0].class.name} has all students in good standing. Boost learning with advanced challenges.`,
      };
    }

    const t = teacher as any;
    return NextResponse.json({
      teacher: {
        id: t.id,
        name: t.user.name,
      },
      assignments: assignments.map((a: any) => ({
        id: a.id,
        className: a.class.name,
        classId: a.classId,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        subjectId: a.subjectId,
      })),
      students: studentsFormatted,
      classPerformance: subjectAverages,
      nextBestAction,
      earlyInterventions,
    });
  } catch (error) {
    console.error("Teacher Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
