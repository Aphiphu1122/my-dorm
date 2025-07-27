/*
  Warnings:

  - You are about to drop the column `roomId` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "profile" DROP CONSTRAINT "profile_roomId_fkey";

-- DropIndex
DROP INDEX "profile_roomId_key";

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "roomId";

-- DropTable
DROP TABLE "Room";

-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "tenantId" TEXT,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_roomNumber_key" ON "room"("roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "room_tenantId_key" ON "room"("tenantId");

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
