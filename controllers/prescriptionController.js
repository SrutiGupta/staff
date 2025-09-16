const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, rightEye, leftEye } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required." });
    }
    if (!rightEye || typeof rightEye !== "object") {
      return res
        .status(400)
        .json({ error: "Right eye data must be an object." });
    }
    if (!leftEye || typeof leftEye !== "object") {
      return res
        .status(400)
        .json({ error: "Left eye data must be an object." });
    }

    // ✅ Check if patient exists and belongs to staff's shop
    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patientExists) {
      return res.status(404).json({ error: "Patient not found." });
    }

    // Verify patient belongs to the staff member's shop
    if (patientExists.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({ error: "Access denied. Patient belongs to different shop." });
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
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription." });
  }
};

// ✅ Get a prescription by ID
exports.getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    // Convert id to integer since Prescription.id is Int type
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: { patient: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    // Verify prescription's patient belongs to the staff member's shop
    if (prescription.patient.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({
          error: "Access denied. Prescription belongs to different shop.",
        });
    }

    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription." });
  }
};

// Get all prescriptions with optional filtering
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      patient: {
        shopId: req.user.shopId, // Filter by user's shop
      },
    };

    if (patientId) {
      // Also verify the specific patient belongs to the shop
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(patientId) },
      });

      if (!patient || patient.shopId !== req.user.shopId) {
        return res
          .status(403)
          .json({ error: "Access denied. Patient belongs to different shop." });
      }

      where.patientId = parseInt(patientId);
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take,
        include: { patient: true },
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

// Generate PDF for prescription's invoice
exports.generatePrescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    // Find the invoice that uses this prescription
    const invoice = await prisma.invoice.findFirst({
      where: { prescriptionId },
      include: {
        patient: true,
        customer: true,
        staff: true,
        items: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error:
          "No invoice found for this prescription ID. Please create an invoice that uses prescriptionId: " +
          prescriptionId +
          " first.",
      });
    }

    // Verify invoice belongs to the same shop as the staff member
    if (invoice.staff.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({
          error: "Access denied. Prescription belongs to different shop.",
        });
    }

    // Use the existing invoice PDF generation logic
    const invoiceController = require("./invoiceController");

    // Temporarily set the invoice ID in params and call the existing function
    req.params.id = invoice.id;
    return await invoiceController.generateInvoicePdf(req, res);
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    res.status(500).json({ error: "Failed to generate prescription PDF" });
  }
};

// Generate thermal print for prescription's invoice
exports.generatePrescriptionThermal = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    // Find the invoice that uses this prescription
    const invoice = await prisma.invoice.findFirst({
      where: { prescriptionId },
      include: {
        patient: true,
        customer: true,
        staff: true,
        items: {
          include: {
            product: {
              include: {
                company: true,
              },
            },
          },
        },
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error:
          "No invoice found for this prescription ID. Please create an invoice that uses prescriptionId: " +
          prescriptionId +
          " first.",
      });
    }

    // Verify invoice belongs to the same shop as the staff member
    if (invoice.staff.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({
          error: "Access denied. Prescription belongs to different shop.",
        });
    }

    // Use the existing invoice thermal generation logic
    const invoiceController = require("./invoiceController");

    // Temporarily set the invoice ID in params and call the existing function
    req.params.id = invoice.id;
    return await invoiceController.generateInvoiceThermal(req, res);
  } catch (error) {
    console.error("Error generating prescription thermal:", error);
    res
      .status(500)
      .json({ error: "Failed to generate prescription thermal print" });
  }
};
