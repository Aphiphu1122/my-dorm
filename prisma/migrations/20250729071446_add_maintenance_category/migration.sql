/*
  Warnings:

  - Added the required column `category` to the `maintenanceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('ELECTRICITY', 'PLUMBING', 'INTERNET', 'AIR_CONDITIONER', 'FURNITURE', 'OTHER');

-- AlterTable
ALTER TABLE "maintenanceRequest" ADD COLUMN     "category" "MaintenanceCategory" NOT NULL;
