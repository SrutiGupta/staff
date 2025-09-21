const attendanceController = require("./attendanceController");

// call attendance controller to record logout time
exports.logout = (req, res) => {
  // Now that auth middleware is applied, req.user should be available
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  return attendanceController.logout(req, res);
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password, name, role = "SALES_STAFF", shopId } = req.body;

  // This endpoint should only be accessible by shop admins
  // Check if the requester is authenticated and is a shop admin
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if the authenticated user is a shop admin
  try {
    const shopAdmin = await prisma.shopAdmin.findUnique({
      where: { id: req.user.shopAdminId },
      include: { shop: true },
    });

    if (!shopAdmin) {
      return res
        .status(403)
        .json({ error: "Access denied. Only shop admins can register staff." });
    }

    // If shopId is provided, verify it matches the admin's shop
    // If not provided, use the admin's shop
    const targetShopId = shopId ? parseInt(shopId) : shopAdmin.shopId;

    if (targetShopId !== shopAdmin.shopId) {
      return res
        .status(403)
        .json({ error: "You can only register staff for your own shop" });
    }

    // Validate required fields
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return res
        .status(400)
        .json({ error: "Staff member with this email already exists" });
    }

    // Verify shop exists (should exist since admin is valid)
    const shop = await prisma.shop.findUnique({
      where: { id: targetShopId },
    });

    if (!shop) {
      return res.status(400).json({ error: "Invalid shop ID" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        shopId: targetShopId,
      },
    });

    // Don't create a token for the new staff member
    // Return staff details instead
    res.status(201).json({
      message: "Staff member registered successfully",
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        shopId: staff.shopId,
        shopName: shop.name,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { shop: true },
    });

    if (!staff) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, staff.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create attendance record for login
    await prisma.attendance.create({
      data: {
        staffId: staff.id,
      },
    });

    const token = jwt.sign({ staffId: staff.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      staffId: staff.id,
      name: staff.name,
      shopId: staff.shopId,
      shopName: staff.shop.name,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
