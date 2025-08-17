/*
  Warnings:

  - You are about to drop the column `roomId` on the `profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'admin');

-- DropForeignKey
ALTER TABLE "public"."profile" DROP CONSTRAINT "profile_roomId_fkey";

-- DropIndex
DROP INDEX "public"."profile_roomId_key";

-- AlterTable
ALTER TABLE "public"."profile" DROP COLUMN "roomId";

-- AddForeignKey
ALTER TABLE "public"."room" ADD CONSTRAINT "room_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
