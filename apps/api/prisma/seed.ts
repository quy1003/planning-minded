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
    if (!lake || !market) return;

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

  await seedMoreTrips(user.id);
}

type SeedTripSpec = {
  title: string;
  destinationName: string;
  startDate: string | null;
  days: number;
  partySize: number;
  budget: number;
  status: "DRAFT" | "PLANNED" | "COMPLETED";
  place: { name: string; address: string; lat: number; lng: number };
  itinerary: {
    slot: "MORNING" | "AFTERNOON" | "EVENING";
    title: string;
    startTime: string;
    durationMin: number;
    estCost: number;
  };
};

/** Thêm nhiều trip đa dạng năm/trạng thái/điểm đến — để test list nhóm theo năm, card grid... */
const MORE_TRIPS: SeedTripSpec[] = [
  {
    title: "Đà Nẵng cuối tuần",
    destinationName: "Đà Nẵng",
    startDate: null,
    days: 2,
    partySize: 4,
    budget: 3_000_000,
    status: "DRAFT",
    place: { name: "Cầu Rồng", address: "Đà Nẵng", lat: 16.061, lng: 108.2277 },
    itinerary: { slot: "EVENING", title: "Xem Cầu Rồng phun lửa", startTime: "20:00", durationMin: 60, estCost: 0 },
  },
  {
    title: "Tây Bắc mùa lúa chín",
    destinationName: "Hà Giang",
    startDate: null,
    days: 5,
    partySize: 2,
    budget: 6_500_000,
    status: "DRAFT",
    place: { name: "Cột cờ Lũng Cú", address: "Hà Giang", lat: 23.3878, lng: 105.3175 },
    itinerary: { slot: "MORNING", title: "Leo Cột cờ Lũng Cú", startTime: "08:00", durationMin: 120, estCost: 50_000 },
  },
  {
    title: "Sa Pa săn mây",
    destinationName: "Sa Pa",
    startDate: "2026-10-03",
    days: 4,
    partySize: 6,
    budget: 8_200_000,
    status: "PLANNED",
    place: { name: "Nhà thờ Đá Sa Pa", address: "Sa Pa", lat: 22.3364, lng: 103.8438 },
    itinerary: { slot: "MORNING", title: "Săn mây đỉnh Fansipan", startTime: "05:30", durationMin: 180, estCost: 800_000 },
  },
  {
    title: "Côn Đảo lặn biển",
    destinationName: "Côn Đảo",
    startDate: "2026-11-20",
    days: 3,
    partySize: 2,
    budget: 9_000_000,
    status: "DRAFT",
    place: { name: "Bãi Đầm Trầu", address: "Côn Đảo", lat: 8.6946, lng: 106.6135 },
    itinerary: { slot: "AFTERNOON", title: "Lặn ngắm san hô", startTime: "14:00", durationMin: 150, estCost: 1_200_000 },
  },
  {
    title: "Phú Quốc hè 2025",
    destinationName: "Phú Quốc",
    startDate: "2025-06-20",
    days: 4,
    partySize: 3,
    budget: 12_000_000,
    status: "COMPLETED",
    place: { name: "Bãi Sao", address: "Phú Quốc", lat: 10.0452, lng: 104.0064 },
    itinerary: { slot: "MORNING", title: "Tắm biển Bãi Sao", startTime: "09:00", durationMin: 120, estCost: 0 },
  },
  {
    title: "Hội An phố cổ",
    destinationName: "Hội An",
    startDate: "2025-02-10",
    days: 2,
    partySize: 2,
    budget: 2_400_000,
    status: "COMPLETED",
    place: { name: "Chùa Cầu", address: "Hội An", lat: 15.8801, lng: 108.326 },
    itinerary: { slot: "EVENING", title: "Dạo phố lồng đèn", startTime: "19:00", durationMin: 90, estCost: 150_000 },
  },
  {
    title: "Ninh Bình – Tràng An",
    destinationName: "Ninh Bình",
    startDate: "2024-05-05",
    days: 2,
    partySize: 5,
    budget: 3_000_000,
    status: "COMPLETED",
    place: { name: "Tràng An", address: "Ninh Bình", lat: 20.2506, lng: 105.913 },
    itinerary: { slot: "MORNING", title: "Đi thuyền Tràng An", startTime: "08:30", durationMin: 150, estCost: 250_000 },
  },
];

async function seedMoreTrips(userId: string): Promise<void> {
  for (const spec of MORE_TRIPS) {
    const existing = await prisma.trip.findFirst({ where: { userId, title: spec.title } });
    if (existing) continue;

    const trip = await prisma.trip.create({
      data: {
        userId,
        title: spec.title,
        destinationName: spec.destinationName,
        startDate: spec.startDate ? new Date(spec.startDate) : null,
        days: spec.days,
        partySize: spec.partySize,
        budget: spec.budget,
        currency: "VND",
        status: spec.status,
        places: { create: [spec.place] },
      },
      include: { places: true },
    });

    const place = trip.places[0];
    if (place) {
      await prisma.itineraryItem.create({
        data: {
          tripId: trip.id,
          placeId: place.id,
          dayNumber: 1,
          slot: spec.itinerary.slot,
          visitOrder: 1,
          title: spec.itinerary.title,
          startTime: new Date(`1970-01-01T${spec.itinerary.startTime}:00.000Z`),
          durationMin: spec.itinerary.durationMin,
          estCost: spec.itinerary.estCost,
        },
      });
    }

    console.log(`Seeded trip: ${trip.title} (${trip.id})`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
