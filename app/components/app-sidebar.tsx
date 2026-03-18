"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agenda", label: "Agenda" },
  { href: "/clientes", label: "Clientes" },
  { href: "/retention", label: "Retencion" },
  { href: "/services", label: "Servicios" },
  { href: "/barbers", label: "Barberos" },
  { href: "/settings/hours", label: "Horario" },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
        <Link href="/" className="block" onClick={onNavigate}>
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
            Barber SaaS
          </div>
          <div className="mt-2 text-xl font-semibold text-white">Panel local</div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-400">
        Compatible con la UI actual y futuras capas visuales.
      </div>
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Barber SaaS</div>
          <div className="text-sm font-semibold text-slate-950">Panel local</div>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span className="text-xl leading-none">=</span>
        </button>
      </header>

      <div
        className={[
          "fixed inset-0 z-50 bg-slate-950/45 transition-opacity lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-slate-900 text-slate-100 transition-transform lg:z-40 lg:w-64 lg:max-w-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:hidden">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            aria-label="Cerrar menu"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-slate-200"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
