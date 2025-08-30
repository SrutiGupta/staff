// Simple logout handler (stateless JWT, so just respond OK)
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return res.status(400).json({ error: 'Staff member already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ staffId: staff.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, staffId: staff.id, name: staff.name });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const staff = await prisma.staff.findUnique({
      where: { email },
    });

    if (!staff) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, staff.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ staffId: staff.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, staffId: staff.id, name: staff.name });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};
