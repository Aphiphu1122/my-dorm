-- CreateTable
CREATE TABLE "public"."contract" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "dormOwnerName" TEXT NOT NULL,
    "dormAddress" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentPerMonth" DOUBLE PRECISION NOT NULL,
    "tenantNationalId" TEXT NOT NULL,
    "tenantAddress" TEXT NOT NULL,
    "contractImages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_profileId_roomId_key" ON "public"."contract"("profileId", "roomId");

-- AddForeignKey
ALTER TABLE "public"."contract" ADD CONSTRAINT "contract_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract" ADD CONSTRAINT "contract_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
