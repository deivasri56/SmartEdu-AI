import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const activityId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    // Find activity and verify subject ownership
    const activity = await (prisma as any).subjectActivity.findUnique({
      where: { id: activityId },
      include: {
        subject: true,
      },
    }) as any;

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const isClassIncharge = teacher.inchargeClass?.id === activity.subject.classId;
    const isSubjectIncharge = activity.subject.subjectInchargeId === teacher.id;

    if (!isClassIncharge && !isSubjectIncharge) {
      return NextResponse.json(
        { error: "Access Denied: You do not manage this subject" },
        { status: 403 }
      );
    }

    const { marks } = await req.json(); // { [studentId]: score }

    if (!marks || typeof marks !== "object") {
      return NextResponse.json({ error: "Marks object is required" }, { status: 400 });
    }

    // Upsert marks for each student
    const promises = Object.entries(marks).map(async ([studentProfileId, score]) => {
      return (prisma as any).activityMark.upsert({
        where: {
          activityId_studentProfileId: {
            activityId,
            studentProfileId,
          },
        },
        update: {
          score: Number(score),
        },
        create: {
          activityId,
          studentProfileId,
          score: Number(score),
        },
      });
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Save Activity Marks Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
