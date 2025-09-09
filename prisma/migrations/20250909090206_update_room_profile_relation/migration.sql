/*
  Warnings:

  - The `role` column on the `profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `tenantId` on the `room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomId]` on the table `profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."room" DROP CONSTRAINT "room_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."room_tenantId_key";

-- AlterTable
ALTER TABLE "public"."profile" DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "public"."room" DROP COLUMN "tenantId";

-- CreateIndex
CREATE UNIQUE INDEX "profile_roomId_key" ON "public"."profile"("roomId");

-- AddForeignKey
ALTER TABLE "public"."profile" ADD CONSTRAINT "profile_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
