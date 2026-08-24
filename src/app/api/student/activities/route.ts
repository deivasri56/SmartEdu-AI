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
    }) as any;

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Fetch all subjects for this student's class
    const subjects = await prisma.subject.findMany({
      where: { classId: student.classId } as any,
      include: {
        activities: {
          include: {
            marks: {
              where: { studentProfileId: student.id },
            },
          },
        },
      } as any,
    }) as any[];

    // Format activities and marks
    const activitiesList: any[] = [];
    subjects.forEach((sub) => {
      sub.activities.forEach((act: any) => {
        const score = act.marks[0]?.score ?? null;
        activitiesList.push({
          id: act.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          activityName: act.name,
          date: act.date,
          totalMarks: act.totalMarks,
          score,
        });
      });
    });

    return NextResponse.json({ activities: activitiesList });
  } catch (err: any) {
    console.error("GET Student Activities Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
