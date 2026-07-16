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

  let trip = await prisma.trip.findFirst({
    where: { userId: user.id, title: "Đà Lạt 3 ngày (seed)" },
    include: { places: true, itineraryItems: true },
  });

  if (!trip) {
    trip = await prisma.trip.create({
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
      include: { places: true, itineraryItems: true },
    });
    console.log(`Seeded trip: ${trip.title} (${trip.id}) with ${trip.places.length} places`);
  }

  if (trip.itineraryItems.length === 0 && trip.places.length >= 2) {
    const lake = trip.places.find((p) => p.name === "Hồ Xuân Hương") ?? trip.places[0];
    const market = trip.places.find((p) => p.name === "Chợ Đà Lạt") ?? trip.places[1];

    await prisma.itineraryItem.createMany({
      data: [
        {
          tripId: trip.id,
          placeId: lake.id,
          dayNumber: 1,
          slot: "MORNING",
          visitOrder: 1,
          title: "Đi bộ quanh Hồ Xuân Hương",
          startTime: new Date("1970-01-01T08:00:00.000Z"),
          endTime: new Date("1970-01-01T09:30:00.000Z"),
          durationMin: 90,
          estCost: 0,
        },
        {
          tripId: trip.id,
          placeId: market.id,
          dayNumber: 1,
          slot: "AFTERNOON",
          visitOrder: 1,
          title: "Ăn trưa / mua đặc sản Chợ Đà Lạt",
          startTime: new Date("1970-01-01T12:00:00.000Z"),
          durationMin: 120,
          estCost: 300_000,
        },
      ],
    });
    console.log(`Seeded itinerary items for trip ${trip.id}`);
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
