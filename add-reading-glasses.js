const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addReadingGlasses() {
  try {
    const product = await prisma.product.create({
      data: {
        name: "Ray-Ban Reading Glasses Classic",
        description: "Premium reading glasses with blue light protection",
        companyId: 2, // Ray-Ban
        eyewearType: "GLASSES",
        frameType: "RECTANGULAR",
        material: "ACETATE",
        color: "Tortoise",
        size: "52mm",
        basePrice: 120.0,
        sku: "RB-READ-001",
        barcode: "1122334455667",
      },
      include: { company: true },
    });
    console.log(
      "✅ Reading glasses created:",
      JSON.stringify(product, null, 2)
    );
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addReadingGlasses();
