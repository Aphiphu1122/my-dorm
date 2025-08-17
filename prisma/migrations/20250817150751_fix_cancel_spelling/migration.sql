/*
  Warnings:

  - The values [CANCLE] on the enum `MaintenanceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MaintenanceStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCEL');
ALTER TABLE "public"."maintenanceRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."maintenanceRequest" ALTER COLUMN "status" TYPE "public"."MaintenanceStatus_new" USING ("status"::text::"public"."MaintenanceStatus_new");
ALTER TYPE "public"."MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "public"."MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "public"."MaintenanceStatus_old";
ALTER TABLE "public"."maintenanceRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
