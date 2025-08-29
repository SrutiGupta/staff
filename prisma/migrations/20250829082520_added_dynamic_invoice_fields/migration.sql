/*
  Warnings:

  - A unique constraint covering the columns `[prescriptionId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "prescriptionId" INTEGER,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalCgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalIgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalSgst" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."InvoiceItem" ADD COLUMN     "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Patient" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."Prescription" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "rightEye" JSONB NOT NULL,
    "leftEye" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_prescriptionId_key" ON "public"."Invoice"("prescriptionId");

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
