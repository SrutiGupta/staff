const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, rightEye, leftEye } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }
    if (!rightEye || typeof rightEye !== 'object') {
      return res.status(400).json({ error: 'Right eye data must be an object.' });
    }
    if (!leftEye || typeof leftEye !== 'object') {
      return res.status(400).json({ error: 'Left eye data must be an object.' });
    }

    // ✅ Check if patient exists before creating prescription
    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patientExists) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // ✅ Create prescription
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId,
        rightEye, // Prisma will accept JSON object if the column is JSON
        leftEye,
      },
    });

    res.status(201).json(newPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription.' });
  }
};

// ✅ Get a prescription by ID
exports.getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    // Do NOT use parseInt if your ID is a string (CUID or UUID)
    const prescription = await prisma.prescription.findUnique({
      where: { id }, // Keep as string
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
