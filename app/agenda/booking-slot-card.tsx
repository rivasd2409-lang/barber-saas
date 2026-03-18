"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BookingStatus } from "@prisma/client";
import { updateBookingStatusAction } from "@/app/components/booking-status-actions";

type BookingSlotCardProps = {
  bookingId: number;
  status: BookingStatus;
  serviceName: string;
  customerName: string;
  detailsHref: string;
  returnTo: string;
  className: string;
};

const actionItems: Array<{
  key: string;
  label: string;
  nextStatus?: BookingStatus;
}> = [
  { key: "completed", label: "Completar", nextStatus: "COMPLETED" },
  { key: "no-show", label: "No se presento", nextStatus: "NO_SHOW" },
  { key: "cancelled", label: "Cancelar", nextStatus: "CANCELLED" },
  { key: "edit", label: "Editar reserva" },
];

export function BookingSlotCard({
  bookingId,
  status,
  serviceName,
  customerName,
  detailsHref,
  returnTo,
  className,
}: BookingSlotCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent | TouchEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Link href={detailsHref} className={className}>
        <div className="pr-12">
          <div className="text-sm font-semibold leading-snug text-slate-950">{serviceName}</div>
          <div className="mt-1 text-sm leading-snug text-slate-700">{customerName}</div>
        </div>
      </Link>

      <button
        type="button"
        aria-label="Acciones de la reserva"
        aria-expanded={isMenuOpen}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsMenuOpen((current) => !current);
        }}
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/90 text-slate-500 shadow-sm transition hover:text-slate-900"
      >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="8" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="13" cy="8" r="1.25" />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="absolute right-3 top-14 z-20 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="grid gap-1">
            {actionItems.map((item) => {
              if (!item.nextStatus) {
                return (
                  <Link
                    key={item.key}
                    href={detailsHref}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                );
              }

              const isCurrentStatus = status === item.nextStatus;

              return (
                <form key={item.key} action={updateBookingStatusAction}>
                  <input type="hidden" name="bookingId" value={bookingId} />
                  <input type="hidden" name="nextStatus" value={item.nextStatus} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    type="submit"
                    disabled={isCurrentStatus}
                    className="w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {item.label}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

