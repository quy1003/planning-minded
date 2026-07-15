-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PLANNED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DaySlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "startDate" DATE,
    "days" INTEGER NOT NULL,
    "partySize" INTEGER NOT NULL,
    "budget" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "aiSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "catalogPlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_items" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "slot" "DaySlot" NOT NULL,
    "visitOrder" INTEGER NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "durationMin" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_userId_status_idx" ON "trips"("userId", "status");

-- CreateIndex
CREATE INDEX "places_tripId_idx" ON "places"("tripId");

-- CreateIndex
CREATE INDEX "itinerary_items_tripId_dayNumber_idx" ON "itinerary_items"("tripId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_items_tripId_dayNumber_slot_visitOrder_key" ON "itinerary_items"("tripId", "dayNumber", "slot", "visitOrder");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
