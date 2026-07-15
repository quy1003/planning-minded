// Chạy tự động sau `prisma migrate dev` / `prisma migrate reset` (cấu hình ở package.json field "prisma.seed").
// Chạy thủ công: pnpm prisma:seed
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

/** Password demo chỉ dùng local — không dùng trên môi trường thật. */
const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // upsert để chạy lại nhiều lần không bị lỗi trùng email.
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
