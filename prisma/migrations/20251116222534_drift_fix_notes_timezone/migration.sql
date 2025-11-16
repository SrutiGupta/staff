-- This is an empty migration.
ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Shop" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';
