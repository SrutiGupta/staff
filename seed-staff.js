const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "staff@example.com";
  const plainPassword = "password";

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  // First, ensure we have a default shop
  let defaultShop = await prisma.shop.findFirst({
    where: { name: "Default Optical Shop" },
  });

  if (!defaultShop) {
    console.log("Creating default shop...");
    defaultShop = await prisma.shop.create({
      data: {
        name: "Default Optical Shop",
        address: "123 Main Street, Default City",
        phone: "+1234567890",
        email: "shop@example.com",
      },
    });
    console.log("Default shop created successfully.");
  }

  // Check if the user already exists
  const existingStaff = await prisma.staff.findUnique({
    where: { email },
  });

  if (existingStaff) {
    console.log(
      `Staff member with email ${email} already exists. Updating password.`
    );
    // If user exists, update their password
    await prisma.staff.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log("Password updated successfully.");
  } else {
    // If user does not exist, create them
    await prisma.staff.create({
      data: {
        name: "Test Staff",
        email: email,
        password: hashedPassword,
        shopId: defaultShop.id,
        role: "SALES_STAFF",
      },
    });
    console.log(`Successfully created new staff member with email ${email}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
