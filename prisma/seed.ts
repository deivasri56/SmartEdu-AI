import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding...");

  // Clear existing data
  await prisma.aIRecommendation.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.teacherSubjectClass.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  // Create password hashes
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const teacherPasswordHash = await bcrypt.hash("teacher123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  // 1. Create Admins
  const admin = await prisma.user.create({
    data: {
      email: "admin@smartedu.com",
      name: "Principal Arthur",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create Teachers
  const teacher1User = await prisma.user.create({
    data: {
      email: "teacher1@smartedu.com",
      name: "Dr. Sarah Jenkins",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
    },
  });
  const teacher1Profile = await prisma.teacherProfile.create({
    data: { userId: teacher1User.id },
  });

  const teacher2User = await prisma.user.create({
    data: {
      email: "teacher2@smartedu.com",
      name: "Prof. Alex Carter",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
    },
  });
  const teacher2Profile = await prisma.teacherProfile.create({
    data: { userId: teacher2User.id },
  });
  console.log("Created teachers");

  // 3. Create Classes
  const classA = await prisma.class.create({
    data: { 
      name: "Class 10-A",
      classInchargeId: teacher1Profile.id
    },
  });
  const classB = await prisma.class.create({
    data: { name: "Class 10-B" },
  });
  console.log("Created classes");

  // 4. Create Subjects
  const math = await prisma.subject.create({
    data: { 
      name: "Mathematics", 
      code: "MATH101",
      classId: classA.id,
      credits: 4,
      subjectInchargeId: teacher1Profile.id
    },
  });
  const science = await prisma.subject.create({
    data: { 
      name: "Science", 
      code: "SCI101",
      classId: classA.id,
      credits: 4,
      subjectInchargeId: teacher2Profile.id
    },
  });
  const english = await prisma.subject.create({
    data: { 
      name: "English", 
      code: "ENG101",
      classId: classB.id,
      credits: 3,
      subjectInchargeId: teacher2Profile.id
    },
  });
  console.log("Created subjects");

  // 5. Map Teachers to Classes and Subjects
  // Dr. Jenkins teaches Math in 10-A and 10-B
  await prisma.teacherSubjectClass.create({
    data: {
      teacherProfileId: teacher1Profile.id,
      subjectId: math.id,
      classId: classA.id,
    },
  });
  await prisma.teacherSubjectClass.create({
    data: {
      teacherProfileId: teacher1Profile.id,
      subjectId: math.id,
      classId: classB.id,
    },
  });

  // Prof. Carter teaches Science in 10-A and English in 10-B
  await prisma.teacherSubjectClass.create({
    data: {
      teacherProfileId: teacher2Profile.id,
      subjectId: science.id,
      classId: classA.id,
    },
  });
  await prisma.teacherSubjectClass.create({
    data: {
      teacherProfileId: teacher2Profile.id,
      subjectId: english.id,
      classId: classB.id,
    },
  });
  console.log("Created teacher assignments");

  // 6. Create Students
  const student1User = await prisma.user.create({
    data: {
      email: "student1@smartedu.com",
      name: "Emma Watson",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
    },
  });
  const student1Profile = await prisma.studentProfile.create({
    data: {
      userId: student1User.id,
      classId: classA.id,
      rollNumber: "1001",
    },
  });

  const student2User = await prisma.user.create({
    data: {
      email: "student2@smartedu.com",
      name: "John Doe",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
    },
  });
  const student2Profile = await prisma.studentProfile.create({
    data: {
      userId: student2User.id,
      classId: classA.id,
      rollNumber: "1002",
    },
  });

  const student3User = await prisma.user.create({
    data: {
      email: "student3@smartedu.com",
      name: "Sophia Lee",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
    },
  });
  const student3Profile = await prisma.studentProfile.create({
    data: {
      userId: student3User.id,
      classId: classB.id,
      rollNumber: "1003",
    },
  });
  console.log("Created students");

  // 7. Seed Grades
  // Emma Watson (Class A): Math (Needs help), Science (Excellent)
  const emmaGrades = [
    { subjectId: math.id, type: "Exam", score: 62.0, maxScore: 100.0, comments: "Struggled with trigonometry" },
    { subjectId: math.id, type: "Quiz", score: 58.0, maxScore: 100.0, comments: "Needs to practice algebraic equations" },
    { subjectId: math.id, type: "Assignment", score: 75.0, maxScore: 100.0, comments: "Decent homework submission" },
    { subjectId: science.id, type: "Exam", score: 95.0, maxScore: 100.0, comments: "Superb understanding of thermodynamics" },
    { subjectId: science.id, type: "Quiz", score: 98.0, maxScore: 100.0, comments: "Perfect score on lab quiz" },
    { subjectId: science.id, type: "Assignment", score: 90.0, maxScore: 100.0, comments: "Well documented biology project" },
  ];

  // John Doe (Class A): Math (Average), Science (Average)
  const johnGrades = [
    { subjectId: math.id, type: "Exam", score: 78.0, maxScore: 100.0, comments: "Solid performance, minor calculation errors" },
    { subjectId: math.id, type: "Quiz", score: 82.0, maxScore: 100.0, comments: "Good class response" },
    { subjectId: science.id, type: "Exam", score: 72.0, maxScore: 100.0, comments: "Satisfactory performance" },
    { subjectId: science.id, type: "Quiz", score: 75.0, maxScore: 100.0, comments: "Average progress" },
  ];

  // Sophia Lee (Class B): Math (Outstanding), English (Excellent)
  const sophiaGrades = [
    { subjectId: math.id, type: "Exam", score: 98.0, maxScore: 100.0, comments: "Flawless math logic" },
    { subjectId: math.id, type: "Quiz", score: 100.0, maxScore: 100.0, comments: "Outstanding" },
    { subjectId: english.id, type: "Exam", score: 92.0, maxScore: 100.0, comments: "Great essay structure and vocabulary" },
    { subjectId: english.id, type: "Quiz", score: 88.0, maxScore: 100.0, comments: "Good grammar comprehension" },
  ];

  for (const grade of emmaGrades) {
    await prisma.grade.create({ data: { ...grade, studentProfileId: student1Profile.id } });
  }
  for (const grade of johnGrades) {
    await prisma.grade.create({ data: { ...grade, studentProfileId: student2Profile.id } });
  }
  for (const grade of sophiaGrades) {
    await prisma.grade.create({ data: { ...grade, studentProfileId: student3Profile.id } });
  }
  console.log("Created grades");

  // 8. Seed AI Recommendations
  await prisma.aIRecommendation.create({
    data: {
      studentProfileId: student1Profile.id,
      type: "academic_insight",
      title: "Algebra & Trigonometry Guidance Needed",
      content: "Emma is demonstrating a 33% gap in Mathematics compared to her peer group. While her science scores are stellar (94.3% average), her math performance sits at 65%. Focused study sessions in trigonometric identities and algebraic functions are highly recommended to bridge this gap.",
    },
  });
  await prisma.aIRecommendation.create({
    data: {
      studentProfileId: student1Profile.id,
      type: "prediction",
      title: "Projected Final Science Grade",
      content: "Based on Emma's recent exam and quiz trajectory in Science, she is projected to score a high 'A' (96-98%) in the finals. She displays great scientific reasoning and research skills.",
    },
  });

  await prisma.aIRecommendation.create({
    data: {
      studentProfileId: student2Profile.id,
      type: "general",
      title: "Keep Up the Steady Progress",
      content: "John is maintaining a consistent 'B' grade profile. To break into the 'A' range, John should focus on reviewing teacher feedback on exam papers to address recurring minor execution mistakes.",
    },
  });

  await prisma.aIRecommendation.create({
    data: {
      studentProfileId: student3Profile.id,
      type: "academic_insight",
      title: "Advanced Math Track Recommendation",
      content: "Sophia holds a near-perfect 99% average in Mathematics. She is prime for advanced placement (AP) math prep, extension tasks, or mathematics competitions.",
    },
  });

  console.log("Seeding complete successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
