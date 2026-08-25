const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Find teacher (Dr. Sarah Jenkins)
  const teacher = await prisma.teacherProfile.findFirst({
    include: { user: true }
  });
  if (!teacher) {
    throw new Error("No teacher found to assign to new classes.");
  }
  console.log(`Using teacher: ${teacher.user.name} (${teacher.id})`);

  // 2. Find students
  const students = await prisma.studentProfile.findMany({
    include: { user: true }
  });
  if (students.length === 0) {
    throw new Error("No students found in DB.");
  }
  console.log(`Found ${students.length} students to enroll.`);

  // 3. Define three new IT classes and subjects
  const classData = [
    {
      className: "IT III-A",
      subjectName: "Cloud Computing",
      subjectCode: "IT301",
    },
    {
      className: "IT III-B",
      subjectName: "Information Security",
      subjectCode: "IT302",
    },
    {
      className: "IT IV-A",
      subjectName: "Artificial Intelligence",
      subjectCode: "IT303",
    },
  ];

  for (const item of classData) {
    // A. Create or find Class
    let cls = await prisma.class.findUnique({
      where: { name: item.className }
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: { name: item.className }
      });
      console.log(`Created Class: ${cls.name}`);
    } else {
      console.log(`Class ${cls.name} already exists`);
    }

    // B. Create or find Subject associated with the Class
    let subject = await prisma.subject.findUnique({
      where: { code: item.subjectCode }
    });
    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          name: item.subjectName,
          code: item.subjectCode,
          credits: 4,
          classId: cls.id,
          subjectInchargeId: teacher.id
        }
      });
      console.log(`Created Subject: ${subject.name} (${subject.code})`);
    } else {
      console.log(`Subject ${subject.code} already exists`);
    }

    // C. Assign Teacher to this Subject and Class
    await prisma.teacherSubjectClass.upsert({
      where: {
        teacherProfileId_subjectId_classId: {
          teacherProfileId: teacher.id,
          subjectId: subject.id,
          classId: cls.id,
        }
      },
      update: {},
      create: {
        teacherProfileId: teacher.id,
        subjectId: subject.id,
        classId: cls.id,
      }
    });
    console.log(`Assigned teacher to ${subject.name} in ${cls.name}`);

    // D. Link subjects to primary student class (CSE III-A) if needed,
    // or insert activity marks directly so they see the subjects.
    const activity = await prisma.subjectActivity.create({
      data: {
        subjectId: subject.id,
        name: "Introduction Assignment",
        totalMarks: 20,
        date: new Date(),
      }
    });
    console.log(`Created Activity: ${activity.name} for ${subject.name}`);

    // Add Activity Marks for all 5 students
    for (const student of students) {
      await prisma.activityMark.upsert({
        where: {
          activityId_studentProfileId: {
            activityId: activity.id,
            studentProfileId: student.id,
          }
        },
        update: {
          score: 18,
        },
        create: {
          activityId: activity.id,
          studentProfileId: student.id,
          score: 18,
        }
      });
      console.log(`Added activity marks in ${subject.name} for ${student.user.name}`);
    }
  }

  console.log("\nSuccessfully seeded classes, subjects, assignments, and student marks!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
