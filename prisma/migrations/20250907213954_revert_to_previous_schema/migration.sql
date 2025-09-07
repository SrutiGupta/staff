/*
  Warnings:

  - You are about to drop the column `doctorId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `shopStaffId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the `Doctor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopInventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopStaff` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `staffId` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_shopStaffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Doctor" DROP CONSTRAINT "Doctor_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Shop" DROP CONSTRAINT "Shop_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShopInventory" DROP CONSTRAINT "ShopInventory_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShopInventory" DROP CONSTRAINT "ShopInventory_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShopStaff" DROP CONSTRAINT "ShopStaff_shopId_fkey";

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "doctorId",
DROP COLUMN "shopStaffId",
ALTER COLUMN "staffId" SET NOT NULL;

-- DropTable
DROP TABLE "public"."Doctor";

-- DropTable
DROP TABLE "public"."Shop";

-- DropTable
DROP TABLE "public"."ShopAdmin";

-- DropTable
DROP TABLE "public"."ShopInventory";

-- DropTable
DROP TABLE "public"."ShopStaff";

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
