const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new prescription
exports.createPrescription = async (req, res) => {
  const { patientId, rightEye, leftEye } = req.body;

  if (!patientId || !rightEye || !leftEye) {
    return res.status(400).json({ error: 'Patient ID, right eye, and left eye data are required.' });
  }

  try {
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId,
        rightEye,
        leftEye,
      },
    });
    res.status(201).json(newPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription.' });
  }
};

// Get a prescription by ID
exports.getPrescription = async (req, res) => {
  const { id } = req.params;

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: { patient: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    res.status(200).json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription.' });
  }
};
