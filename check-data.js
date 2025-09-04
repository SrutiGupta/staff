const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany();
    console.log("Existing products:", JSON.stringify(products, null, 2));

    const patients = await prisma.patient.findMany();
    console.log("Existing patients:", JSON.stringify(patients, null, 2));

    const prescriptions = await prisma.prescription.findMany();
    console.log(
      "Existing prescriptions:",
      JSON.stringify(prescriptions, null, 2)
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
