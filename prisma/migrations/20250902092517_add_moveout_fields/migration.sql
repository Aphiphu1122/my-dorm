-- AlterTable
ALTER TABLE "public"."profile" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "moveOutDate" TIMESTAMP(3);
