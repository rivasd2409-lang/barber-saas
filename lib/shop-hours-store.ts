import { prisma } from "@/lib/prisma";
import { DEFAULT_SHOP_HOURS, type ShopHoursRecord } from "@/lib/shop-hours";

export async function ensureShopHours(): Promise<ShopHoursRecord[]> {
  const count = await prisma.shopHours.count();

  if (count === 0) {
    await prisma.shopHours.createMany({
      data: DEFAULT_SHOP_HOURS,
    });
  }

  return prisma.shopHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
}
