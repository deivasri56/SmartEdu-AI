import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch classes, subjects, teachers, and student rosters to build relationships
    const classes = await prisma.class.findMany();
    const subjects = await prisma.subject.findMany();
    const students = await prisma.studentProfile.findMany({
      include: { user: { select: { name: true } } },
    });
    const teachers = await prisma.teacherProfile.findMany({
      include: { user: { select: { name: true } } },
    });
    const assignments = await prisma.teacherSubjectClass.findMany({
      include: { class: true, subject: true, teacher: { include: { user: { select: { name: true } } } } },
    });

    // Format into nodes and links for force graph visualization
    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Add class nodes
    classes.forEach((c: any) => {
      nodes.push({ id: `class-${c.id}`, label: c.name, type: "class" });
    });

    // 2. Add subject nodes
    subjects.forEach((s: any) => {
      nodes.push({ id: `subject-${s.id}`, label: s.name, type: "subject" });
    });

    // 3. Add student nodes and link them to their classes
    students.forEach((s: any) => {
      nodes.push({ id: `student-${s.id}`, label: s.user.name, type: "student" });
      links.push({
        source: `student-${s.id}`,
        target: `class-${s.classId}`,
        label: "enrolled in",
      });
    });

    // 4. Add teacher nodes
    teachers.forEach((t: any) => {
      nodes.push({ id: `teacher-${t.id}`, label: t.user.name, type: "teacher" });
    });

    // 5. Connect assignments (Teacher -> Subject -> Class)
    assignments.forEach((a: any) => {
      // Connect Teacher -> Class
      links.push({
        source: `teacher-${a.teacherProfileId}`,
        target: `class-${a.classId}`,
        label: `teaches`,
      });

      // Connect Class -> Subject
      links.push({
        source: `class-${a.classId}`,
        target: `subject-${a.subjectId}`,
        label: `learns`,
      });
    });

    return NextResponse.json({ nodes, links });
  } catch (err: any) {
    console.error("Knowledge Graph API error:", err);
    return NextResponse.json({ error: "Failed to build graph data" }, { status: 500 });
  }
}
