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
        inchargeClass: true,
        assignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      } as any,
    }) as any;

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 401 });
    }

    // Class Incharge info
    const classIncharge = teacher.inchargeClass
      ? {
          id: teacher.inchargeClass.id,
          name: teacher.inchargeClass.name,
          isIncharge: true,
        }
      : null;

    // Group other teaching classes and map their subjects
    const teachingClassesMap: Record<string, { id: string; name: string; subjects: string[] }> = {};

    teacher.assignments.forEach((assign: any) => {
      const cls = assign.class;
      const subj = assign.subject;

      if (classIncharge && cls.id === classIncharge.id) {
        return;
      }

      if (!teachingClassesMap[cls.id]) {
        teachingClassesMap[cls.id] = {
          id: cls.id,
          name: cls.name,
          subjects: [],
        };
      }

      if (!teachingClassesMap[cls.id].subjects.includes(subj.name)) {
        teachingClassesMap[cls.id].subjects.push(subj.name);
      }
    });

    const teachingClasses = Object.values(teachingClassesMap);

    return NextResponse.json({
      classIncharge,
      teachingClasses,
    });
  } catch (err: any) {
    console.error("GET Teacher Classes Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
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

    // Check if they are already incharge of a class
    if (teacher.inchargeClass) {
      return NextResponse.json({ error: "You are already Class Incharge of a class. Delete or reassign that class first." }, { status: 400 });
    }

    // Check if class name is unique
    const existingClass = await prisma.class.findUnique({
      where: { name: name.trim() },
    });

    if (existingClass) {
      return NextResponse.json({ error: "A class with this name already exists" }, { status: 400 });
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        classInchargeId: teacher.id,
      } as any,
    });

    return NextResponse.json({
      success: true,
      class: {
        id: newClass.id,
        name: newClass.name,
      },
    });
  } catch (err: any) {
    console.error("POST Create Class Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
