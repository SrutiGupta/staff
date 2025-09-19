const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== STAFF MEMBERS ===");
    const staff = await prisma.staff.findMany();
    staff.forEach((s) => {
      console.log(
        `ID: ${s.id}, Email: ${s.email}, Role: ${s.role}, Shop: ${s.shopId}`
      );
    });

    console.log("\n=== SHOP ADMINS ===");
    const shopAdmins = await prisma.shopAdmin.findMany();
    console.log(`Total shop admins: ${shopAdmins.length}`);
    shopAdmins.forEach((admin) => {
      console.log(
        `ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}, Shop: ${admin.shopId}`
      );
    });

    console.log("\n=== ATTENDANCE RECORDS ===");
    const attendance = await prisma.attendance.findMany({
      include: {
        staff: {
          select: { id: true, name: true, role: true, shopId: true },
        },
      },
    });

    console.log(`Total attendance records: ${attendance.length}`);
    attendance.slice(0, 5).forEach((record, i) => {
      console.log(
        `${i + 1}. Staff: ${record.staff.name} (ID: ${record.staffId}, Shop: ${
          record.staff.shopId
        })`
      );
      console.log(
        `   Login: ${record.loginTime}, Logout: ${
          record.logoutTime || "Still logged in"
        }`
      );
    });
    if (attendance.length > 5) {
      console.log(`... and ${attendance.length - 5} more records`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
