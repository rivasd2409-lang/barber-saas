"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SHOP_DAY_ORDER, timeStringToMinutes } from "@/lib/shop-hours";

function buildRedirect(message: string): never {
  redirect(`/settings/hours?message=${encodeURIComponent(message)}`);
}

export async function saveShopHoursAction(formData: FormData): Promise<void> {
  for (const dayOfWeek of SHOP_DAY_ORDER) {
    const openTime = String(formData.get(`openTime-${dayOfWeek}`) ?? "");
    const closeTime = String(formData.get(`closeTime-${dayOfWeek}`) ?? "");
    const isClosed = formData.get(`isClosed-${dayOfWeek}`) === "on";

    const openMinutes = timeStringToMinutes(openTime);
    const closeMinutes = timeStringToMinutes(closeTime);

    if (!isClosed) {
      if (openMinutes === null || closeMinutes === null) {
        buildRedirect("Ingresa horarios validos.");
      }

      if (openMinutes >= closeMinutes) {
        buildRedirect("La hora de abrir debe ser menor a la hora de cerrar.");
      }
    }

    await prisma.shopHours.upsert({
      where: { dayOfWeek },
      update: {
        openTime,
        closeTime,
        isClosed,
      },
      create: {
        dayOfWeek,
        openTime,
        closeTime,
        isClosed,
      },
    });
  }

  revalidatePath("/settings/hours");
  revalidatePath("/agenda");
  revalidatePath("/book");
  redirect("/settings/hours?message=Horario%20actualizado%20correctamente.");
}
