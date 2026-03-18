import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "./actions";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
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

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const message = getQueryValue(params?.message);
  const editId = Number(getQueryValue(params?.editId));
  const showNewForm = getQueryValue(params?.new) === "1";

  const services = await prisma.service.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      price: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  const serviceToEdit =
    Number.isInteger(editId) && editId > 0
      ? services.find((service) => service.id === editId) ?? null
      : null;

  const isEditing = !!serviceToEdit;
  const shouldShowForm = showNewForm || isEditing;

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Catalogo interno</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Servicios</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
              Gestiona los servicios disponibles de la barberia
            </p>
          </div>

          <Link
            href="/services?new=1"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo servicio
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
                {isEditing ? "Editar servicio" : "Nuevo servicio"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completa los datos basicos del servicio.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cerrar
            </Link>
          </div>

          <form
            action={isEditing ? updateServiceAction : createServiceAction}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            {isEditing && <input type="hidden" name="id" value={serviceToEdit.id} />}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Nombre</span>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={serviceToEdit?.name ?? ""}
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Duracion</span>
              <input
                id="durationMin"
                name="durationMin"
                type="number"
                min="1"
                step="1"
                defaultValue={serviceToEdit?.durationMin ?? 30}
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Precio</span>
              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={serviceToEdit?.price ?? 10}
                required
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                {isEditing ? "Guardar cambios" : "Crear servicio"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Servicios disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">Consulta y gestiona el catalogo actual del local.</p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hay servicios registrados todavia.
          </div>
        ) : (
          <div className="grid gap-3">
            {services.map((service) => {
              const canDelete = service._count.bookings === 0;

              return (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{service.name}</h3>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Duracion</p>
                          <div className="mt-1 text-sm font-medium text-slate-950">{service.durationMin} min</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Precio</p>
                          <div className="mt-1 text-sm font-medium text-slate-950">{formatPrice(service.price)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:min-w-[250px] lg:justify-items-end">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/services?editId=${service.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Editar
                        </Link>

                        <form action={deleteServiceAction}>
                          <input type="hidden" name="id" value={service.id} />
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
                        <p className="max-w-[250px] text-sm text-slate-500">
                          No se puede eliminar porque tiene reservas asociadas.
                        </p>
                      )}
                    </div>
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
