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

  // Require shopId to be provided explicitly
  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }

  try {
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return res.status(400).json({ error: "Staff member already exists" });
    }

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(shopId) },
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
        shopId: parseInt(shopId),
      },
    });

    const token = jwt.sign({ staffId: staff.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      token,
      staffId: staff.id,
      name: staff.name,
      shopId: staff.shopId,
    });
  } catch (error) {
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
      expiresIn: "1h",
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
