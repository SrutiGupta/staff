const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.attendance.create({
      data: {
        staffId: staff.id,
      },
    });

    const token = jwt.sign({ staffId: staff.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.logout = async (req, res) => {
  const { staffId } = req.body;

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId: parseInt(staffId),
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
    const attendance = await prisma.attendance.findMany({
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
