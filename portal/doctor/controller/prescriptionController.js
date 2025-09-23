const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🛡️ SECURITY FIX: Helper to check shop ownership for doctors
async function verifyPatientAccess(patientId, req) {
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(patientId) },
  });

  if (!patient) return { error: "Patient not found", status: 404 };

  // 🛡️ SECURITY FIX: Both staff and doctors must only access patients from their shop
  if (patient.shopId !== req.user.shopId) {
    return {
      error: "Access denied. Patient belongs to different shop.",
      status: 403,
    };
  }

  return { patient };
}

// 🛡️ SECURITY FIX: Get all patients for the doctor's shop only
exports.getPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        shopId: req.user.shopId, // 🛡️ Only patients from doctor's shop
        isActive: true, // Only active patients
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        phone: true,
        address: true,
        medicalHistory: true,
        lastVisit: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

// ✅ Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, rightEye, leftEye } = req.body;

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

    // Verify patient access
    const access = await verifyPatientAccess(patientId, req);
    if (access.error)
      return res.status(access.status).json({ error: access.error });

    // ✅ Create prescription (without doctor/staff relation for now - schema limitation)
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId: parseInt(patientId),
        rightEye,
        leftEye,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: newPrescription,
      doctorInfo: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
        shopId: req.user.shopId,
      },
    });
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
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            phone: true,
            address: true,
            medicalHistory: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    // Verify access
    const access = await verifyPatientAccess(prescription.patientId, req);
    if (access.error)
      return res.status(access.status).json({ error: access.error });

    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription." });
  }
};

// 🛡️ SECURITY FIX: Get all prescriptions (with proper shop isolation)
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = {};

    // 🛡️ SECURITY FIX: Both staff and doctors must only access prescriptions from their shop
    where = { patient: { shopId: req.user.shopId } };

    if (patientId) {
      const access = await verifyPatientAccess(patientId, req);
      if (access.error)
        return res.status(access.status).json({ error: access.error });

      where.patientId = parseInt(patientId);
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              phone: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
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

// 🛡️ SECURITY FIX: Generate PDF for prescription directly (no invoice needed)
exports.generatePrescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          include: {
            shop: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        error: `Prescription ${prescriptionId} not found.`,
      });
    }

    // 🛡️ SECURITY FIX: Check shop access for doctors
    if (prescription.patient.shopId !== req.user.shopId) {
      return res.status(403).json({ error: "Access denied. Different shop." });
    }

    // Generate prescription PDF using PDFKit
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Prescription-${prescriptionId}.pdf"`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("PRESCRIPTION", { align: "center" });
    doc.moveDown();

    // Shop Information
    doc.fontSize(14).text(prescription.patient.shop.name, { align: "center" });
    if (prescription.patient.shop.address) {
      doc
        .fontSize(10)
        .text(prescription.patient.shop.address, { align: "center" });
    }
    doc.moveDown();

    // Prescription Details
    doc.fontSize(12).text(`Prescription ID: ${prescription.id}`);
    doc.text(`Date: ${prescription.createdAt.toLocaleDateString()}`);
    doc.text(`Doctor: ${req.user.name} (${req.user.role})`);
    doc.moveDown();

    // Patient Information
    doc.fontSize(14).text("Patient Information:", { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${prescription.patient.name}`);
    doc.text(`Age: ${prescription.patient.age} years`);
    doc.text(`Gender: ${prescription.patient.gender}`);
    if (prescription.patient.phone) {
      doc.text(`Phone: ${prescription.patient.phone}`);
    }
    doc.moveDown();

    // Prescription Details
    doc.fontSize(14).text("Prescription Details:", { underline: true });
    doc.fontSize(12);

    // Right Eye
    doc.text("Right Eye (OD):");
    if (prescription.rightEye.sphere !== undefined)
      doc.text(`  Sphere: ${prescription.rightEye.sphere}`);
    if (prescription.rightEye.cylinder !== undefined)
      doc.text(`  Cylinder: ${prescription.rightEye.cylinder}`);
    if (prescription.rightEye.axis !== undefined)
      doc.text(`  Axis: ${prescription.rightEye.axis}°`);
    if (prescription.rightEye.add !== undefined)
      doc.text(`  Add: ${prescription.rightEye.add}`);

    doc.moveDown(0.5);

    // Left Eye
    doc.text("Left Eye (OS):");
    if (prescription.leftEye.sphere !== undefined)
      doc.text(`  Sphere: ${prescription.leftEye.sphere}`);
    if (prescription.leftEye.cylinder !== undefined)
      doc.text(`  Cylinder: ${prescription.leftEye.cylinder}`);
    if (prescription.leftEye.axis !== undefined)
      doc.text(`  Axis: ${prescription.leftEye.axis}°`);
    if (prescription.leftEye.add !== undefined)
      doc.text(`  Add: ${prescription.leftEye.add}`);

    doc.moveDown();

    // Additional Notes
    if (prescription.patient.medicalHistory) {
      doc.fontSize(12).text("Medical History:", { underline: true });
      doc.text(prescription.patient.medicalHistory);
      doc.moveDown();
    }

    // Footer
    doc
      .fontSize(10)
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    res.status(500).json({ error: "Failed to generate prescription PDF" });
  }
};

// 🛡️ SECURITY FIX: Generate thermal print for prescription directly (no invoice needed)
exports.generatePrescriptionThermal = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);
    const printerWidth = parseInt(process.env.THERMAL_PRINTER_WIDTH, 10) || 48;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          include: {
            shop: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        error: `Prescription ${prescriptionId} not found.`,
      });
    }

    // 🛡️ SECURITY FIX: Check shop access for doctors
    if (prescription.patient.shopId !== req.user.shopId) {
      return res.status(403).json({ error: "Access denied. Different shop." });
    }

    // Helper functions for formatting
    const center = (text) =>
      text
        .padStart(Math.floor((printerWidth + text.length) / 2), " ")
        .padEnd(printerWidth, " ");
    const line = (left, right) =>
      `${left.padEnd(printerWidth / 2)}${right.padStart(printerWidth / 2)}`;
    const separator = "-".repeat(printerWidth);

    let receipt = [];

    // Header
    receipt.push(center("PRESCRIPTION"));
    receipt.push(center(prescription.patient.shop.name));
    if (prescription.patient.shop.address) {
      receipt.push(center(prescription.patient.shop.address));
    }
    receipt.push(separator);

    // Prescription Info
    receipt.push(line("Prescription ID:", prescriptionId.toString()));
    receipt.push(line("Date:", prescription.createdAt.toLocaleDateString()));
    receipt.push(line("Doctor:", req.user.name));
    receipt.push(separator);

    // Patient Info
    receipt.push(center("PATIENT INFORMATION"));
    receipt.push(line("Name:", prescription.patient.name));
    receipt.push(line("Age:", `${prescription.patient.age} years`));
    receipt.push(line("Gender:", prescription.patient.gender));
    if (prescription.patient.phone) {
      receipt.push(line("Phone:", prescription.patient.phone));
    }
    receipt.push(separator);

    // Prescription Details
    receipt.push(center("PRESCRIPTION DETAILS"));
    receipt.push("");

    // Right Eye
    receipt.push("Right Eye (OD):");
    if (prescription.rightEye.sphere !== undefined) {
      receipt.push(`  Sphere: ${prescription.rightEye.sphere}`);
    }
    if (prescription.rightEye.cylinder !== undefined) {
      receipt.push(`  Cylinder: ${prescription.rightEye.cylinder}`);
    }
    if (prescription.rightEye.axis !== undefined) {
      receipt.push(`  Axis: ${prescription.rightEye.axis}°`);
    }
    if (prescription.rightEye.add !== undefined) {
      receipt.push(`  Add: ${prescription.rightEye.add}`);
    }

    receipt.push("");

    // Left Eye
    receipt.push("Left Eye (OS):");
    if (prescription.leftEye.sphere !== undefined) {
      receipt.push(`  Sphere: ${prescription.leftEye.sphere}`);
    }
    if (prescription.leftEye.cylinder !== undefined) {
      receipt.push(`  Cylinder: ${prescription.leftEye.cylinder}`);
    }
    if (prescription.leftEye.axis !== undefined) {
      receipt.push(`  Axis: ${prescription.leftEye.axis}°`);
    }
    if (prescription.leftEye.add !== undefined) {
      receipt.push(`  Add: ${prescription.leftEye.add}`);
    }

    receipt.push(separator);

    // Medical History
    if (prescription.patient.medicalHistory) {
      receipt.push(center("MEDICAL HISTORY"));
      receipt.push(prescription.patient.medicalHistory);
      receipt.push(separator);
    }

    // Footer
    receipt.push(center(`Generated: ${new Date().toLocaleString()}`));
    receipt.push(separator);

    // Send as plain text for thermal printer
    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Prescription-${prescriptionId}-Thermal.txt"`
    );
    res.send(receipt.join("\n"));
  } catch (error) {
    console.error("Error generating prescription thermal:", error);
    res
      .status(500)
      .json({ error: "Failed to generate prescription thermal print" });
  }
};
