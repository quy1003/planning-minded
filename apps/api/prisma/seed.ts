// Chạy tự động sau `prisma migrate dev` / `prisma migrate reset` (cấu hình ở package.json field "prisma.seed").
// Chạy thủ công: pnpm prisma:seed
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

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

  const existingTrip = await prisma.trip.findFirst({
    where: { userId: user.id, title: "Đà Lạt 3 ngày (seed)" },
  });

  if (!existingTrip) {
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        title: "Đà Lạt 3 ngày (seed)",
        destinationName: "Đà Lạt",
        startDate: new Date("2026-08-01"),
        days: 3,
        partySize: 2,
        budget: 5_000_000,
        currency: "VND",
        status: "DRAFT",
        places: {
          create: [
            {
              name: "Hồ Xuân Hương",
              address: "Đà Lạt",
              lat: 11.9404,
              lng: 108.4583,
            },
            {
              name: "Chợ Đà Lạt",
              address: "Nguyễn Thị Minh Khai, Đà Lạt",
              lat: 11.9412,
              lng: 108.4382,
            },
          ],
        },
      },
      include: { places: true },
    });
    console.log(`Seeded trip: ${trip.title} (${trip.id}) with ${trip.places.length} places`);
  }

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
