import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const analystPassword = await bcrypt.hash("analyst123", 12);
  const viewerPassword = await bcrypt.hash("viewer123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@finance.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@finance.com",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@finance.com" },
    update: {},
    create: {
      name: "Analyst User",
      email: "analyst@finance.com",
      password: analystPassword,
      role: "ANALYST",
      status: "ACTIVE",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@finance.com" },
    update: {},
    create: {
      name: "Viewer User",
      email: "viewer@finance.com",
      password: viewerPassword,
      role: "VIEWER",
      status: "ACTIVE",
    },
  });

  await prisma.record.createMany({
    data: [
      {
        amount: 50000,
        type: "INCOME",
        category: "Salary",
        date: new Date("2026-01-15"),
        notes: "January salary",
        createdById: admin.id,
      },
      {
        amount: 15000,
        type: "EXPENSE",
        category: "Rent",
        date: new Date("2026-01-05"),
        notes: "January rent",
        createdById: admin.id,
      },
      {
        amount: 5000,
        type: "EXPENSE",
        category: "Food",
        date: new Date("2026-01-20"),
        notes: "Monthly groceries",
        createdById: admin.id,
      },
      {
        amount: 3000,
        type: "EXPENSE",
        category: "Transport",
        date: new Date("2026-01-25"),
        notes: "Fuel and metro",
        createdById: admin.id,
      },
      {
        amount: 10000,
        type: "INCOME",
        category: "Freelance",
        date: new Date("2026-02-10"),
        notes: "Web project",
        createdById: analyst.id,
      },
      {
        amount: 50000,
        type: "INCOME",
        category: "Salary",
        date: new Date("2026-02-15"),
        notes: "February salary",
        createdById: admin.id,
      },
      {
        amount: 15000,
        type: "EXPENSE",
        category: "Rent",
        date: new Date("2026-02-05"),
        notes: "February rent",
        createdById: admin.id,
      },
      {
        amount: 2000,
        type: "EXPENSE",
        category: "Utilities",
        date: new Date("2026-02-08"),
        notes: "Electricity bill",
        createdById: admin.id,
      },
      {
        amount: 50000,
        type: "INCOME",
        category: "Salary",
        date: new Date("2026-03-15"),
        notes: "March salary",
        createdById: admin.id,
      },
      {
        amount: 8000,
        type: "EXPENSE",
        category: "Food",
        date: new Date("2026-03-10"),
        notes: "Dining out and groceries",
        createdById: viewer.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed");
  console.log("Admin:", admin.email, "/ admin123");
  console.log("Analyst:", analyst.email, "/ analyst123");
  console.log("Viewer:", viewer.email, "/ viewer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
