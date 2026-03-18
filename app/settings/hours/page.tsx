import { ensureShopHours } from "@/lib/shop-hours-store";
import { SHOP_DAY_LABELS, SHOP_DAY_ORDER } from "@/lib/shop-hours";
import { saveShopHoursAction } from "./actions";

export const dynamic = "force-dynamic";

type ShopHoursPageProps = {
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

export default async function ShopHoursPage({ searchParams }: ShopHoursPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const message = getQueryValue(params?.message);
  const hours = await ensureShopHours();

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Configuracion del local</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Horario</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
            Configura los dias y horas de atencion del local
          </p>
        </div>
      </section>

      {message && (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
          {message}
        </section>
      )}

      <form action={saveShopHoursAction} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">Horario semanal</h2>
            <p className="mt-1 text-sm text-slate-500">Activa o cierra cada dia y ajusta sus horas de atencion.</p>
          </div>

          <div className="grid gap-4">
            {SHOP_DAY_ORDER.map((dayOfWeek) => {
              const dayHours = hours.find((item) => item.dayOfWeek === dayOfWeek);
              const isClosed = dayHours?.isClosed ?? false;

              return (
                <article
                  key={dayOfWeek}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{SHOP_DAY_LABELS[dayOfWeek]}</h3>
                      <span
                        className={[
                          "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium",
                          isClosed
                            ? "border-slate-200 bg-slate-100 text-slate-500"
                            : "border-emerald-100 bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {isClosed ? "Cerrado" : "Activo"}
                      </span>
                    </div>

                    <div className="grid gap-4">
                      <input
                        id={`isClosed-${dayOfWeek}`}
                        type="checkbox"
                        name={`isClosed-${dayOfWeek}`}
                        defaultChecked={isClosed}
                        className="peer sr-only"
                      />

                      <label
                        htmlFor={`isClosed-${dayOfWeek}`}
                        className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        <span className="text-slate-500 peer-checked:text-slate-700">Activo</span>
                        <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition peer-checked:bg-slate-900">
                          <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                        </span>
                        <span className="text-slate-700">Cerrado</span>
                      </label>

                      <div className="grid gap-3 peer-checked:hidden md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Desde</span>
                          <input
                            type="time"
                            name={`openTime-${dayOfWeek}`}
                            defaultValue={dayHours?.openTime ?? "08:00"}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Hasta</span>
                          <input
                            type="time"
                            name={`closeTime-${dayOfWeek}`}
                            defaultValue={dayHours?.closeTime ?? "19:00"}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200"
                          />
                        </label>
                      </div>

                      <p className="hidden text-sm text-slate-500 peer-checked:block">Cerrado</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Guardar horario
          </button>
        </div>
      </form>
    </main>
  );
}
