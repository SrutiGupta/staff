const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'staff@example.com';
  const plainPassword = 'password';

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  // Check if the user already exists
  const existingStaff = await prisma.staff.findUnique({
    where: { email },
  });

  if (existingStaff) {
    console.log(`Staff member with email ${email} already exists. Updating password.`);
    // If user exists, update their password
    await prisma.staff.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log('Password updated successfully.');
  } else {
    // If user does not exist, create them
    await prisma.staff.create({
      data: {
        name: 'Test Staff',
        email: email,
        password: hashedPassword
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
