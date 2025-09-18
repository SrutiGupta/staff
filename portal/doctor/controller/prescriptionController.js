const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Helper to check shop ownership (works for staff & doctor)
async function verifyPatientAccess(patientId, req) {
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(patientId) },
  });

  if (!patient) return { error: "Patient not found", status: 404 };

  // If user is staff, check shop
  if (req.user.role === "staff" && patient.shopId !== req.user.shopId) {
    return { error: "Access denied. Patient belongs to different shop.", status: 403 };
  }

  // If user is doctor, you might add extra restrictions (like hospitalId, clinicId)
  // For now, doctors can access all patients
  return { patient };
}

// ✅ Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, rightEye, leftEye } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required." });
    }
    if (!rightEye || typeof rightEye !== "object") {
      return res.status(400).json({ error: "Right eye data must be an object." });
    }
    if (!leftEye || typeof leftEye !== "object") {
      return res.status(400).json({ error: "Left eye data must be an object." });
    }

    // Verify patient access
    const access = await verifyPatientAccess(patientId, req);
    if (access.error) return res.status(access.status).json({ error: access.error });

    // ✅ Create prescription (link doctorId or staffId if needed)
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId: parseInt(patientId),
        rightEye,
        leftEye,
        doctorId: req.user.role === "doctor" ? req.user.doctorId : null,
        staffId: req.user.role === "staff" ? req.user.staffId : null,
      },
    });

    res.status(201).json(newPrescription);
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription." });
  }
};

// ✅ Get a prescription by ID
exports.getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: { patient: true, doctor: true, staff: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    // Verify access
    const access = await verifyPatientAccess(prescription.patientId, req);
    if (access.error) return res.status(access.status).json({ error: access.error });

    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription." });
  }
};

// ✅ Get all prescriptions (with pagination & optional filtering)
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = {};

    if (req.user.role === "staff") {
      // staff → only prescriptions from their shop
      where = { patient: { shopId: req.user.shopId } };
    }

    if (patientId) {
      const access = await verifyPatientAccess(patientId, req);
      if (access.error) return res.status(access.status).json({ error: access.error });

      where.patientId = parseInt(patientId);
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take,
        include: { patient: true, doctor: true, staff: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prescription.count({ where }),
    ]);

    res.status(200).json({
      prescriptions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
};

// ✅ Generate PDF for prescription's invoice
exports.generatePrescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    const invoice = await prisma.invoice.findFirst({
      where: { prescriptionId },
      include: {
        patient: true,
        customer: true,
        staff: true,
        doctor: true,
        items: { include: { product: { include: { company: true } } } },
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: `No invoice found for prescriptionId ${prescriptionId}. Please create an invoice first.`,
      });
    }

    if (req.user.role === "staff" && invoice.staff.shopId !== req.user.shopId) {
      return res.status(403).json({ error: "Access denied. Different shop." });
    }

    const invoiceController = require("./invoiceController");
    req.params.id = invoice.id;
    return await invoiceController.generateInvoicePdf(req, res);
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    res.status(500).json({ error: "Failed to generate prescription PDF" });
  }
};

// ✅ Generate thermal print for prescription's invoice
exports.generatePrescriptionThermal = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    const invoice = await prisma.invoice.findFirst({
      where: { prescriptionId },
      include: {
        patient: true,
        customer: true,
        staff: true,
        doctor: true,
        items: { include: { product: { include: { company: true } } } },
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: `No invoice found for prescriptionId ${prescriptionId}. Please create an invoice first.`,
      });
    }

    if (req.user.role === "staff" && invoice.staff.shopId !== req.user.shopId) {
      return res.status(403).json({ error: "Access denied. Different shop." });
    }

    const invoiceController = require("./invoiceController");
    req.params.id = invoice.id;
    return await invoiceController.generateInvoiceThermal(req, res);
  } catch (error) {
    console.error("Error generating prescription thermal:", error);
    res.status(500).json({ error: "Failed to generate prescription thermal print" });
  }
};
