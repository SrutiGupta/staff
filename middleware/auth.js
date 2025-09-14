const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function (req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");

  // Check if not token
  if (!authHeader) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Check if the header is in the 'Bearer <token>' format
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ msg: 'Token format is not valid, expected "Bearer <token>"' });
  }

  const token = tokenParts[1];

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full staff information from database
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId },
      include: { shop: true },
    });

    if (!staff) {
      return res.status(401).json({ msg: "Invalid token - staff not found" });
    }

    // Set req.user with complete staff information
    req.user = {
      id: staff.id,
      staffId: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      shopId: staff.shopId,
      shop: staff.shop,
    };

    console.log(
      "Debug - Auth middleware - staff found:",
      staff.id,
      staff.shopId
    );
    console.log("Debug - Auth middleware - req.user set:", req.user);

    next();
  } catch (e) {
    res.status(400).json({ msg: "Token is not valid" });
  }
};
