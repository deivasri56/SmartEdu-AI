const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const deivasri = await prisma.studentProfile.findFirst({
    where: { user: { email: "deivasri@smartedu.com" } },
    include: {
      activityMarks: {
        include: {
          activity: {
            include: { subject: true }
          }
        }
      },
      grades: {
        include: { subject: true }
      }
    }
  });

  if (!deivasri) {
    console.error("Deivasri profile not found");
    return;
  }

  console.log(`=== DEIVASRI DEVIATION PROFILE ===`);
  console.log("Activity Marks Count:", deivasri.activityMarks.length);
  deivasri.activityMarks.forEach((m) => {
    console.log(`Activity: ${m.activity.name} under ${m.activity.subject.name} -> Score: ${m.score}/${m.activity.totalMarks}`);
  });

  console.log("\nGrades Count (Recent Assessments):", deivasri.grades.length);
  deivasri.grades.forEach((g) => {
    console.log(`Grade: ${g.subject.name} (${g.type}) -> Score: ${g.score}/${g.maxScore}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
