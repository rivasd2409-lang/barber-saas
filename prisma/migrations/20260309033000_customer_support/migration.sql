/*
  Manual migration for Customer support:
  - Creates Customer table
  - Backfills one customer per phone from existing bookings
  - Links existing bookings to customerId
*/

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backfill customers from existing bookings
WITH normalized AS (
  SELECT
    "id",
    CASE
      WHEN trim("customerName") = '' THEN 'Cliente ' || "id"
      ELSE "customerName"
    END AS normalized_name,
    CASE
      WHEN trim("customerPhone") = '' THEN 'legacy-' || "id"
      ELSE "customerPhone"
    END AS normalized_phone,
    "createdAt"
  FROM "Booking"
)
INSERT INTO "Customer" ("name", "phone", "email", "createdAt")
SELECT MIN(normalized_name), normalized_phone, NULL, MIN("createdAt")
FROM normalized
GROUP BY normalized_phone;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "barberId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("id", "barberId", "serviceId", "customerId", "startAt", "endAt", "status", "createdAt")
SELECT
  b."id",
  b."barberId",
  b."serviceId",
  c."id",
  b."startAt",
  b."endAt",
  b."status",
  b."createdAt"
FROM "Booking" b
JOIN "Customer" c
  ON c."phone" = CASE
    WHEN trim(b."customerPhone") = '' THEN 'legacy-' || b."id"
    ELSE b."customerPhone"
  END;
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_barberId_startAt_endAt_idx" ON "Booking"("barberId", "startAt", "endAt");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
