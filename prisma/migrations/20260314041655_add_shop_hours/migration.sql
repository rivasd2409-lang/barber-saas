-- CreateTable
CREATE TABLE "ShopHours" (
    "dayOfWeek" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false
);
