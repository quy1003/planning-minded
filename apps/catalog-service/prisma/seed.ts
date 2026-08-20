// Chạy tự động sau `prisma migrate dev` / `prisma migrate reset` (cấu hình ở package.json field
// "prisma.seed"). Chạy thủ công: pnpm prisma:seed
// Destinations/pois không thuộc về user nào (khác trip) — không cần user demo tồn tại trước.
import { PrismaClient } from "../src/generated/prisma-client";

const prisma = new PrismaClient();

type SeedPoi = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  estCostMin: number;
  estCostMax: number;
  avgDurationMin: number;
  tags: string[];
  kidFriendly: boolean;
};

type SeedDestination = {
  name: string;
  region: string;
  description: string;
  lat: number;
  lng: number;
  bestSeasons: string[];
  tags: string[];
  pois: SeedPoi[];
};

const DESTINATIONS: SeedDestination[] = [
  {
    name: "Đà Lạt",
    region: "Tây Nguyên",
    description: "Thành phố ngàn hoa, khí hậu mát mẻ quanh năm, đồi thông và hồ nước.",
    lat: 11.9404,
    lng: 108.4583,
    bestSeasons: ["11-03"],
    tags: ["núi", "lãng mạn", "mát mẻ"],
    pois: [
      {
        name: "Hồ Xuân Hương",
        address: "Trung tâm Đà Lạt",
        lat: 11.9404,
        lng: 108.4583,
        category: "sightseeing",
        description: "Hồ nước nhân tạo giữa trung tâm thành phố, đi bộ/đạp xe quanh hồ.",
        estCostMin: 0,
        estCostMax: 0,
        avgDurationMin: 90,
        tags: ["miễn phí", "đi bộ"],
        kidFriendly: true,
      },
      {
        name: "Chợ đêm Đà Lạt",
        address: "Nguyễn Thị Minh Khai, Đà Lạt",
        lat: 11.9412,
        lng: 108.4382,
        category: "food",
        description: "Chợ đêm ẩm thực, đặc sản Đà Lạt (bánh tráng nướng, sữa đậu nành nóng).",
        estCostMin: 50_000,
        estCostMax: 300_000,
        avgDurationMin: 120,
        tags: ["ẩm thực", "về đêm"],
        kidFriendly: true,
      },
    ],
  },
  {
    name: "Hội An",
    region: "Duyên hải Nam Trung Bộ",
    description: "Phố cổ di sản UNESCO, đèn lồng, kiến trúc cổ pha trộn Việt-Hoa-Nhật.",
    lat: 15.8801,
    lng: 108.326,
    bestSeasons: ["02-04", "08-10"],
    tags: ["di sản", "phố cổ", "về đêm"],
    pois: [
      {
        name: "Chùa Cầu",
        address: "Phố cổ Hội An",
        lat: 15.8794,
        lng: 108.3267,
        category: "sightseeing",
        description: "Biểu tượng của Hội An, cầu gỗ có mái che, xây từ thế kỷ 17.",
        estCostMin: 0,
        estCostMax: 80_000,
        avgDurationMin: 30,
        tags: ["di tích", "biểu tượng"],
        kidFriendly: true,
      },
    ],
  },
];

async function main() {
  for (const spec of DESTINATIONS) {
    const destination = await prisma.destination.upsert({
      where: { name: spec.name },
      update: {
        region: spec.region,
        description: spec.description,
        lat: spec.lat,
        lng: spec.lng,
        bestSeasons: spec.bestSeasons,
        tags: spec.tags,
      },
      create: {
        name: spec.name,
        region: spec.region,
        description: spec.description,
        lat: spec.lat,
        lng: spec.lng,
        bestSeasons: spec.bestSeasons,
        tags: spec.tags,
      },
    });
    console.log(`Seeded destination: ${destination.name} (${destination.id})`);

    for (const poiSpec of spec.pois) {
      const poi = await prisma.poi.upsert({
        where: { destinationId_name: { destinationId: destination.id, name: poiSpec.name } },
        update: {
          address: poiSpec.address,
          lat: poiSpec.lat,
          lng: poiSpec.lng,
          category: poiSpec.category,
          description: poiSpec.description,
          estCostMin: poiSpec.estCostMin,
          estCostMax: poiSpec.estCostMax,
          avgDurationMin: poiSpec.avgDurationMin,
          tags: poiSpec.tags,
          kidFriendly: poiSpec.kidFriendly,
        },
        create: {
          destinationId: destination.id,
          name: poiSpec.name,
          address: poiSpec.address,
          lat: poiSpec.lat,
          lng: poiSpec.lng,
          category: poiSpec.category,
          description: poiSpec.description,
          estCostMin: poiSpec.estCostMin,
          estCostMax: poiSpec.estCostMax,
          avgDurationMin: poiSpec.avgDurationMin,
          tags: poiSpec.tags,
          kidFriendly: poiSpec.kidFriendly,
        },
      });
      console.log(`  Seeded poi: ${poi.name} (${poi.id})`);
    }
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
