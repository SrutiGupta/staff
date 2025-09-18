// doctor/controllers/loginController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const doctor = await prisma.staff.findUnique({
      where: { email },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }
    if (doctor.role !== "OPTOMETRIST") {
      return res.status(403).json({ error: "Access denied. Not a doctor account." });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

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
