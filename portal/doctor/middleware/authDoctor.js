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

    // Check doctor in DB
    const doctor = await prisma.doctor.findUnique({
      where: { id: decoded.doctorId },
    });

    if (!doctor) {
      return res.status(401).json({ msg: "Invalid token - doctor not found" });
    }

    req.user = {
      id: doctor.id,
      doctorId: doctor.id,
      email: doctor.email,
      name: doctor.name,
      role: "doctor",
    };

    next();
  } catch (e) {
    res.status(400).json({ msg: "Token is not valid" });
  }
};

