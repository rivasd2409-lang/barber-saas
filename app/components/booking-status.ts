import type { BookingStatus } from "@prisma/client";

export function getBookingStatusLabel(status: BookingStatus): string {
  if (status === "CONFIRMED") {
    return "Confirmado";
  }

  if (status === "COMPLETED") {
    return "Completado";
  }

  if (status === "CANCELLED") {
    return "Cancelado";
  }

  return "No se presento";
}
