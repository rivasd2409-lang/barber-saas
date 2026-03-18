"use server";

import { BookingStatus, ManualBarberStatus } from "@prisma/client";
import { getShopHoursForDate, timeStringToMinutes } from "@/lib/shop-hours";
import { ensureShopHours } from "@/lib/shop-hours-store";
import { prisma } from "@/lib/prisma";

export type BookingActionState = {
  success: boolean;
  message: string;
};

function parseDateAndTime(dateValue: string, slot: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const [hoursRaw, minutesRaw] = slot.split(":");

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function isPastDate(dateValue: string): boolean {
  const [yearRaw, monthRaw, dayRaw] = dateValue.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return true;
  }

  const selectedDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  return selectedDay < today;
}

export async function createBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const barberId = Number(formData.get("barberId"));
  const serviceId = Number(formData.get("serviceId"));
  const dateValue = String(formData.get("date") ?? "");
  const slot = String(formData.get("slot") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const customerEmailRaw = String(formData.get("customerEmail") ?? "").trim();
  const customerEmail = customerEmailRaw || null;

  if (!Number.isInteger(barberId) || barberId <= 0) {
    return { success: false, message: "Selecciona un barbero valido." };
  }

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return { success: false, message: "Selecciona un servicio valido." };
  }

  if (!dateValue) {
    return { success: false, message: "Selecciona una fecha." };
  }

  if (isPastDate(dateValue)) {
    return { success: false, message: "No puedes reservar en fechas pasadas." };
  }

  if (!slot) {
    return { success: false, message: "Selecciona un horario." };
  }

  if (!customerName) {
    return { success: false, message: "Ingresa el nombre del cliente." };
  }

  if (!customerPhone) {
    return { success: false, message: "Ingresa el telefono del cliente." };
  }

  const [barber, service, shopHours] = await Promise.all([
    prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        isActive: true,
        manualStatus: true,
      },
    }),
    prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, durationMin: true },
    }),
    ensureShopHours(),
  ]);

  if (!barber || !barber.isActive) {
    return { success: false, message: "El barbero seleccionado no existe." };
  }

  if (barber.manualStatus === ManualBarberStatus.OFF_DUTY) {
    return { success: false, message: "Este barbero esta fuera de turno." };
  }

  if (!service) {
    return { success: false, message: "El servicio seleccionado no existe." };
  }

  const startAt = parseDateAndTime(dateValue, slot);

  if (!startAt) {
    return { success: false, message: "Fecha u horario invalido." };
  }

  const selectedDayHours = getShopHoursForDate(shopHours, startAt);

  if (!selectedDayHours || selectedDayHours.isClosed) {
    return { success: false, message: "El local esta cerrado en esa fecha." };
  }

  const openMinutes = timeStringToMinutes(selectedDayHours.openTime);
  const closeMinutes = timeStringToMinutes(selectedDayHours.closeTime);
  const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
  const endMinutes = startMinutes + service.durationMin;

  if (openMinutes === null || closeMinutes === null || startMinutes < openMinutes || endMinutes > closeMinutes) {
    return { success: false, message: "Ese horario esta fuera del horario del local." };
  }

  const endAt = new Date(startAt.getTime() + service.durationMin * 60 * 1000);

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      barberId: barber.id,
      status: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (overlappingBooking) {
    return {
      success: false,
      message: "Ese horario ya no esta disponible para el barbero seleccionado.",
    };
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { phone: customerPhone },
    select: { id: true },
  });

  const customer = existingCustomer
    ? existingCustomer
    : await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        select: { id: true },
      });

  await prisma.booking.create({
    data: {
      barberId: barber.id,
      serviceId: service.id,
      customerId: customer.id,
      startAt,
      endAt,
      status: BookingStatus.CONFIRMED,
    },
  });

  return { success: true, message: "Reserva creada correctamente." };
}
