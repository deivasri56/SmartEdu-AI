const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const adapter = new PrismaBetterSqlite3({
  url: "file:" + path.resolve(__dirname, "../dev.db"),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true },
  });
  console.log("=== ALL USERS ===");
  users.forEach((u) => console.log(u.role.padEnd(8), u.email.padEnd(35), u.name));
  console.log("\nTotal:", users.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
