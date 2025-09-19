/*
  Warnings:

  - The values [TRANSFER] on the enum `MovementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('SALE_TO_SHOP', 'PURCHASE', 'REFUND', 'COMMISSION', 'EXPENSE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."RetailerReportType" AS ENUM ('PROFIT_LOSS', 'TAX_REPORT', 'STOCK_VALUATION', 'SHOP_PERFORMANCE', 'PRODUCT_ANALYSIS', 'SALES_SUMMARY', 'INVENTORY_AGING', 'PAYMENT_STATUS');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."MovementType_new" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'LOSS', 'RECOUNT');
ALTER TABLE "public"."StockMovement" ALTER COLUMN "type" TYPE "public"."MovementType_new" USING ("type"::text::"public"."MovementType_new");
ALTER TYPE "public"."MovementType" RENAME TO "MovementType_old";
ALTER TYPE "public"."MovementType_new" RENAME TO "MovementType";
DROP TYPE "public"."MovementType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Inventory" DROP CONSTRAINT "Inventory_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "price",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."ShopInventory" ADD COLUMN     "lastSoldAt" TIMESTAMP(3),
ADD COLUMN     "reorderLevel" INTEGER NOT NULL DEFAULT 20,
ALTER COLUMN "quantity" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."StockMovement" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "stockReceiptId" INTEGER;

-- DropTable
DROP TABLE "public"."Inventory";

-- CreateTable
CREATE TABLE "public"."StockReceipt" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "verifiedQuantity" INTEGER,
    "receivedByStaffId" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedByAdminId" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "status" "public"."ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "supplierName" TEXT,
    "deliveryNote" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "adminNotes" TEXT,
    "discrepancyReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Retailer" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstNo" TEXT,
    "licenseNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetailerShop" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "partnershipType" TEXT,
    "commissionRate" DOUBLE PRECISION,
    "creditLimit" DOUBLE PRECISION,
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailerShop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetailerProduct" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "wholesalePrice" DOUBLE PRECISION NOT NULL,
    "mrp" DOUBLE PRECISION,
    "minSellingPrice" DOUBLE PRECISION,
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "allocatedStock" INTEGER NOT NULL DEFAULT 0,
    "availableStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetailerInventory" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "retailerProductId" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "inTransitStock" INTEGER NOT NULL DEFAULT 0,
    "warehouseLocation" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "averageCostPrice" DOUBLE PRECISION,
    "lastPurchasePrice" DOUBLE PRECISION,
    "lastPurchaseDate" TIMESTAMP(3),
    "supplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailerInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopDistribution" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "retailerShopId" INTEGER NOT NULL,
    "retailerProductId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryStatus" "public"."DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryDate" TIMESTAMP(3),
    "trackingNumber" TEXT,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetailerTransaction" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "referenceNo" TEXT,
    "shopId" INTEGER,
    "productId" INTEGER,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetailerReport" (
    "id" SERIAL NOT NULL,
    "retailerId" INTEGER NOT NULL,
    "reportType" "public"."RetailerReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB,
    "data" JSONB NOT NULL,
    "filePath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RetailerReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_email_key" ON "public"."Retailer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerShop_retailerId_shopId_key" ON "public"."RetailerShop"("retailerId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerProduct_retailerId_productId_key" ON "public"."RetailerProduct"("retailerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerInventory_retailerId_retailerProductId_key" ON "public"."RetailerInventory"("retailerId", "retailerProductId");

-- AddForeignKey
ALTER TABLE "public"."StockReceipt" ADD CONSTRAINT "StockReceipt_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockReceipt" ADD CONSTRAINT "StockReceipt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockReceipt" ADD CONSTRAINT "StockReceipt_receivedByStaffId_fkey" FOREIGN KEY ("receivedByStaffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockReceipt" ADD CONSTRAINT "StockReceipt_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "public"."ShopAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."ShopAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerShop" ADD CONSTRAINT "RetailerShop_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerShop" ADD CONSTRAINT "RetailerShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerProduct" ADD CONSTRAINT "RetailerProduct_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerProduct" ADD CONSTRAINT "RetailerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerInventory" ADD CONSTRAINT "RetailerInventory_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerInventory" ADD CONSTRAINT "RetailerInventory_retailerProductId_fkey" FOREIGN KEY ("retailerProductId") REFERENCES "public"."RetailerProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopDistribution" ADD CONSTRAINT "ShopDistribution_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopDistribution" ADD CONSTRAINT "ShopDistribution_retailerShopId_fkey" FOREIGN KEY ("retailerShopId") REFERENCES "public"."RetailerShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopDistribution" ADD CONSTRAINT "ShopDistribution_retailerProductId_fkey" FOREIGN KEY ("retailerProductId") REFERENCES "public"."RetailerProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerTransaction" ADD CONSTRAINT "RetailerTransaction_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetailerReport" ADD CONSTRAINT "RetailerReport_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "public"."Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
