const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkConnectivity() {
  try {
    console.log("=== EXISTING SHOPS ===");
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    });
    console.log(shops);

    console.log("\n=== RETAILER-SHOP CONNECTIONS ===");
    const retailerShops = await prisma.retailerShop.findMany({
      include: {
        shop: { select: { name: true } },
        retailer: { select: { name: true } },
      },
    });
    console.log(retailerShops);

    console.log("\n=== RETAILERS ===");
    const retailers = await prisma.retailer.findMany({
      select: { id: true, name: true, email: true },
    });
    console.log(retailers);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnectivity();
