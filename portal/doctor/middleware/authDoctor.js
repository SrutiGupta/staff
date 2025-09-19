const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ msg: 'Token format is not valid, expected "Bearer <token>"' });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🛡️ SECURITY FIX: Check staff table with OPTOMETRIST role
    const doctor = await prisma.staff.findUnique({
      where: { id: decoded.id },
      include: { shop: true },
    });

    if (!doctor) {
      return res.status(401).json({ msg: "Invalid token - doctor not found" });
    }

    // 🛡️ SECURITY FIX: Verify OPTOMETRIST role
    if (doctor.role !== "OPTOMETRIST") {
      return res
        .status(403)
        .json({ msg: "Access denied. Not a doctor account." });
    }

    // 🛡️ SECURITY FIX: Include shop context for isolation
    req.user = {
      id: doctor.id,
      staffId: doctor.id,
      email: doctor.email,
      name: doctor.name,
      role: doctor.role,
      shopId: doctor.shopId,
      shop: doctor.shop,
    };

    next();
  } catch (e) {
    res.status(400).json({ msg: "Token is not valid" });
  }
};
