import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: list subjects of a class. If class incharge, show all. If subject teacher, show only their assigned subject(s).
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const classId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    const isIncharge = teacher.inchargeClass?.id === classId;

    // Check teacher assignments to this class
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: {
        teacherProfileId: teacher.id,
        classId,
      },
    });

    if (!isIncharge && assignments.length === 0) {
      return NextResponse.json(
        { error: "Access Denied: You are not assigned to this class" },
        { status: 403 }
      );
    }

    // Query subjects
    let subjects = [];
    if (isIncharge) {
      // Class Incharge sees all subjects created for this class
      subjects = await prisma.subject.findMany({
        where: { classId } as any,
        include: {
          subjectIncharge: {
            include: { user: { select: { name: true } } },
          },
        } as any,
      }) as any[];
    } else {
      // Non-class-incharge teacher only sees subjects they teach in this class
      const taughtSubjectIds = assignments.map((a) => a.subjectId);
      subjects = await prisma.subject.findMany({
        where: {
          id: { in: taughtSubjectIds },
          classId,
        } as any,
        include: {
          subjectIncharge: {
            include: { user: { select: { name: true } } },
          },
        } as any,
      }) as any[];
    }

    // If Class Incharge, also fetch all teachers so they can assign them as Subject Incharge
    let availableTeachers: any[] = [];
    if (isIncharge) {
      const allTeachers = await prisma.teacherProfile.findMany({
        include: { user: { select: { name: true } } },
      }) as any[];

      availableTeachers = allTeachers.map((t) => ({
        id: t.id,
        name: t.user.name,
      }));
    }

    const formattedSubjects = subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      subjectIncharge: sub.subjectIncharge?.user?.name || "Unassigned",
      subjectInchargeId: sub.subjectInchargeId,
    }));

    return NextResponse.json({
      isIncharge,
      subjects: formattedSubjects,
      teachers: availableTeachers,
    });
  } catch (err: any) {
    console.error("GET Class Subjects Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Class Incharge can create a subject for their class
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const classId = params.id;

  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: { inchargeClass: true } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    const isIncharge = teacher.inchargeClass?.id === classId;
    if (!isIncharge) {
      return NextResponse.json(
        { error: "Access Denied: Only the Class Incharge can create subjects" },
        { status: 403 }
      );
    }

    const { name, code, credits, subjectInchargeId } = await req.json();

    if (!name || !code || !credits) {
      return NextResponse.json(
        { error: "Subject Name, Code, and Credits are required" },
        { status: 400 }
      );
    }

    // Create Subject
    const newSubject = await prisma.subject.create({
      data: {
        name,
        code,
        credits: Number(credits),
        classId,
        subjectInchargeId: subjectInchargeId || null,
      } as any,
    });

    // If a Subject Incharge is assigned, also map them in TeacherSubjectClass so they have class access
    if (subjectInchargeId) {
      await prisma.teacherSubjectClass.create({
        data: {
          teacherProfileId: subjectInchargeId,
          subjectId: newSubject.id,
          classId,
        },
      }).catch(() => {
        // Ignore duplicate mapping errors
      });
    }

    return NextResponse.json({ success: true, subject: newSubject });
  } catch (err: any) {
    console.error("POST Create Subject Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
