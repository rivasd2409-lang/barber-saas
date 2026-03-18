import Link from "next/link";
import { BookingDetailsModal } from "@/app/components/booking-details-modal";
import { getBookingStatusLabel } from "@/app/components/booking-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ClientesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getQueryValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return "";
}

function buildClientesHref(params: {
  q?: string;
  phone?: string;
  bookingId?: string;
}): string {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.phone) {
    query.set("phone", params.phone);
  }

  if (params.bookingId) {
    query.set("bookingId", params.bookingId);
  }

  const queryString = query.toString();
  return queryString ? `/clientes?${queryString}` : "/clientes";
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const q = getQueryValue(params?.q).trim();
  const phone = getQueryValue(params?.phone).trim();
  const selectedBookingId = Number(getQueryValue(params?.bookingId));
  const filterValue = q || phone;

  const customers = await prisma.customer.findMany({
    where: filterValue
      ? {
          OR: [
            { name: { contains: filterValue } },
            { phone: { contains: filterValue } },
          ],
        }
      : undefined,
    orderBy: [{ name: "asc" }],
    take: 60,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      bookings: {
        orderBy: { startAt: "desc" },
        take: 1,
        select: {
          startAt: true,
        },
      },
    },
  });

  const selectedCustomer = phone
    ? await prisma.customer.findUnique({
        where: { phone },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          bookings: {
            orderBy: { startAt: "desc" },
            select: {
              id: true,
              startAt: true,
              status: true,
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
          },
        },
      })
    : null;

  const selectedBooking =
    Number.isInteger(selectedBookingId) && selectedBookingId > 0
      ? await prisma.booking.findUnique({
          where: { id: selectedBookingId },
          select: {
            id: true,
            status: true,
            startAt: true,
            customer: {
              select: {
                name: true,
                phone: true,
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
        })
      : null;

  const closeHref = buildClientesHref({ q, phone });
  const returnTo = closeHref;
  const lastVisit = selectedCustomer?.bookings[0]?.startAt ?? null;

  const totalVisits = selectedCustomer?.bookings.length ?? 0;

  const topService = selectedCustomer
    ? (() => {
        const counts = new Map<string, number>();

        for (const booking of selectedCustomer.bookings) {
          counts.set(booking.service.name, (counts.get(booking.service.name) ?? 0) + 1);
        }

        let label = "Sin datos";
        let count = 0;

        for (const [name, currentCount] of counts.entries()) {
          if (currentCount > count) {
            label = name;
            count = currentCount;
          }
        }

        return label;
      })()
    : "Sin datos";

  const topBarber = selectedCustomer
    ? (() => {
        const counts = new Map<string, number>();

        for (const booking of selectedCustomer.bookings) {
          counts.set(booking.barber.name, (counts.get(booking.barber.name) ?? 0) + 1);
        }

        let label = "Sin datos";
        let count = 0;

        for (const [name, currentCount] of counts.entries()) {
          if (currentCount > count) {
            label = name;
            count = currentCount;
          }
        }

        return label;
      })()
    : "Sin datos";

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Base de clientes</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Clientes</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Busca, revisa y reconoce clientes rapidamente para atender mejor en recepcion.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Resultados visibles</div>
            <div className="mt-2 font-medium text-slate-900">{customers.length}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Buscar cliente</span>
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Buscar por nombre o telefono"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Filtrar
            </button>
            {(q || phone) && (
              <Link
                href="/clientes"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Listado de clientes</h2>
              <p className="mt-1 text-sm text-slate-500">Explora la base por nombre o telefono.</p>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No se encontraron clientes con ese filtro.
            </div>
          ) : (
            <div className="grid max-h-[780px] gap-3 overflow-y-auto pr-1">
              {customers.map((customer) => {
                const lastVisit = customer.bookings[0]?.startAt ?? null;
                const customerHref = buildClientesHref({
                  q,
                  phone: customer.phone,
                });

                return (
                  <article
                    key={customer.id}
                    className={[
                      "rounded-2xl border p-4 shadow-sm transition",
                      phone === customer.phone
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="grid gap-1">
                        <h3 className="text-base font-semibold text-slate-950">{customer.name}</h3>
                        <p className="text-sm text-slate-700">Telefono: {customer.phone}</p>
                        <p className="text-sm text-slate-500">Email: {customer.email || "No registrado"}</p>
                        <p className="text-sm text-slate-500">
                          Ultima visita: {lastVisit ? lastVisit.toLocaleDateString("es-HN") : "Sin visitas registradas"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={customerHref}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Ver cliente
                        </Link>
                        <Link
                          href={`/book?customerName=${encodeURIComponent(customer.name)}&customerPhone=${encodeURIComponent(customer.phone)}${customer.email ? `&customerEmail=${encodeURIComponent(customer.email)}` : ""}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                        >
                          Nueva reserva
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {selectedCustomer ? (
            <div className="grid gap-5">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Perfil del cliente</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{selectedCustomer.name}</h2>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div>
                      Telefono: <strong className="text-slate-900">{selectedCustomer.phone}</strong>
                    </div>
                    <div>
                      Email: <strong className="text-slate-900">{selectedCustomer.email || "No registrado"}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Resumen rapido</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Ultima visita",
                        value: lastVisit ? lastVisit.toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" }) : "Sin visitas",
                      },
                      {
                        label: "Total de visitas",
                        value: String(totalVisits),
                      },
                      {
                        label: "Servicio mas frecuente",
                        value: topService,
                      },
                      {
                        label: "Barbero mas frecuente",
                        value: topBarber,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                        <div className="mt-2 text-sm font-medium leading-snug text-slate-950">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-1">
                  <Link
                    href={`/book?customerName=${encodeURIComponent(selectedCustomer.name)}&customerPhone=${encodeURIComponent(selectedCustomer.phone)}${selectedCustomer.email ? `&customerEmail=${encodeURIComponent(selectedCustomer.email)}` : ""}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Nueva reserva
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Historial de visitas</h3>
                  <p className="mt-1 text-sm text-slate-500">Reservas mas recientes primero.</p>
                </div>

                {selectedCustomer.bookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Este cliente aun no tiene visitas registradas.
                  </div>
                ) : (
                  <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
                    {selectedCustomer.bookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={buildClientesHref({
                          q,
                          phone: selectedCustomer.phone,
                          bookingId: String(booking.id),
                        })}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                      >
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold text-slate-950">
                            {booking.startAt.toLocaleDateString("es-HN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <div className="grid gap-1 text-sm text-slate-600">
                            <div>
                              Servicio: <strong className="text-slate-950">{booking.service.name}</strong>
                            </div>
                            <div>
                              Barbero: <strong className="text-slate-950">{booking.barber.name}</strong>
                            </div>
                            <div>
                              Estado: <strong className="text-slate-950">{getBookingStatusLabel(booking.status)}</strong>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              <h2 className="text-lg font-semibold text-slate-950">Selecciona un cliente</h2>
              <p className="mt-2 text-sm text-slate-500">
                Usa la lista o el filtro para abrir la ficha y revisar su historial.
              </p>
            </div>
          )}
        </aside>
      </section>

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} closeHref={closeHref} returnTo={returnTo} />
      )}
    </main>
  );
}
