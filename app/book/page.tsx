import { prisma } from "@/lib/prisma";
import { BookingForm } from "./booking-form";

export default async function BookPage() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      price: true,
    },
  });

  return (
    <main className="container">
      <h1>Book</h1>
      <BookingForm services={services} />
    </main>
  );
}
