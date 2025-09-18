const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Remove duplicate login - use authController.js instead

exports.logout = async (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const staffId = req.user.id; // Get from authenticated user

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId: staffId,
        logoutTime: null,
      },
      orderBy: {
        loginTime: "desc",
      },
    });

    if (attendance) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { logoutTime: new Date() },
      });
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    // Only show attendance for staff in the same shop
    const attendance = await prisma.attendance.findMany({
      where: {
        staff: {
          shopId: req.user.shopId,
        },
      },
      include: {
        staff: true,
      },
    });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getAttendanceByStaff = async (req, res) => {
  const { staffId } = req.params;

  try {
    // Verify staff belongs to same shop
    const staff = await prisma.staff.findUnique({
      where: { id: parseInt(staffId) },
    });

    if (!staff || staff.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({ error: "Access denied. Staff belongs to different shop." });
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        staffId: parseInt(staffId),
      },
      include: {
        staff: true,
      },
    });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
