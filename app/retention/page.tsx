import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RetentionBucket = "PRONTO" | "YA_TOCA" | "ATRASADO";

type RetentionCustomer = {
  customerId: number;
  name: string;
  phone: string;
  email: string | null;
  barberName: string;
  daysSinceLastVisit: number;
  bucket: RetentionBucket;
};

const SECTION_CONFIG: Array<{ key: RetentionBucket; title: string }> = [
  { key: "PRONTO", title: "Pronto" },
  { key: "YA_TOCA", title: "Ya toca" },
  { key: "ATRASADO", title: "Atrasado" },
];

function getDaysSince(date: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const visitDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const diffMs = today.getTime() - visitDay.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getRetentionBucket(daysSinceLastVisit: number): RetentionBucket | null {
  if (daysSinceLastVisit >= 14 && daysSinceLastVisit <= 20) {
    return "PRONTO";
  }

  if (daysSinceLastVisit >= 21 && daysSinceLastVisit <= 30) {
    return "YA_TOCA";
  }

  if (daysSinceLastVisit >= 31) {
    return "ATRASADO";
  }

  return null;
}

export const dynamic = "force-dynamic";

export default async function RetentionPage() {
  const completedBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
    },
    orderBy: {
      startAt: "desc",
    },
    select: {
      id: true,
      startAt: true,
      customerId: true,
      customer: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
      barber: {
        select: {
          name: true,
        },
      },
    },
  });

  const latestVisitByCustomer = new Map<number, RetentionCustomer>();

  for (const booking of completedBookings) {
    if (latestVisitByCustomer.has(booking.customerId)) {
      continue;
    }

    const daysSinceLastVisit = getDaysSince(booking.startAt);
    const bucket = getRetentionBucket(daysSinceLastVisit);

    if (!bucket) {
      continue;
    }

    latestVisitByCustomer.set(booking.customerId, {
      customerId: booking.customerId,
      name: booking.customer.name,
      phone: booking.customer.phone,
      email: booking.customer.email,
      barberName: booking.barber.name,
      daysSinceLastVisit,
      bucket,
    });
  }

  const customers = Array.from(latestVisitByCustomer.values());
  const groupedCustomers: Record<RetentionBucket, RetentionCustomer[]> = {
    PRONTO: customers.filter((customer) => customer.bucket === "PRONTO"),
    YA_TOCA: customers.filter((customer) => customer.bucket === "YA_TOCA"),
    ATRASADO: customers.filter((customer) => customer.bucket === "ATRASADO"),
  };

  return (
    <main style={{ padding: "1rem", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Retencion de clientes</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Clientes que pueden necesitar una nueva visita segun su ultimo corte completado.
      </p>

      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {SECTION_CONFIG.map((section) => {
          const clients = groupedCustomers[section.key];

          return (
            <section key={section.key} style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "1rem" }}>
              <h2 style={{ marginTop: 0 }}>{section.title}</h2>

              {clients.length === 0 ? (
                <p style={{ marginBottom: 0 }}>No hay clientes en esta categoria.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {clients.map((client) => (
                    <article
                      key={client.customerId}
                      style={{ border: "1px solid #eee", borderRadius: "8px", padding: "0.75rem", background: "#fafafa" }}
                    >
                      <div style={{ display: "grid", gap: "0.35rem" }}>
                        <div>Nombre: <strong>{client.name}</strong></div>
                        <div>Telefono: <strong>{client.phone}</strong></div>
                        <div>Ultimo barbero: <strong>{client.barberName}</strong></div>
                        <div>Dias desde ultimo corte: <strong>{client.daysSinceLastVisit}</strong></div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                        <Link href={`/clientes?phone=${encodeURIComponent(client.phone)}`}>Ver cliente</Link>
                        <Link
                          href={`/book?customerName=${encodeURIComponent(client.name)}&customerPhone=${encodeURIComponent(client.phone)}${client.email ? `&customerEmail=${encodeURIComponent(client.email)}` : ""}`}
                        >
                          Nueva reserva
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
