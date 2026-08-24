import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id: classId } = params;

    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.userId as string },
      include: {
        inchargeClass: true,
      } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Check if the class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // If teacher is Class Incharge for this class, delete the class entirely
    if (teacher.inchargeClass?.id === classId) {
      await prisma.class.delete({
        where: { id: classId },
      });
      return NextResponse.json({ message: "Class deleted successfully" });
    }

    // If they are not Class Incharge, check if they are assigned to teach in this class
    const assignments = await prisma.teacherSubjectClass.findMany({
      where: {
        teacherProfileId: teacher.id,
        classId: classId,
      },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ error: "Unauthorized to delete or disassociate this class" }, { status: 403 });
    }

    // Delete the assignments (disassociate teaching class)
    await prisma.teacherSubjectClass.deleteMany({
      where: {
        teacherProfileId: teacher.id,
        classId: classId,
      },
    });

    return NextResponse.json({ message: "Teaching assignments for this class removed successfully" });
  } catch (err: any) {
    console.error("DELETE Class Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
