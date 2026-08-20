// Chạy tự động sau `prisma migrate dev` / `prisma migrate reset` (cấu hình ở package.json field "prisma.seed").
// Chạy thủ công: pnpm prisma:seed
// LƯU Ý thứ tự: chạy seed này TRƯỚC apps/api (task #7 — apps/api seed trip cho
// demo user, cần user đã tồn tại, tự tra bằng email vì không còn model User).
import * as argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma-client";

const prisma = new PrismaClient();

/** Password demo chỉ dùng local — không dùng trên môi trường thật. */
const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email: "demo@tripmind.local" },
    update: { passwordHash },
    create: {
      email: "demo@tripmind.local",
      passwordHash,
      name: "Demo User",
    },
  });
  console.log(`Seeded user: ${user.email} (${user.id})`);

  // Phase 3 task #3: user role ADMIN để test route quản trị catalog-service
  // (destinations/pois) — chỉ dùng local, không seed lên production.
  const admin = await prisma.user.upsert({
    where: { email: "admin@tripmind.local" },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: "admin@tripmind.local",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log(`Seeded admin: ${admin.email} (${admin.id})`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
