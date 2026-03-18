"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  BarberStatusIndicator,
  getVisibleBarberStatus,
  type ManualBarberStatus,
  type VisibleBarberStatus,
} from "@/app/components/barber-status-indicator";
import { getShopHoursForDate, timeStringToMinutes, type ShopHoursRecord } from "@/lib/shop-hours";
import { createBookingAction, type BookingActionState } from "./actions";

type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type BarberOption = {
  id: number;
  name: string;
  avatar: string | null;
  stationNumber: number;
  manualStatus: ManualBarberStatus;
  isActive: boolean;
};

type ServiceOption = {
  id: number;
  name: string;
  durationMin: number;
  price: number;
};

type BookingSlot = {
  id: number;
  barberId: number;
  startAt: string;
  endAt: string;
  status: BookingStatus;
};

type BookingFormProps = {
  barbers: BarberOption[];
  services: ServiceOption[];
  bookings: BookingSlot[];
  shopHours: ShopHoursRecord[];
  initialPrefill?: {
    barberId?: string;
    serviceId?: string;
    date?: string;
    slot?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
};

type Step = 1 | 2 | 3 | 4 | 5;

const SLOT_INTERVAL_MIN = 15;

const initialState: BookingActionState = {
  success: false,
  message: "",
};

function getBarberSpriteSrc(status: VisibleBarberStatus): string {
  if (status === "WORKING") {
    return "/sprites/barber-working.gif";
  }

  if (status === "OFF_DUTY") {
    return "/sprites/barber-off-duty.gif";
  }

  return "/sprites/barber-available.gif";
}

function formatLempiras(value: number): string {
  return `L ${value.toFixed(0)}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateDisplay(dateValue: string): string {
  const parsed = parseDateString(dateValue);

  if (!parsed) {
    return "Sin fecha seleccionada";
  }

  return parsed.toLocaleDateString("es-HN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseDateString(dateValue: string): Date | null {
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

function createDateAt(dateValue: string, minutesFromMidnight: number): Date | null {
  const baseDate = parseDateString(dateValue);

  if (!baseDate) {
    return null;
  }

  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

function isOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialStep(params: {
  barberId: string;
  serviceId: string;
  date: string;
  slot: string;
}): Step {
  if (params.barberId && params.serviceId && params.date && params.slot) {
    return 5;
  }

  if (params.barberId && params.serviceId && params.date) {
    return 4;
  }

  if (params.barberId && params.serviceId) {
    return 3;
  }

  if (params.barberId) {
    return 2;
  }

  return 1;
}

export function BookingForm({
  barbers,
  services,
  bookings,
  shopHours,
  initialPrefill,
}: BookingFormProps) {
  const today = new Date();
  const todayValue = toDateInputValue(today);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

  const prefillBarberId =
    initialPrefill?.barberId && barbers.some((barber) => String(barber.id) === initialPrefill.barberId)
      ? initialPrefill.barberId
      : "";

  const prefillServiceId =
    initialPrefill?.serviceId && services.some((service) => String(service.id) === initialPrefill.serviceId)
      ? initialPrefill.serviceId
      : "";

  const prefillDateCandidate = initialPrefill?.date ?? todayValue;
  const parsedPrefillDate = parseDateString(prefillDateCandidate);
  const prefillDate = parsedPrefillDate && parsedPrefillDate >= todayStart ? prefillDateCandidate : todayValue;

  const prefillSlot =
    initialPrefill?.slot && /^\d{2}:\d{2}$/.test(initialPrefill.slot) ? initialPrefill.slot : "";

  const prefillCustomerName = initialPrefill?.customerName ?? "";
  const prefillCustomerPhone = initialPrefill?.customerPhone ?? "";
  const prefillCustomerEmail = initialPrefill?.customerEmail ?? "";

  const [currentStep, setCurrentStep] = useState<Step>(
    getInitialStep({
      barberId: prefillBarberId,
      serviceId: prefillServiceId,
      date: prefillDate,
      slot: prefillSlot,
    })
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>(prefillBarberId);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(prefillServiceId);
  const [selectedDate, setSelectedDate] = useState<string>(prefillDate);
  const [selectedSlot, setSelectedSlot] = useState<string>(prefillSlot);
  const [customerName, setCustomerName] = useState<string>(prefillCustomerName);
  const [customerPhone, setCustomerPhone] = useState<string>(prefillCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState<string>(prefillCustomerEmail);

  const [state, formAction, isPending] = useActionState(createBookingAction, initialState);

  const steps: Array<{ id: Step; label: string }> = [
    { id: 1, label: "Barbero" },
    { id: 2, label: "Servicio" },
    { id: 3, label: "Fecha" },
    { id: 4, label: "Hora" },
    { id: 5, label: "Confirmar" },
  ];

  const selectedBarber = useMemo(
    () => barbers.find((barber) => String(barber.id) === selectedBarberId),
    [barbers, selectedBarberId]
  );

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === selectedServiceId),
    [services, selectedServiceId]
  );

  const selectedDay = useMemo(() => parseDateString(selectedDate), [selectedDate]);

  const selectedDayHours = useMemo(() => {
    if (!selectedDay) {
      return null;
    }

    return getShopHoursForDate(shopHours, selectedDay);
  }, [selectedDay, shopHours]);

  const isClosedDay = useMemo(() => {
    if (!selectedDayHours) {
      return true;
    }

    return selectedDayHours.isClosed;
  }, [selectedDayHours]);

  const bookingsForBarberAndDate = useMemo(() => {
    if (!selectedBarberId || !selectedDate) {
      return [];
    }

    const barberId = Number(selectedBarberId);

    return bookings
      .filter((booking) => {
        if (booking.barberId !== barberId) {
          return false;
        }

        const bookingDate = toDateInputValue(new Date(booking.startAt));
        return bookingDate === selectedDate;
      })
      .map((booking) => ({
        ...booking,
        startAtDate: new Date(booking.startAt),
        endAtDate: new Date(booking.endAt),
      }));
  }, [bookings, selectedBarberId, selectedDate]);

  const availableSlots = useMemo(() => {
    if (!selectedBarberId || !selectedService || !selectedDate || !selectedDay || !selectedDayHours) {
      return [];
    }

    const now = new Date();
    const currentDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (selectedDay < currentDayStart || selectedDayHours.isClosed) {
      return [];
    }

    const openMinutes = timeStringToMinutes(selectedDayHours.openTime);
    const closeMinutes = timeStringToMinutes(selectedDayHours.closeTime);

    if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
      return [];
    }

    const result: string[] = [];

    for (
      let slotMinute = openMinutes;
      slotMinute + selectedService.durationMin <= closeMinutes;
      slotMinute += SLOT_INTERVAL_MIN
    ) {
      const slotStart = createDateAt(selectedDate, slotMinute);

      if (!slotStart) {
        continue;
      }

      if (slotStart < now) {
        continue;
      }

      const slotEnd = new Date(slotStart.getTime() + selectedService.durationMin * 60 * 1000);

      const overlapsExisting = bookingsForBarberAndDate.some((booking) =>
        isOverlapping(slotStart, slotEnd, booking.startAtDate, booking.endAtDate)
      );

      if (!overlapsExisting) {
        result.push(formatTime(slotStart));
      }
    }

    return result;
  }, [bookingsForBarberAndDate, selectedBarberId, selectedDate, selectedDay, selectedDayHours, selectedService]);

  useEffect(() => {
    if (selectedSlot && !availableSlots.includes(selectedSlot)) {
      setSelectedSlot("");
    }
  }, [availableSlots, selectedSlot]);

  const canGoNext =
    (currentStep === 1 && !!selectedBarberId) ||
    (currentStep === 2 && !!selectedServiceId) ||
    (currentStep === 3 && !!selectedDate) ||
    (currentStep === 4 && !!selectedSlot);

  function goNext(): void {
    if (!canGoNext || currentStep >= 5) {
      return;
    }

    setCurrentStep((prev) => (prev + 1) as Step);
  }

  function goBack(): void {
    if (currentStep <= 1) {
      return;
    }

    setCurrentStep((prev) => (prev - 1) as Step);
  }

  const now = new Date();

  return (
    <section className="mx-auto w-full max-w-4xl text-left">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Progreso de la reserva</p>
            <p className="mt-1 text-sm text-slate-600">Sigue los pasos para completar la cita.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Paso {currentStep} de {steps.length}
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max items-start justify-center gap-2 pb-1 sm:min-w-0 sm:gap-3">
            {steps.map((step, index) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isFuture = currentStep < step.id;

              return (
                <div key={step.id} className="flex min-w-[82px] flex-1 items-center justify-center sm:min-w-0">
                  <div className="flex w-full items-center justify-center">
                    <div className="grid justify-items-center gap-2 text-center">
                      <div
                        className={[
                          "grid h-9 w-9 place-items-center rounded-full border text-sm font-semibold transition sm:h-10 sm:w-10",
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : isDone
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-500",
                        ].join(" ")}
                      >
                        {step.id}
                      </div>
                      <div className="grid gap-1">
                        <span
                          className={[
                            "text-[11px] font-medium leading-tight sm:text-xs",
                            isActive ? "text-slate-950" : isFuture ? "text-slate-400" : "text-slate-700",
                          ].join(" ")}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="mx-1 mt-[-22px] h-[2px] min-w-4 flex-1 rounded-full bg-slate-200 sm:mx-2">
                        <div
                          className={[
                            "h-full rounded-full transition",
                            currentStep > step.id ? "bg-slate-900" : "bg-transparent",
                          ].join(" ")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="barberId" value={selectedBarberId} />
        <input type="hidden" name="serviceId" value={selectedServiceId} />
        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="slot" value={selectedSlot} />

        {currentStep === 1 && (
          <fieldset className="space-y-3 border-none p-0 m-0">
            <legend className="mb-3 text-base font-semibold text-slate-950">Selecciona un barbero</legend>
            <div className="grid gap-3">
              {barbers.map((barber) => {
                const hasOngoingBooking = bookings.some((booking) => {
                  if (booking.barberId !== barber.id) {
                    return false;
                  }

                  const start = new Date(booking.startAt);
                  const end = new Date(booking.endAt);
                  return start <= now && end > now;
                });

                const visibleStatus = getVisibleBarberStatus(barber.manualStatus, hasOngoingBooking);
                const reservable = barber.isActive && barber.manualStatus === "AVAILABLE";
                const isSelected = selectedBarberId === String(barber.id);

                return (
                  <label
                    key={barber.id}
                    className={[
                      "grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition",
                      reservable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                      isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="barberId-ui"
                      value={String(barber.id)}
                      checked={isSelected}
                      disabled={!reservable}
                      onChange={(event) => {
                        setSelectedBarberId(event.target.value);
                        setSelectedServiceId("");
                        setSelectedSlot("");
                      }}
                      className="mt-0.5 h-5 w-5"
                    />

                    <div className="flex items-center gap-3">
                      <img
                        src={getBarberSpriteSrc(visibleStatus)}
                        alt={`${barber.name} ${visibleStatus.toLowerCase()}`}
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0"
                        style={{ imageRendering: "pixelated" }}
                      />

                      <div className="grid gap-1">
                        <strong className="text-base text-slate-950">{barber.name}</strong>
                        <div className="text-sm text-slate-700">
                          <BarberStatusIndicator status={visibleStatus} />
                        </div>
                        <span className="text-sm text-slate-500">Estacion #{barber.stationNumber}</span>
                        {!reservable && <span className="text-sm text-slate-500">No disponible para reservar.</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="space-y-4 border-none p-0 m-0">
            <legend className="mb-3 text-base font-semibold text-slate-950">Selecciona un servicio</legend>
            <p className="text-sm text-slate-600">
              Barbero: <strong className="text-slate-950">{selectedBarber?.name ?? "-"}</strong>
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedServiceId === String(service.id);

                return (
                  <label
                    key={service.id}
                    className={[
                      "block cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition",
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-blue-100"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="serviceId-ui"
                      value={String(service.id)}
                      checked={isSelected}
                      onChange={(event) => {
                        setSelectedServiceId(event.target.value);
                        setSelectedSlot("");
                      }}
                      className="sr-only"
                    />

                    <div className="grid gap-2">
                      <strong className="text-base text-slate-950">{service.name}</strong>
                      <span className="text-sm text-slate-600">{service.durationMin} min</span>
                      <span className="text-lg font-semibold text-slate-950">{formatLempiras(service.price)}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {currentStep === 3 && (
          <fieldset className="border-none p-0 m-0">
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-1">
                <h3 className="m-0 text-lg font-semibold text-slate-950">Selecciona una fecha</h3>
                <p className="m-0 text-sm text-slate-500">Elige el dia para mostrar los horarios disponibles.</p>
              </div>

              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-sm font-medium text-slate-500">Fecha seleccionada</span>
                <strong className="text-xl capitalize text-slate-950 sm:text-2xl">{formatDateDisplay(selectedDate)}</strong>
              </div>

              <div className="grid gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
                <label htmlFor="selectedDate" className="text-sm font-semibold text-slate-700">
                  Elegir fecha
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M14 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </span>

                  <input
                    id="selectedDate"
                    type="date"
                    value={selectedDate}
                    min={todayValue}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedSlot("");
                    }}
                    className="w-full rounded-2xl border border-blue-200 bg-white py-3 pl-12 pr-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <p className="m-0 text-sm text-slate-500">Solo se permiten fechas de hoy en adelante.</p>
            </div>
          </fieldset>
        )}

        {currentStep === 4 && (
          <fieldset className="space-y-4 border-none p-0 m-0">
            <legend className="mb-3 text-base font-semibold text-slate-950">Selecciona una hora</legend>
            <p className="text-sm text-slate-600">
              {selectedBarber?.name ?? "-"} | {selectedService?.name ?? "-"} | {selectedDate}
            </p>

            {isClosedDay ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                El local esta cerrado en esa fecha.
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                No hay horarios disponibles para esa fecha.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {availableSlots.map((slot) => (
                  <label
                    key={slot}
                    className={[
                      "flex min-h-14 cursor-pointer items-center justify-center rounded-xl border bg-white px-3 py-3 text-center text-base font-medium shadow-sm transition",
                      selectedSlot === slot
                        ? "border-blue-600 bg-blue-50 text-blue-950"
                        : "border-slate-200 text-slate-700 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="slot-ui"
                      value={slot}
                      checked={selectedSlot === slot}
                      onChange={(event) => setSelectedSlot(event.target.value)}
                      className="sr-only"
                    />
                    {slot}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {currentStep === 5 && (
          <fieldset className="border-none p-0 m-0">
            <legend className="mb-3 text-base font-semibold text-slate-950">Confirma la reserva</legend>

            <div className="grid gap-4 rounded-3xl border border-blue-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm sm:gap-5 sm:p-6">
              <div className="grid gap-1 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Paso final</span>
                <h3 className="m-0 text-xl font-semibold text-slate-950 sm:text-2xl">Resumen de la reserva</h3>
                <p className="m-0 text-sm text-slate-600">Revisa los datos y confirma cuando todo este correcto.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Barbero", value: selectedBarber?.name ?? "-" },
                  { label: "Servicio", value: selectedService?.name ?? "-" },
                  { label: "Fecha", value: formatDateDisplay(selectedDate) },
                  { label: "Hora", value: selectedSlot || "-" },
                  { label: "Cliente", value: customerName || "-" },
                  { label: "Telefono", value: customerPhone || "-" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</span>
                    <strong className="text-base leading-snug text-slate-950 sm:text-lg">{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-1">
                  <h4 className="m-0 text-base font-semibold text-slate-950">Datos del cliente</h4>
                  <p className="m-0 text-sm text-slate-500">Completa o ajusta la informacion antes de guardar la reserva.</p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="customerName" className="text-sm font-semibold text-slate-700">Nombre del cliente</label>
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="customerPhone" className="text-sm font-semibold text-slate-700">Telefono del cliente</label>
                    <input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="customerEmail" className="text-sm font-semibold text-slate-700">Email (opcional)</label>
                    <input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
                <p className="m-0 text-sm text-slate-600">Al confirmar, la reserva se guardara con el horario y barbero seleccionados.</p>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !selectedBarberId ||
                    !selectedServiceId ||
                    !selectedDate ||
                    !selectedSlot ||
                    !customerName.trim() ||
                    !customerPhone.trim()
                  }
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isPending ? "Guardando..." : "Confirmar reserva"}
                </button>
              </div>
            </div>
          </fieldset>
        )}
      </form>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 1}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Atras
        </button>

        {currentStep < 5 && (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Siguiente
          </button>
        )}
      </div>

      {state.message && (
        <p className={[
          "mt-4 text-sm font-semibold",
          state.success ? "text-emerald-700" : "text-rose-700",
        ].join(" ")}>
          {state.message}
        </p>
      )}
    </section>
  );
}

