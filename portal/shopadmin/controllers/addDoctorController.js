const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/**
 * Add Doctor (OPTOMETRIST) - Only Shop Admins can add doctors
 */
exports.addDoctor = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Email, password, and name are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Get shop admin info from authenticated request
    const shopAdminId = req.shopAdmin.id;
    const shopId = req.shopAdmin.shopId;

    // Check if doctor (staff with email) already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return res.status(409).json({
        error: "Doctor with this email already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create doctor as staff with OPTOMETRIST role
    const doctor = await prisma.staff.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "OPTOMETRIST",
        shopId: shopId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log the action in audit trail
    await prisma.auditLog.create({
      data: {
        adminId: shopAdminId,
        action: "ADD_DOCTOR",
        targetType: "STAFF",
        targetId: doctor.id.toString(),
        details: `Added doctor: ${doctor.name} (${doctor.email})`,
      },
    });

    res.status(201).json({
      message: "Doctor added successfully",
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        shopId: doctor.shopId,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding doctor:", error);

    // Handle unique constraint errors
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Doctor with this email already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error while adding doctor",
    });
  }
};

/**
 * Get all doctors for the shop admin's shop
 */
exports.getDoctors = async (req, res) => {
  try {
    const shopId = req.shopAdmin.shopId;

    const doctors = await prisma.staff.findMany({
      where: {
        shopId: shopId,
        role: "OPTOMETRIST",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Doctors retrieved successfully",
      doctors: doctors,
      count: doctors.length,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      error: "Internal server error while fetching doctors",
    });
  }
};

/**
 * Update doctor status (activate/deactivate)
 */
exports.updateDoctorStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isActive } = req.body;
    const shopAdminId = req.shopAdmin.id;
    const shopId = req.shopAdmin.shopId;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "isActive must be a boolean value",
      });
    }

    // Check if doctor exists and belongs to the same shop
    const doctor = await prisma.staff.findFirst({
      where: {
        id: parseInt(doctorId),
        shopId: shopId,
        role: "OPTOMETRIST",
      },
    });

    if (!doctor) {
      return res.status(404).json({
        error: "Doctor not found or doesn't belong to your shop",
      });
    }

    // Update doctor status
    const updatedDoctor = await prisma.staff.update({
      where: { id: parseInt(doctorId) },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: shopAdminId,
        action: isActive ? "ACTIVATE_DOCTOR" : "DEACTIVATE_DOCTOR",
        targetType: "STAFF",
        targetId: doctorId,
        details: `${isActive ? "Activated" : "Deactivated"} doctor: ${
          updatedDoctor.name
        }`,
      },
    });

    res.status(200).json({
      message: `Doctor ${isActive ? "activated" : "deactivated"} successfully`,
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res.status(500).json({
      error: "Internal server error while updating doctor status",
    });
  }
};
