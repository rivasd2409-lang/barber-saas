import { ManualBarberStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { name: "Corte clasico", durationMin: 30, price: 200 },
  { name: "Corte + barba", durationMin: 45, price: 300 },
  { name: "Servicio premium", durationMin: 60, price: 450 },
];

const barbers = [
  {
    name: "Miguel",
    avatar: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=200&q=80",
    stationNumber: 1,
    manualStatus: ManualBarberStatus.AVAILABLE,
    isActive: true,
  },
  {
    name: "Carlos",
    avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=200&q=80",
    stationNumber: 2,
    manualStatus: ManualBarberStatus.AVAILABLE,
    isActive: true,
  },
  {
    name: "Javier",
    avatar: null,
    stationNumber: 3,
    manualStatus: ManualBarberStatus.OFF_DUTY,
    isActive: true,
  },
];

const shopHours = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "19:00", isClosed: true },
  { dayOfWeek: 1, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 6, openTime: "08:00", closeTime: "19:00", isClosed: false },
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

  for (const barber of barbers) {
    await prisma.barber.upsert({
      where: { name: barber.name },
      update: {
        avatar: barber.avatar,
        stationNumber: barber.stationNumber,
        manualStatus: barber.manualStatus,
        isActive: barber.isActive,
      },
      create: barber,
    });
  }

  for (const day of shopHours) {
    await prisma.shopHours.upsert({
      where: { dayOfWeek: day.dayOfWeek },
      update: {
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: day.isClosed,
      },
      create: day,
    });
  }

  console.log("Seed completed: services, barbers and shop hours ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
