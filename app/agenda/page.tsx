import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import {
  BarberStatusIndicator,
  getVisibleBarberStatus,
  type ManualBarberStatus,
} from "@/app/components/barber-status-indicator";
import { BookingDetailsModal } from "@/app/components/booking-details-modal";
import { BookingSlotCard } from "@/app/agenda/booking-slot-card";
import { ensureShopHours } from "@/lib/shop-hours-store";
import { getShopHoursForDate, timeStringToMinutes } from "@/lib/shop-hours";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AgendaPageProps = {
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

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(dateValue: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
}

function formatSlot(minutesFromMidnight: number): string {
  const hours = String(Math.floor(minutesFromMidnight / 60)).padStart(2, "0");
  const minutes = String(minutesFromMidnight % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function createSlotDate(baseDate: Date, minutesFromMidnight: number): Date {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
}

function getBookingCellClasses(status: BookingStatus): string {
  if (status === BookingStatus.COMPLETED) {
    return "border-emerald-200 bg-emerald-50/90 hover:border-emerald-300 hover:bg-emerald-100";
  }

  if (status === BookingStatus.NO_SHOW) {
    return "border-amber-200 bg-amber-50/90 hover:border-amber-300 hover:bg-amber-100";
  }

  if (status === BookingStatus.CANCELLED) {
    return "border-rose-200 bg-rose-50/90 hover:border-rose-300 hover:bg-rose-100";
  }

  return "border-sky-200 bg-sky-50/90 hover:border-sky-300 hover:bg-sky-100";
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const now = new Date();

  const requestedDate = getQueryValue(params?.date);
  const requestedBarberId = getQueryValue(params?.barberId);
  const parsedRequestedDate = requestedDate ? parseDateInput(requestedDate) : null;
  const selectedDate = parsedRequestedDate ?? todayDate;
  const selectedBookingId = Number(getQueryValue(params?.bookingId));

  const selectedDateValue = toDateInputValue(selectedDate);
  const previousDateValue = toDateInputValue(addDays(selectedDate, -1));
  const nextDateValue = toDateInputValue(addDays(selectedDate, 1));

  const dayStart = selectedDate;
  const dayEnd = addDays(selectedDate, 1);

  const [barbers, bookings, activeBookingsNow, selectedBooking, shopHours] = await Promise.all([
    prisma.barber.findMany({
      where: { isActive: true },
      orderBy: { stationNumber: "asc" },
      select: {
        id: true,
        name: true,
        avatar: true,
        manualStatus: true,
        stationNumber: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        startAt: { gte: dayStart, lt: dayEnd },
        status: { not: BookingStatus.CANCELLED },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        barberId: true,
        startAt: true,
        endAt: true,
        status: true,
        customer: {
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
    Number.isInteger(selectedBookingId) && selectedBookingId > 0
      ? prisma.booking.findUnique({
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
      : Promise.resolve(null),
    ensureShopHours(),
  ]);

  const selectedDayHours = getShopHoursForDate(shopHours, selectedDate);
  const openMinutes = selectedDayHours ? timeStringToMinutes(selectedDayHours.openTime) : null;
  const closeMinutes = selectedDayHours ? timeStringToMinutes(selectedDayHours.closeTime) : null;
  const isClosedDay = !selectedDayHours || selectedDayHours.isClosed || openMinutes === null || closeMinutes === null;

  const timeSlots: number[] = [];
  if (!isClosedDay) {
    for (let minute = openMinutes; minute < closeMinutes; minute += 15) {
      timeSlots.push(minute);
    }
  }

  const closeHref = buildAgendaHref({});
  const returnTo = closeHref;
  const visibleBarbers = requestedBarberId
    ? barbers.filter((barber) => String(barber.id) === requestedBarberId)
    : barbers;

  function buildAgendaHref(options: { date?: string; barberId?: string; bookingId?: string | null }): string {
    const query = new URLSearchParams();
    query.set("date", options.date ?? selectedDateValue);

    const barberIdValue = options.barberId ?? requestedBarberId;
    if (barberIdValue) {
      query.set("barberId", barberIdValue);
    }

    if (options.bookingId) {
      query.set("bookingId", options.bookingId);
    }

    return `/agenda?${query.toString()}`;
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Agenda diaria</h1>
            <p className="mt-2 text-sm text-slate-500">Vista operativa para recepcion y staff.</p>
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Fecha seleccionada</span>
                <strong className="text-lg capitalize text-slate-950 sm:text-xl">
                  {selectedDate.toLocaleDateString("es-HN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={buildAgendaHref({ date: previousDateValue })}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Anterior
                </Link>
                <Link
                  href={buildAgendaHref({ date: nextDateValue })}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-950"
                >
                  Siguiente
                </Link>
              </div>
            </div>

            <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {requestedBarberId && <input type="hidden" name="barberId" value={requestedBarberId} />}
              <label className="grid flex-1 gap-2">
                <span className="text-sm font-medium text-slate-600">Cambiar fecha</span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <input
                    type="date"
                    name="date"
                    defaultValue={selectedDateValue}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Cambiar fecha
              </button>
            </form>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-600">Filtrar barbero</span>
              <div className="-mx-1 flex flex-wrap gap-2 px-1">
                <Link
                  href={buildAgendaHref({ barberId: "" })}
                  className={[
                    "inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition",
                    !requestedBarberId
                      ? "border-blue-200 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Todos
                </Link>
                {barbers.map((barber) => {
                  const isActiveFilter = requestedBarberId === String(barber.id);
                  return (
                    <Link
                      key={barber.id}
                      href={buildAgendaHref({ barberId: String(barber.id) })}
                      className={[
                        "inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition",
                        isActiveFilter
                          ? "border-blue-200 bg-blue-50 text-blue-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {barber.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isClosedDay ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="m-0 text-sm text-slate-600">El local esta cerrado en esta fecha. No hay horarios disponibles.</p>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className="border-b border-slate-200 bg-slate-100 px-4 py-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Hora
                  </th>
                  {visibleBarbers.map((barber) => {
                    const hasActiveBooking = activeBookingsNow.some(
                      (booking) => booking.barberId === barber.id
                    );
                    const visibleStatus = getVisibleBarberStatus(
                      barber.manualStatus as ManualBarberStatus,
                      hasActiveBooking
                    );

                    return (
                      <th key={barber.id} className="border-b border-slate-200 px-4 py-5 text-left align-top">
                        <div className="flex items-start gap-3">
                          {barber.avatar ? (
                            <img
                              src={barber.avatar}
                              alt={barber.name}
                              className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 shadow-sm">
                              {barber.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <div className="text-sm font-semibold leading-none text-slate-950">{barber.name}</div>
                            <div className="text-sm text-slate-600">
                              <BarberStatusIndicator status={visibleStatus} />
                            </div>
                            <div className="text-xs font-medium tracking-wide text-slate-500">Estacion #{barber.stationNumber}</div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((minutesFromMidnight) => {
                  const slotLabel = formatSlot(minutesFromMidnight);
                  const slotStart = createSlotDate(selectedDate, minutesFromMidnight);

                  return (
                    <tr key={slotLabel} className="align-top">
                      <td className="border-b border-slate-200 bg-slate-50/90 px-4 py-5 text-sm font-semibold text-slate-700">
                        {slotLabel}
                      </td>

                      {visibleBarbers.map((barber) => {
                        if (barber.manualStatus === "OFF_DUTY") {
                          return (
                            <td key={`${barber.id}-${slotLabel}`} className="border-b border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-400">
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-4 py-6 text-center text-sm font-medium text-slate-500">
                                Fuera de servicio
                              </div>
                            </td>
                          );
                        }

                        const activeBooking = bookings.find((booking) => {
                          if (booking.barberId !== barber.id) {
                            return false;
                          }

                          return booking.startAt <= slotStart && booking.endAt > slotStart;
                        });

                        if (activeBooking) {
                          return (
                            <td key={`${barber.id}-${slotLabel}`} className="border-b border-slate-200 px-4 py-5">
                              <BookingSlotCard
                                bookingId={activeBooking.id}
                                status={activeBooking.status}
                                serviceName={activeBooking.service.name}
                                customerName={activeBooking.customer.name}
                                detailsHref={buildAgendaHref({ bookingId: String(activeBooking.id) })}
                                returnTo={returnTo}
                                className={[
                                  "block min-h-[92px] rounded-2xl border px-4 py-4 text-left shadow-sm transition",
                                  getBookingCellClasses(activeBooking.status),
                                ].join(" ")}
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={`${barber.id}-${slotLabel}`} className="border-b border-slate-200 px-4 py-5">
                            <Link
                              href={`/book?barberId=${barber.id}&date=${selectedDateValue}&slot=${slotLabel}`}
                              className="flex min-h-[92px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-white hover:text-slate-900"
                            >
                              + Reservar
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} closeHref={closeHref} returnTo={returnTo} />
      )}
    </main>
  );
}
