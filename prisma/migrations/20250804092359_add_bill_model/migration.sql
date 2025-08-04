-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "public"."bill" (
    "id" TEXT NOT NULL,
    "billingMonth" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "waterUnit" DOUBLE PRECISION NOT NULL,
    "waterRate" DOUBLE PRECISION NOT NULL,
    "electricUnit" DOUBLE PRECISION NOT NULL,
    "electricRate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentSlipUrl" TEXT,
    "paymentDate" TIMESTAMP(3),
    "roomId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."bill" ADD CONSTRAINT "bill_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bill" ADD CONSTRAINT "bill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
