const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

const students = [
  { name: "Deivasri",  email: "deivasri@smartedu.com",  rollNumber: "REG2024001" },
  { name: "Gurupriya", email: "gurupriya@smartedu.com", rollNumber: "REG2024002" },
  { name: "Keerthana", email: "keerthana@smartedu.com", rollNumber: "REG2024003" },
  { name: "Jasmine",   email: "jasmine@smartedu.com",   rollNumber: "REG2024004" },
  { name: "Monisha",   email: "monisha@smartedu.com",   rollNumber: "REG2024005" },
];

async function main() {
  // Find or create a default class to assign students to
  let defaultClass = await prisma.class.findFirst();

  if (!defaultClass) {
    defaultClass = await prisma.class.create({
      data: { name: "Default Class" },
    });
    console.log("Created class:", defaultClass.name);
  } else {
    console.log("Using existing class:", defaultClass.name);
  }

  const passwordHash = await bcrypt.hash("student123", 10);

  for (const s of students) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } });
    if (existing) {
      console.log("Skipping", s.name, "- already exists");
      continue;
    }

    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: "STUDENT",
        studentProfile: {
          create: {
            rollNumber: s.rollNumber,
            classId: defaultClass.id,
          },
        },
      },
    });
    console.log("Created student:", user.name, "(" + s.rollNumber + ")");
  }

  console.log("\nDone! All students seeded.");
  console.log("Default password for all students: student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
