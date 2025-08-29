
const { PrismaClient } = require('@prisma/client');
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
    res.status(500).json({ error: 'Patient creation failed' });
  }
};
