/*
  Warnings:

  - You are about to drop the column `igst` on the `InvoiceItem` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eyewearType` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."EyewearType" AS ENUM ('GLASSES', 'SUNGLASSES', 'LENSES');

-- CreateEnum
CREATE TYPE "public"."FrameType" AS ENUM ('RECTANGULAR', 'OVAL', 'ROUND', 'SQUARE', 'AVIATOR', 'WAYFARER', 'CAT_EYE', 'CLUBMASTER', 'RIMLESS', 'SEMI_RIMLESS', 'WRAP_AROUND');

-- CreateTable (Create Company table first)
CREATE TABLE "public"."Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "public"."Company"("name");

-- Insert a default company for existing products
INSERT INTO "public"."Company" ("name", "description", "updatedAt") 
VALUES ('Generic Brand', 'Default company for existing products', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "public"."InvoiceItem" DROP COLUMN "igst";

-- Add new columns to Product table with default values for existing records
ALTER TABLE "public"."Product" ADD COLUMN "color" TEXT;
ALTER TABLE "public"."Product" ADD COLUMN "material" TEXT;
ALTER TABLE "public"."Product" ADD COLUMN "model" TEXT;
ALTER TABLE "public"."Product" ADD COLUMN "size" TEXT;
ALTER TABLE "public"."Product" ADD COLUMN "frameType" "public"."FrameType";

-- Add companyId with default value pointing to the Generic Brand company
ALTER TABLE "public"."Product" ADD COLUMN "companyId" INTEGER DEFAULT 1;

-- Add eyewearType with default value
ALTER TABLE "public"."Product" ADD COLUMN "eyewearType" "public"."EyewearType" DEFAULT 'GLASSES';

-- Update existing products to have proper values
UPDATE "public"."Product" SET 
    "companyId" = 1,
    "eyewearType" = 'GLASSES',
    "frameType" = 'RECTANGULAR'
WHERE "companyId" IS NULL OR "eyewearType" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "public"."Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "public"."Product" ALTER COLUMN "eyewearType" SET NOT NULL;

-- Remove the default constraints since they're no longer needed
ALTER TABLE "public"."Product" ALTER COLUMN "companyId" DROP DEFAULT;
ALTER TABLE "public"."Product" ALTER COLUMN "eyewearType" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
