import Link from "next/link";
import type { BookingStatus } from "@prisma/client";
import { getBookingStatusLabel } from "@/app/components/booking-status";
import { updateBookingStatusAction } from "@/app/components/booking-status-actions";

type BookingDetailsModalProps = {
  booking: {
    id: number;
    status: BookingStatus;
    startAt: Date;
    customer: {
      name: string;
      phone: string;
    };
    barber: {
      name: string;
    };
    service: {
      name: string;
    };
  };
  closeHref: string;
  returnTo: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingDetailsModal({ booking, closeHref, returnTo }: BookingDetailsModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: "14px",
          padding: "1rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
          <div>
            <h2 style={{ margin: 0 }}>Detalle de reserva</h2>
            <p style={{ margin: "0.35rem 0 0", color: "#555" }}>Gestion manual del estado.</p>
          </div>
          <Link href={closeHref}>Cerrar</Link>
        </div>

        <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
          <div>Cliente: <strong>{booking.customer.name}</strong></div>
          <div>Telefono: <strong>{booking.customer.phone}</strong></div>
          <div>Barbero: <strong>{booking.barber.name}</strong></div>
          <div>Servicio: <strong>{booking.service.name}</strong></div>
          <div>Fecha: <strong>{booking.startAt.toLocaleDateString("es-HN")}</strong></div>
          <div>Hora: <strong>{formatTime(booking.startAt)}</strong></div>
          <div>Estado actual: <strong>{getBookingStatusLabel(booking.status)}</strong></div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
          <form action={updateBookingStatusAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="nextStatus" value="COMPLETED" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit">Completar</button>
          </form>

          <form action={updateBookingStatusAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="nextStatus" value="NO_SHOW" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit">No se presento</button>
          </form>

          <form action={updateBookingStatusAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="nextStatus" value="CANCELLED" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit">Cancelar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
