import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roomNumbers = Array.from({ length: 10 }, (_, i) =>
    String(i + 1).padStart(3, "0")
  );

  for (const number of roomNumbers) {
    await prisma.room.upsert({
      where: { roomNumber: number },
      update: {},
      create: {
        roomNumber: number,
        status: "AVAILABLE",
      },
    });
  }

  console.log("✅ Seeded rooms 001 - 010");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding rooms:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
