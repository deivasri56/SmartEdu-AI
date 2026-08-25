const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const assignments = await prisma.teacherSubjectClass.findMany({
    include: {
      teacher: { include: { user: true } },
      subject: true,
      class: true
    }
  });
  console.log("=== TEACHER SUBJECT CLASS MAPS ===");
  assignments.forEach((a) => {
    console.log(`Teacher: ${a.teacher.user.name} teaches ${a.subject.name} (Code: ${a.subject.code}) to Class: ${a.class.name}`);
  });

  const subjects = await prisma.subject.findMany({
    include: {
      class: true,
      subjectIncharge: { include: { user: true } }
    }
  });
  console.log("\n=== ALL SUBJECTS ===");
  subjects.forEach((s) => {
    console.log(`Subject: ${s.name} (${s.code}) -> Class: ${s.class ? s.class.name : "None"} -> Incharge: ${s.subjectIncharge ? s.subjectIncharge.user.name : "None"}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
