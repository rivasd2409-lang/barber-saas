import { BookingStatus, ManualBarberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TeamStatus = "AVAILABLE" | "WORKING" | "OFF_DUTY";

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return { now, start, end };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(value);
}

function getStatusBadge(status: TeamStatus): {
  label: string;
  dotClassName: string;
  badgeClassName: string;
} {
  if (status === "OFF_DUTY") {
    return {
      label: "Fuera de servicio",
      dotClassName: "bg-red-500",
      badgeClassName: "border-red-100 bg-red-50 text-red-700",
    };
  }

  if (status === "WORKING") {
    return {
      label: "Ocupado",
      dotClassName: "bg-amber-500",
      badgeClassName: "border-amber-100 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Disponible",
    dotClassName: "bg-emerald-500",
    badgeClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <div className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-lg text-slate-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const { now, start, end } = getTodayRange();

  const [todayBookings, upcomingBookings, teamBarbers, activeBookingsNow] = await Promise.all([
    prisma.booking.findMany({
      where: {
        startAt: {
          gte: start,
          lt: end,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        status: true,
        customerId: true,
        customer: {
          select: {
            name: true,
          },
        },
        barber: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        startAt: {
          gte: now,
        },
        status: BookingStatus.CONFIRMED,
      },
      orderBy: { startAt: "asc" },
      take: 5,
      select: {
        id: true,
        startAt: true,
        customer: {
          select: {
            name: true,
          },
        },
        barber: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.barber.findMany({
      where: { isActive: true },
      orderBy: { stationNumber: "asc" },
      select: {
        id: true,
        name: true,
        manualStatus: true,
        stationNumber: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        startAt: { lte: now },
        endAt: { gt: now },
        status: { not: BookingStatus.CANCELLED },
      },
      select: {
        barberId: true,
      },
    }),
  ]);

  const totalBookings = todayBookings.length;
  const completedBookings = todayBookings.filter((booking) => booking.status === BookingStatus.COMPLETED).length;
  const pendingBookings = todayBookings.filter((booking) => booking.status === BookingStatus.CONFIRMED).length;
  const estimatedRevenue = todayBookings.reduce((sum, booking) => sum + booking.service.price, 0);

  const teamStatus = teamBarbers.map((barber) => {
    let status: TeamStatus = "AVAILABLE";

    if (barber.manualStatus === ManualBarberStatus.OFF_DUTY) {
      status = "OFF_DUTY";
    } else if (activeBookingsNow.some((booking) => booking.barberId === barber.id)) {
      status = "WORKING";
    }

    return {
      ...barber,
      status,
    };
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-8 md:py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Vista general</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Resumen general de la barberia
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hoy</div>
            <div className="mt-2 font-medium text-slate-900">
              {now.toLocaleDateString("es-HN", { dateStyle: "full" })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Resumen de hoy</h2>
          <p className="mt-1 text-sm text-slate-500">Indicadores clave para seguir la operacion diaria.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Citas hoy" value={String(totalBookings)} icon="✂" />
          <SummaryCard label="Completadas" value={String(completedBookings)} icon="✓" />
          <SummaryCard label="Pendientes" value={String(pendingBookings)} icon="○" />
          <SummaryCard label="Ingresos estimados" value={formatCurrency(estimatedRevenue)} icon="L" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Proximas citas</h2>
            <p className="mt-1 text-sm text-slate-500">Las siguientes 5 reservas pendientes a partir de este momento.</p>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay citas proximas
            </div>
          ) : (
            <div className="grid gap-3">
              {upcomingBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-start">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-950">
                      {booking.startAt.toLocaleTimeString("es-HN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="grid gap-1 text-sm text-slate-600">
                      <div className="font-semibold text-slate-950">{booking.customer.name}</div>
                      <div>
                        Servicio: <strong className="text-slate-950">{booking.service.name}</strong>
                      </div>
                      <div>
                        Barbero: <strong className="text-slate-950">{booking.barber.name}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Estado del equipo</h2>
            <p className="mt-1 text-sm text-slate-500">Disponibilidad actual de los barberos activos del local.</p>
          </div>

          <div className="grid gap-3">
            {teamStatus.map((barber) => {
              const badge = getStatusBadge(barber.status);

              return (
                <article
                  key={barber.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid gap-1">
                      <div className="font-semibold text-slate-950">{barber.name}</div>
                      <div className="text-sm text-slate-500">Estacion #{barber.stationNumber}</div>
                    </div>

                    <div
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
                        badge.badgeClassName,
                      ].join(" ")}
                    >
                      <span className={["h-2.5 w-2.5 rounded-full", badge.dotClassName].join(" ")} aria-hidden="true" />
                      {badge.label}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
