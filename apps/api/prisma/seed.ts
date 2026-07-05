// Chạy tự động sau `prisma migrate dev` / `prisma migrate reset` (cấu hình ở package.json field "prisma.seed").
// Chạy thủ công: pnpm prisma:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // upsert (không phải create) để chạy lại nhiều lần không bị lỗi trùng email.
  const user = await prisma.user.upsert({
    where: { email: "demo@tripmind.local" },
    update: {},
    create: {
      email: "demo@tripmind.local",
      // TODO: thay bằng argon2 hash thật khi Task #5 (Auth logic) xong — placeholder để có data mẫu trước.
      passwordHash: "seed-placeholder-not-a-real-hash",
      name: "Demo User",
    },
  });

  console.log(`Seeded user: ${user.email} (${user.id})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
