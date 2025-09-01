-- AlterTable
ALTER TABLE "public"."profile" ADD COLUMN     "roomStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."room" ADD COLUMN     "assignedAt" TIMESTAMP(3);
