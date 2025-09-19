const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new retailer
exports.register = async (req, res) => {
  const {
    email,
    password,
    name,
    companyName,
    phone,
    address,
    gstNo,
    licenseNo,
  } = req.body;

  try {
    // Check if retailer already exists
    const existingRetailer = await prisma.retailer.findUnique({
      where: { email },
    });

    if (existingRetailer) {
      return res
        .status(400)
        .json({ error: "Retailer with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create retailer
    const retailer = await prisma.retailer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        phone,
        address,
        gstNo,
        licenseNo,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        address: true,
        gstNo: true,
        licenseNo: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        retailerId: retailer.id,
        email: retailer.email,
        type: "retailer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Retailer registered successfully",
      retailer,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login retailer
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find retailer by email
    const retailer = await prisma.retailer.findUnique({
      where: { email },
    });

    if (!retailer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!retailer.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, retailer.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        retailerId: retailer.id,
        email: retailer.email,
        type: "retailer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      retailer: {
        id: retailer.id,
        email: retailer.email,
        name: retailer.name,
        companyName: retailer.companyName,
        phone: retailer.phone,
        address: retailer.address,
        gstNo: retailer.gstNo,
        licenseNo: retailer.licenseNo,
        isActive: retailer.isActive,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get retailer profile
exports.getProfile = async (req, res) => {
  try {
    const retailer = await prisma.retailer.findUnique({
      where: { id: req.retailer.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        address: true,
        gstNo: true,
        licenseNo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!retailer) {
      return res.status(404).json({ error: "Retailer not found" });
    }

    res.json(retailer);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update retailer profile
exports.updateProfile = async (req, res) => {
  const { name, companyName, phone, address, gstNo, licenseNo } = req.body;

  try {
    const retailer = await prisma.retailer.update({
      where: { id: req.retailer.id },
      data: {
        name,
        companyName,
        phone,
        address,
        gstNo,
        licenseNo,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        address: true,
        gstNo: true,
        licenseNo: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      retailer,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Get current retailer with password
    const retailer = await prisma.retailer.findUnique({
      where: { id: req.retailer.id },
    });

    if (!retailer) {
      return res.status(404).json({ error: "Retailer not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      retailer.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.retailer.update({
      where: { id: req.retailer.id },
      data: { password: hashedNewPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const retailer = await prisma.retailer.findUnique({
      where: { id: req.retailer.id },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!retailer || !retailer.isActive) {
      return res
        .status(401)
        .json({ error: "Invalid token or account deactivated" });
    }

    // Generate new JWT token
    const token = jwt.sign(
      {
        retailerId: retailer.id,
        email: retailer.email,
        type: "retailer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
