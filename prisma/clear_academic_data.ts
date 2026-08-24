import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function clearData() {
  console.log("Clearing academic records, activities, grades, subjects, classes, teacher assignments, and recommendations...");

  await prisma.activityMark.deleteMany({});
  await prisma.subjectActivity.deleteMany({});
  await prisma.aIRecommendation.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.teacherSubjectClass.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});

  console.log("Academic data cleared successfully! Base users (Admin/Teachers) have been preserved.");
}

clearData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
