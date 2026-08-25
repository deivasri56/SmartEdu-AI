const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Find the class
  const targetClass = await prisma.class.findFirst({
    where: { name: "CSE III-A" }
  });
  
  if (!targetClass) {
    console.error("Class 'CSE III-A' not found. Please create it first.");
    return;
  }
  
  console.log(`Found Class: ${targetClass.name} (ID: ${targetClass.id})`);

  // Emails of students to link
  const studentEmails = [
    "deivasri@smartedu.com",
    "gurupriya@smartedu.com",
    "keerthana@smartedu.com",
    "jasmine@smartedu.com",
    "monisha@smartedu.com"
  ];

  let rollNumberCounter = 101;

  for (const email of studentEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User not found for ${email}. Skipping.`);
      continue;
    }

    // Check if student profile already exists
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id }
    });

    if (studentProfile) {
      // Update existing student profile class
      studentProfile = await prisma.studentProfile.update({
        where: { id: studentProfile.id },
        data: { classId: targetClass.id }
      });
      console.log(`Updated Student: ${user.name} -> Class: ${targetClass.name}`);
    } else {
      // Create new student profile
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          classId: targetClass.id,
          rollNumber: `CSE${rollNumberCounter++}`
        }
      });
      console.log(`Created Student Profile: ${user.name} -> Class: ${targetClass.name} (Roll: ${studentProfile.rollNumber})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
