export type ShopHoursRecord = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export const DEFAULT_SHOP_HOURS: ShopHoursRecord[] = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "19:00", isClosed: true },
  { dayOfWeek: 1, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 6, openTime: "08:00", closeTime: "19:00", isClosed: false },
];

export const SHOP_DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

export const SHOP_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function timeStringToMinutes(value: string): number | null {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getShopHoursForDate(
  hours: ShopHoursRecord[],
  date: Date
): ShopHoursRecord | null {
  return hours.find((item) => item.dayOfWeek === date.getDay()) ?? null;
}
