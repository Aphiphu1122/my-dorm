-- CreateEnum
CREATE TYPE "public"."MoveOutStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."moveOutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "moveOutDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."MoveOutStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moveOutRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."moveOutRequest" ADD CONSTRAINT "moveOutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moveOutRequest" ADD CONSTRAINT "moveOutRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
