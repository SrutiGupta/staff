const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createPatient = async (req, res) => {
  const { name, age, gender, medicalHistory } = req.body;

  try {
    const patient = await prisma.patient.create({
      data: {
        name,
        age,
        gender,
        medicalHistory,
      },
    });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: "Patient creation failed" });
  }
};

// Get all patients with optional filtering
exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    res.status(200).json({
      patients,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

// Get a single patient by ID
exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        prescriptions: true,
        invoices: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
};
