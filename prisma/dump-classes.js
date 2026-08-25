const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const students = await prisma.studentProfile.findMany({
    include: {
      class: true,
      user: true,
    }
  });
  console.log("=== STUDENTS & CLASSES ===");
  students.forEach((s) => {
    console.log(`Student: ${s.user.name} (${s.user.email}) -> Class: ${s.class ? s.class.name : "None"}`);
  });
  
  const classes = await prisma.class.findMany({
    include: {
      classIncharge: { include: { user: true } }
    }
  });
  console.log("\n=== CLASSES & INCHARGES ===");
  classes.forEach((c) => {
    console.log(`Class: ${c.name} (Incharge: ${c.classIncharge ? c.classIncharge.user.name : "None"})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
