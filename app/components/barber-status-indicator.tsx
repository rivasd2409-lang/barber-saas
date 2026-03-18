export type ManualBarberStatus = "AVAILABLE" | "OFF_DUTY";
export type VisibleBarberStatus = "AVAILABLE" | "WORKING" | "OFF_DUTY";

type BarberStatusIndicatorProps = {
  status: VisibleBarberStatus;
};

function getStatusLabel(status: VisibleBarberStatus): string {
  if (status === "OFF_DUTY") {
    return "Fuera de servicio";
  }

  if (status === "WORKING") {
    return "Trabajando";
  }

  return "Disponible";
}

function getStatusColor(status: VisibleBarberStatus): string {
  if (status === "OFF_DUTY") {
    return "#d93025";
  }

  if (status === "WORKING") {
    return "#d18b00";
  }

  return "#1a9c46";
}

export function getVisibleBarberStatus(
  manualStatus: ManualBarberStatus,
  hasActiveBooking: boolean
): VisibleBarberStatus {
  if (manualStatus === "OFF_DUTY") {
    return "OFF_DUTY";
  }

  if (hasActiveBooking) {
    return "WORKING";
  }

  return "AVAILABLE";
}

export function BarberStatusIndicator({ status }: BarberStatusIndicatorProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
      <span
        aria-hidden="true"
        style={{
          width: "0.7rem",
          height: "0.7rem",
          borderRadius: "999px",
          background: getStatusColor(status),
          flexShrink: 0,
        }}
      />
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}
