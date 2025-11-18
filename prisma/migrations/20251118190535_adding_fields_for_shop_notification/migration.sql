-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('EXPECTED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."IncomingShipment" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "shopDistributionId" INTEGER,
    "expectedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "discrepancyQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'EXPECTED',
    "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "stockReceiptId" INTEGER,
    "notes" TEXT,
    "discrepancyReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingShipment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."IncomingShipment" ADD CONSTRAINT "IncomingShipment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IncomingShipment" ADD CONSTRAINT "IncomingShipment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IncomingShipment" ADD CONSTRAINT "IncomingShipment_shopDistributionId_fkey" FOREIGN KEY ("shopDistributionId") REFERENCES "public"."ShopDistribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IncomingShipment" ADD CONSTRAINT "IncomingShipment_stockReceiptId_fkey" FOREIGN KEY ("stockReceiptId") REFERENCES "public"."StockReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
