"use server";

import { BookingStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
]);

export async function updateBookingStatusAction(formData: FormData): Promise<void> {
  const bookingId = Number(formData.get("bookingId"));
  const nextStatus = String(formData.get("nextStatus") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/agenda");

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    redirect(returnTo);
  }

  if (!allowedStatuses.has(nextStatus as BookingStatus)) {
    redirect(returnTo);
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus as BookingStatus },
  });

  redirect(returnTo);
}
