import { BookingStatus } from "@prisma/client";
import { ensureShopHours } from "@/lib/shop-hours-store";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

type BookPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getQueryValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const [barbers, services, bookings, shopHours] = await Promise.all([
    prisma.barber.findMany({
      where: { isActive: true },
      orderBy: { stationNumber: "asc" },
      select: {
        id: true,
        name: true,
        avatar: true,
        stationNumber: true,
        manualStatus: true,
        isActive: true,
      },
    }),
    prisma.service.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        durationMin: true,
        price: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        startAt: {
          gte: todayStart,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        barberId: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    }),
    ensureShopHours(),
  ]);

  const bookingsForClient = bookings.map((booking) => ({
    id: booking.id,
    barberId: booking.barberId,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    status: booking.status,
  }));

  return (
    <main className="container">
      <h1>Book</h1>
      <BookingForm
        barbers={barbers}
        services={services}
        bookings={bookingsForClient}
        shopHours={shopHours}
        initialPrefill={{
          barberId: getQueryValue(params?.barberId),
          serviceId: getQueryValue(params?.serviceId),
          date: getQueryValue(params?.date),
          slot: getQueryValue(params?.slot),
          customerName: getQueryValue(params?.customerName),
          customerPhone: getQueryValue(params?.customerPhone),
          customerEmail: getQueryValue(params?.customerEmail),
        }}
      />
    </main>
  );
}
