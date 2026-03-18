import Link from "next/link";
import { ManualBarberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createBarberAction,
  deleteBarberAction,
  toggleBarberStatusAction,
  updateBarberAction,
} from "./actions";

export const dynamic = "force-dynamic";

type BarbersPageProps = {
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

function getManualStatusLabel(status: ManualBarberStatus): string {
  if (status === ManualBarberStatus.OFF_DUTY) {
    return "Fuera de servicio";
  }

  return "Disponible";
}

function getStatusStyles(status: ManualBarberStatus): { dot: string; text: string } {
  if (status === ManualBarberStatus.OFF_DUTY) {
    return {
      dot: "bg-red-500",
      text: "text-slate-700",
    };
  }

  return {
    dot: "bg-emerald-500",
    text: "text-slate-700",
  };
}

export default async function BarbersPage({ searchParams }: BarbersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const message = getQueryValue(params?.message);
  const editId = Number(getQueryValue(params?.editId));
  const showNewForm = getQueryValue(params?.new) === "1";

  const barbers = await prisma.barber.findMany({
    orderBy: { stationNumber: "asc" },
    select: {
      id: true,
      name: true,
      stationNumber: true,
      avatar: true,
      manualStatus: true,
      isActive: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  const barberToEdit =
    Number.isInteger(editId) && editId > 0
      ? barbers.find((barber) => barber.id === editId) ?? null
      : null;

  const isEditing = !!barberToEdit;
  const shouldShowForm = showNewForm || isEditing;

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Equipo interno</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Barberos</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Gestiona el equipo de trabajo del local
            </p>
          </div>

          <Link
            href="/barbers?new=1"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo barbero
          </Link>
        </div>
      </section>

      {message && (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
          {message}
        </section>
      )}

      {shouldShowForm && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {isEditing ? "Editar barbero" : "Nuevo barbero"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completa la informacion principal del perfil.
              </p>
            </div>
            <Link
              href="/barbers"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cerrar
            </Link>
          </div>

          <form
            action={isEditing ? updateBarberAction : createBarberAction}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            {isEditing && <input type="hidden" name="id" value={barberToEdit.id} />}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Nombre</span>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={barberToEdit?.name ?? ""}
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Estacion</span>
              <input
                id="stationNumber"
                name="stationNumber"
                type="number"
                min="1"
                step="1"
                defaultValue={barberToEdit?.stationNumber ?? 1}
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Avatar URL (opcional)</span>
              <input
                id="avatar"
                name="avatar"
                type="text"
                defaultValue={barberToEdit?.avatar ?? ""}
                placeholder="https://ejemplo.com/avatar.jpg"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Estado</span>
              <select
                id="manualStatus"
                name="manualStatus"
                defaultValue={barberToEdit?.manualStatus ?? ManualBarberStatus.AVAILABLE}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              >
                <option value={ManualBarberStatus.AVAILABLE}>Disponible</option>
                <option value={ManualBarberStatus.OFF_DUTY}>Fuera de servicio</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                {isEditing ? "Guardar cambios" : "Crear barbero"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Equipo actual</h2>
          <p className="mt-1 text-sm text-slate-500">Consulta perfiles, estado y estacion de cada barbero.</p>
        </div>

        {barbers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hay barberos registrados todavia.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {barbers.map((barber) => {
              const canDelete = barber._count.bookings === 0;
              const nextStatus =
                barber.manualStatus === ManualBarberStatus.AVAILABLE
                  ? ManualBarberStatus.OFF_DUTY
                  : ManualBarberStatus.AVAILABLE;
              const statusStyles = getStatusStyles(barber.manualStatus);

              return (
                <article
                  key={barber.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {barber.avatar ? (
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700 shadow-sm">
                        {barber.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-slate-950">{barber.name}</h3>
                      <div className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${statusStyles.text}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${statusStyles.dot}`} aria-hidden="true" />
                        {getManualStatusLabel(barber.manualStatus)}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Estacion #{barber.stationNumber}</p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/barbers?editId=${barber.id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Editar
                      </Link>

                      <form action={toggleBarberStatusAction}>
                        <input type="hidden" name="id" value={barber.id} />
                        <input type="hidden" name="manualStatus" value={nextStatus} />
                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Cambiar estado
                        </button>
                      </form>

                      <form action={deleteBarberAction}>
                        <input type="hidden" name="id" value={barber.id} />
                        <button
                          type="submit"
                          disabled={!canDelete}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>

                    {!canDelete && (
                      <p className="mt-3 text-sm text-slate-500">
                        No se puede eliminar porque tiene reservas asociadas.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
