-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "bestSeasons" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pois" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estCostMin" DECIMAL(12,2) NOT NULL,
    "estCostMax" DECIMAL(12,2) NOT NULL,
    "avgDurationMin" INTEGER NOT NULL,
    "openingHours" JSONB,
    "tags" TEXT[],
    "kidFriendly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_key" ON "destinations"("name");

-- CreateIndex
CREATE INDEX "destinations_region_idx" ON "destinations"("region");

-- CreateIndex
CREATE INDEX "destinations_tags_idx" ON "destinations"("tags");

-- CreateIndex
CREATE INDEX "pois_destinationId_category_idx" ON "pois"("destinationId", "category");

-- CreateIndex
CREATE INDEX "pois_tags_idx" ON "pois"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "pois_destinationId_name_key" ON "pois"("destinationId", "name");

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

