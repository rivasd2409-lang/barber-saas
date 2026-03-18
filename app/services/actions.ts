"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseDuration(value: FormDataEntryValue | null): number {
  return Number(value ?? 0);
}

function parsePrice(value: FormDataEntryValue | null): number {
  return Number(value ?? 0);
}

function buildRedirect(message: string): never {
  redirect(`/services?message=${encodeURIComponent(message)}`);
}

export async function createServiceAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const durationMin = parseDuration(formData.get("durationMin"));
  const price = parsePrice(formData.get("price"));

  if (!name) {
    buildRedirect("Ingresa un nombre.");
  }

  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    buildRedirect("Ingresa una duracion valida.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    buildRedirect("Ingresa un precio valido.");
  }

  try {
    await prisma.service.create({
      data: {
        name,
        durationMin,
        price,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      buildRedirect("Ya existe un servicio con ese nombre.");
    }

    throw error;
  }

  revalidatePath("/services");
  redirect("/services?message=Servicio%20creado%20correctamente.");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const durationMin = parseDuration(formData.get("durationMin"));
  const price = parsePrice(formData.get("price"));

  if (!Number.isInteger(id) || id <= 0) {
    buildRedirect("Servicio invalido.");
  }

  if (!name) {
    buildRedirect("Ingresa un nombre.");
  }

  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    buildRedirect("Ingresa una duracion valida.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    buildRedirect("Ingresa un precio valido.");
  }

  try {
    await prisma.service.update({
      where: { id },
      data: {
        name,
        durationMin,
        price,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      buildRedirect("Ya existe un servicio con ese nombre.");
    }

    throw error;
  }

  revalidatePath("/services");
  redirect("/services?message=Servicio%20actualizado%20correctamente.");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    buildRedirect("Servicio invalido.");
  }

  const existing = await prisma.service.findUnique({
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
    buildRedirect("El servicio no existe.");
  }

  if (existing._count.bookings > 0) {
    buildRedirect("No puedes eliminar un servicio con reservas.");
  }

  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/services");
  redirect("/services?message=Servicio%20eliminado%20correctamente.");
}
