/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "room" DROP CONSTRAINT "room_tenantId_fkey";

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "roomId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profile_roomId_key" ON "profile"("roomId");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
