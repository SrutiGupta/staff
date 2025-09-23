// doctor/controllers/loginController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const doctor = await prisma.staff.findUnique({
      where: { email },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }
    if (doctor.role !== "OPTOMETRIST") {
      return res
        .status(403)
        .json({ error: "Access denied. Not a doctor account." });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // 🛡️ ATTENDANCE FIX: Create attendance record for doctor login
    await prisma.attendance.create({
      data: {
        staffId: doctor.id,
        loginTime: new Date(),
      },
    });

    const token = jwt.sign(
      {
        id: doctor.id,
        shopId: doctor.shopId,
        role: doctor.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role,
        shopId: doctor.shopId,
      },
    });
  } catch (error) {
    console.error("Error logging in doctor:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

// 🛡️ ATTENDANCE FIX: Doctor logout with attendance tracking
exports.logoutDoctor = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Doctor not authenticated" });
    }

    const doctorId = req.user.id;

    // Find the latest attendance record without logout time
    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId: doctorId,
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

    res.status(200).json({
      message: "Doctor logout successful",
      doctor: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Error logging out doctor:", error);
    res.status(500).json({ error: "Logout failed. Please try again." });
  }
};

// 🛡️ ATTENDANCE FIX: Doctor logout with attendance tracking
exports.logoutDoctor = async (req, res) => {
  try {
    const staffId = req.user.id;

    // Find the most recent attendance record without logout time
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

    res.status(200).json({
      message: "Doctor logout successful",
      attendanceUpdated: !!attendance,
    });
  } catch (error) {
    console.error("Error logging out doctor:", error);
    res.status(500).json({ error: "Logout failed. Please try again." });
  }
};
