-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "staffId" INTEGER;

-- Update existing invoices with a default staffId
UPDATE "public"."Invoice" SET "staffId" = 1 WHERE "staffId" IS NULL;

-- Alter the column to be NOT NULL
ALTER TABLE "public"."Invoice" ALTER COLUMN "staffId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
