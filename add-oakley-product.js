const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addOakleyProduct() {
  try {
    const product = await prisma.product.create({
      data: {
        name: "Oakley Holbrook",
        description: "Sports lifestyle sunglasses with Prizm lenses",
        companyId: 3,
        eyewearType: "SUNGLASSES",
        frameType: "RECTANGULAR",
        material: "O-MATTER",
        color: "Matte Black",
        size: "57mm",
        basePrice: 220.0,
        sku: "OAK-HOL-001",
        barcode: "9876543210987",
      },
      include: { company: true },
    });
    console.log("✅ Oakley product created:", JSON.stringify(product, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addOakleyProduct();
