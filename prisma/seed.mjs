import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { name: "Corte clásico", durationMin: 30, price: 200 },
  { name: "Corte + barba", durationMin: 45, price: 300 },
  { name: "Servicio premium", durationMin: 60, price: 450 },
];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        durationMin: service.durationMin,
        price: service.price,
      },
      create: service,
    });
  }

  console.log("Seed completed: services ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
