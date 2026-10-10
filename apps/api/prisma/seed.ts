import "dotenv/config";
import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development seed is disabled in production");
  const phone = process.env.DEMO_USER_PHONE ?? "9000000001";
  const password = process.env.DEMO_USER_PASSWORD ?? "DemoPass!234";
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      phone,
      passwordHash: await argon2.hash(password),
      wallet: { create: { quotaInr: "125.00", rewardRatio: "0.01" } },
    },
  });
  await prisma.upiAccount.deleteMany({ where: { userId: user.id } });
  await prisma.upiAccount.createMany({
    data: [
      { userId: user.id, address: "demo.available@mock", status: "AVAILABLE", sellEnabled: true },
      { userId: user.id, address: "demo.pending@mock", status: "UNAVAILABLE", sellEnabled: false },
    ],
  });
  await prisma.ledgerEntry.deleteMany({ where: { userId: user.id } });
  await prisma.ledgerEntry.createMany({
    data: [
      {
        userId: user.id,
        type: "COMMISSION",
        amount: "5.75",
        description: "Mock payment task commission",
      },
      { userId: user.id, type: "REWARD", amount: "2.50", description: "Mock welcome reward" },
    ],
  });
  await prisma.teamMember.deleteMany({ where: { ownerId: user.id } });
  for (let index = 0; index < 4; index += 1) {
    const memberPhone = `90000001${String(index).padStart(2, "0")}`;
    const member = await prisma.user.upsert({
      where: { phone: memberPhone },
      update: {},
      create: {
        phone: memberPhone,
        passwordHash: await argon2.hash(randomBytes(32).toString("base64url")),
        wallet: { create: {} },
      },
    });
    await prisma.teamMember.create({
      data: {
        ownerId: user.id,
        memberId: member.id,
        rechargeTotal: index === 0 ? "1250.00" : "0.00",
        commissionTotal: index === 0 ? "37.50" : "0.00",
      },
    });
  }
  console.log(`Development demo user seeded: ${phone}`);
}

main().finally(() => prisma.$disconnect());
