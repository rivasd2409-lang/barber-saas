"use server";

import { ManualBarberStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function buildRedirect(message: string): never {
  redirect(`/barbers?message=${encodeURIComponent(message)}`);
}

function parseStationNumber(value: FormDataEntryValue | null): number {
  return Number(value ?? 0);
}

function parseManualStatus(value: FormDataEntryValue | null): ManualBarberStatus | null {
  if (value === ManualBarberStatus.AVAILABLE || value === ManualBarberStatus.OFF_DUTY) {
    return value;
  }

  return null;
}

export async function createBarberAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const stationNumber = parseStationNumber(formData.get("stationNumber"));
  const avatarRaw = String(formData.get("avatar") ?? "").trim();
  const avatar = avatarRaw || null;
  const manualStatus = parseManualStatus(formData.get("manualStatus"));

  if (!name) {
    buildRedirect("Ingresa un nombre.");
  }

  if (!Number.isInteger(stationNumber) || stationNumber <= 0) {
    buildRedirect("Ingresa una estacion valida.");
  }

  if (!manualStatus) {
    buildRedirect("Selecciona un estado valido.");
  }

  try {
    await prisma.barber.create({
      data: {
        name,
        stationNumber,
        avatar,
        manualStatus,
        isActive: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      buildRedirect("Ya existe un barbero con ese nombre.");
    }

    throw error;
  }

  revalidatePath("/barbers");
  redirect("/barbers?message=Barbero%20creado%20correctamente.");
}

export async function updateBarberAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const stationNumber = parseStationNumber(formData.get("stationNumber"));
  const avatarRaw = String(formData.get("avatar") ?? "").trim();
  const avatar = avatarRaw || null;
  const manualStatus = parseManualStatus(formData.get("manualStatus"));

  if (!Number.isInteger(id) || id <= 0) {
    buildRedirect("Barbero invalido.");
  }

  if (!name) {
    buildRedirect("Ingresa un nombre.");
  }

  if (!Number.isInteger(stationNumber) || stationNumber <= 0) {
    buildRedirect("Ingresa una estacion valida.");
  }

  if (!manualStatus) {
    buildRedirect("Selecciona un estado valido.");
  }

  try {
    await prisma.barber.update({
      where: { id },
      data: {
        name,
        stationNumber,
        avatar,
        manualStatus,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      buildRedirect("Ya existe un barbero con ese nombre.");
    }

    throw error;
  }

  revalidatePath("/barbers");
  redirect("/barbers?message=Barbero%20actualizado%20correctamente.");
}

export async function toggleBarberStatusAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const manualStatus = parseManualStatus(formData.get("manualStatus"));

  if (!Number.isInteger(id) || id <= 0) {
    buildRedirect("Barbero invalido.");
  }

  if (!manualStatus) {
    buildRedirect("Selecciona un estado valido.");
  }

  await prisma.barber.update({
    where: { id },
    data: { manualStatus },
  });

  revalidatePath("/barbers");
  redirect("/barbers?message=Estado%20actualizado%20correctamente.");
}

export async function deleteBarberAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    buildRedirect("Barbero invalido.");
  }

  const existing = await prisma.barber.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!existing) {
    buildRedirect("El barbero no existe.");
  }

  if (existing._count.bookings > 0) {
    buildRedirect("No puedes eliminar un barbero con reservas.");
  }

  await prisma.barber.delete({
    where: { id },
  });

  revalidatePath("/barbers");
  redirect("/barbers?message=Barbero%20eliminado%20correctamente.");
}
