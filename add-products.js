const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addProducts() {
  console.log("🚀 Adding products to retailer inventory...");

  try {
    // 1. Get the test retailer
    const retailer = await prisma.retailer.findFirst({
      where: { email: "test.retailer@example.com" },
    });

    if (!retailer) {
      console.log("❌ Test retailer not found!");
      return;
    }

    console.log(`📋 Using Retailer: ${retailer.name} (ID: ${retailer.id})`);

    // 2. Create companies if they don't exist
    const companies = [
      { name: "Ray-Ban", description: "Premium sunglasses and eyewear" },
      { name: "Oakley", description: "Sports performance eyewear" },
      { name: "Generic Brand", description: "Affordable optical solutions" },
    ];

    const createdCompanies = [];
    for (const company of companies) {
      let existing = await prisma.company.findFirst({
        where: { name: company.name },
      });
      if (!existing) {
        existing = await prisma.company.create({ data: company });
        console.log(`✅ Created company: ${existing.name}`);
      }
      createdCompanies.push(existing);
    }

    // 3. Create products if they don't exist
    const products = [
      {
        name: "Ray-Ban Aviator Classic",
        sku: "RB-AV-001",
        description: "Iconic aviator sunglasses",
        eyewearType: "SUNGLASSES",
        frameType: "AVIATOR",
        basePrice: 150.0,
        companyId: createdCompanies[0].id,
        material: "Metal",
        color: "Gold",
      },
      {
        name: "Ray-Ban Wayfarer",
        sku: "RB-WF-001",
        description: "Classic wayfarer sunglasses",
        eyewearType: "SUNGLASSES",
        frameType: "WAYFARER",
        basePrice: 120.0,
        companyId: createdCompanies[0].id,
        material: "Acetate",
        color: "Black",
      },
      {
        name: "Oakley Holbrook",
        sku: "OK-HB-001",
        description: "Modern sport sunglasses",
        eyewearType: "SUNGLASSES",
        frameType: "SQUARE",
        basePrice: 180.0,
        companyId: createdCompanies[1].id,
        material: "O-Matter",
        color: "Matte Black",
      },
    ];

    const createdProducts = [];
    for (const product of products) {
      let existing = await prisma.product.findFirst({
        where: { sku: product.sku },
      });
      if (!existing) {
        existing = await prisma.product.create({ data: product });
        console.log(`✅ Created product: ${existing.name}`);
      }
      createdProducts.push(existing);
    }

    // 4. Add to retailer inventory
    const retailerProducts = [
      {
        productId: createdProducts[0].id,
        wholesalePrice: 120.0,
        mrp: 180.0,
        minSellingPrice: 130.0,
        totalStock: 50,
        availableStock: 50,
        reorderLevel: 10,
      },
      {
        productId: createdProducts[1].id,
        wholesalePrice: 95.0,
        mrp: 150.0,
        minSellingPrice: 100.0,
        totalStock: 40,
        availableStock: 40,
        reorderLevel: 8,
      },
      {
        productId: createdProducts[2].id,
        wholesalePrice: 140.0,
        mrp: 220.0,
        minSellingPrice: 150.0,
        totalStock: 30,
        availableStock: 30,
        reorderLevel: 5,
      },
    ];

    for (const rp of retailerProducts) {
      const existing = await prisma.retailerProduct.findFirst({
        where: { retailerId: retailer.id, productId: rp.productId },
      });

      if (!existing) {
        const created = await prisma.retailerProduct.create({
          data: { retailerId: retailer.id, ...rp },
          include: { product: true },
        });

        await prisma.retailerInventory.create({
          data: {
            retailerId: retailer.id,
            retailerProductId: created.id,
            currentStock: rp.totalStock,
            warehouseLocation: "Main Warehouse",
            supplier: "Direct Import",
            lastPurchasePrice: rp.wholesalePrice * 0.8,
            lastPurchaseDate: new Date(),
          },
        });

        console.log(
          `✅ Added: ${created.product.name} - Stock: ${created.totalStock}`
        );
      } else {
        console.log(`📋 Already exists: ${existing.id}`);
      }
    }

    console.log("🎉 Products added successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addProducts();
