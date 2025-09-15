/*
  Warnings:

  - A unique constraint covering the columns `[profileId,roomId,startDate]` on the table `contract` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."contract_profileId_roomId_key";

-- CreateIndex
CREATE INDEX "contract_profileId_roomId_startDate_idx" ON "public"."contract"("profileId", "roomId", "startDate");

-- CreateIndex
CREATE INDEX "contract_roomId_startDate_idx" ON "public"."contract"("roomId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "contract_profileId_roomId_startDate_key" ON "public"."contract"("profileId", "roomId", "startDate");
