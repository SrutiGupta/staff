const prisma = require("../lib/prisma");

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
      return res.status(403).json({
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

// Generate PDF for prescription (Production-Ready - No GST, includes Progressive/Bifocal, PD & Add Power)
exports.generatePrescriptionPdf = async (req, res) => {
  const PDFDocument = require("pdfkit");
  const bwipjs = require("bwip-js");

  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);

    // Fetch prescription with patient details
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    // Verify prescription's patient belongs to the staff member's shop
    if (prescription.patient.shopId !== req.user.shopId) {
      return res.status(403).json({
        error: "Access denied. Prescription belongs to different shop.",
      });
    }

    const patientInfo = prescription.patient;

    // Create PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-RX${prescriptionId}.pdf`
    );
    doc.pipe(res);

    // --- HEADER ---
    doc.save();
    doc.rect(40, 30, 520, 100).fillAndStroke("#f2f2f2", "#000");
    doc.restore();

    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("CLEAR EYES OPTICAL", 60, 50, { characterSpacing: 1.5 });

    // Barcode with prescription ID
    try {
      const barcodePng = await bwipjs.toBuffer({
        bcid: "code128",
        text: `RX${prescriptionId}`,
        scale: 2,
        height: 15,
        includetext: false,
      });
      doc.image(barcodePng, 400, 45, { width: 140, height: 45 });
    } catch (barcodeError) {
      console.error("Barcode generation failed:", barcodeError);
    }

    doc.fontSize(10).fillColor("#000").text(`RX${prescriptionId}`, 430, 95);

    // Address + Contact
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text("68 Jessore Road, Diamond Plaza", 0, 110, { align: "center" })
      .text("Kolkata | +91-96765 43210", { align: "center" })
      .text("Follow us on Instagram @cleareyes_optical", { align: "center" });

    // --- PRESCRIPTION INFO ---
    let infoY = 150;
    doc.font("Helvetica-Bold").fontSize(11).text(`Prescription No:`, 40, infoY);
    doc.font("Helvetica").text(prescriptionId.toString(), 140, infoY);

    doc.font("Helvetica-Bold").text(`Date:`, 400, infoY);
    doc
      .font("Helvetica")
      .text(prescription.createdAt.toLocaleDateString(), 450, infoY);

    // Patient Info
    doc.moveDown(1);
    doc.font("Helvetica-Bold").text(`Patient Name:`, 40, doc.y);
    doc.font("Helvetica").text(patientInfo.name, 150, doc.y - 12);

    if (patientInfo.phone) {
      doc.font("Helvetica-Bold").text(`Mobile:`, 40, doc.y + 10);
      doc.font("Helvetica").text(patientInfo.phone, 150, doc.y - 12);
    }

    // Prescription Type
    const prescriptionType = prescription.rightEye?.type || "Progressive";
    doc.font("Helvetica-Bold").text(`Type:`, 40, doc.y + 15);
    doc.font("Helvetica").text(prescriptionType, 150, doc.y - 12);

    // --- EYE POWER TABLE (Production-Ready Format) ---
    doc
      .moveDown(2)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Prescription Details");

    let startY = doc.y + 10;
    const colX = [40, 80, 150, 220, 290, 360, 430, 480];
    const colLabels = [
      "Eye",
      "Sph",
      "Cyl",
      "Axis",
      "Add",
      "PD",
      "BC",
      "Remarks",
    ];
    const rowHeight = 22;

    // Header row
    doc.rect(40, startY, 460, rowHeight).stroke();
    colLabels.forEach((label, i) => {
      if (i < colX.length - 1) {
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(label, colX[i] + 3, startY + 6);
        doc
          .moveTo(colX[i + 1], startY)
          .lineTo(colX[i + 1], startY + rowHeight)
          .stroke();
      }
    });

    // RE (Right Eye) row
    let y = startY + rowHeight;
    doc.rect(40, y, 460, rowHeight).stroke();
    const reData = [
      "RE",
      prescription.rightEye?.sph || "-",
      prescription.rightEye?.cyl || "-",
      prescription.rightEye?.axis || "-",
      prescription.rightEye?.add || "-",
      prescription.rightEye?.pd || "-",
      prescription.rightEye?.bc || "-",
      prescription.rightEye?.remarks || "",
    ];
    reData.forEach((val, i) => {
      if (i < colX.length - 1) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(val.toString(), colX[i] + 3, y + 6);
        doc
          .moveTo(colX[i + 1], y)
          .lineTo(colX[i + 1], y + rowHeight)
          .stroke();
      }
    });

    // LE (Left Eye) row
    y = startY + rowHeight * 2;
    doc.rect(40, y, 460, rowHeight).stroke();
    const leData = [
      "LE",
      prescription.leftEye?.sph || "-",
      prescription.leftEye?.cyl || "-",
      prescription.leftEye?.axis || "-",
      prescription.leftEye?.add || "-",
      prescription.leftEye?.pd || "-",
      prescription.leftEye?.bc || "-",
      prescription.leftEye?.remarks || "",
    ];
    leData.forEach((val, i) => {
      if (i < colX.length - 1) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(val.toString(), colX[i] + 3, y + 6);
        doc
          .moveTo(colX[i + 1], y)
          .lineTo(colX[i + 1], y + rowHeight)
          .stroke();
      }
    });

    // Notes section
    doc.moveDown(3);
    doc.font("Helvetica-Bold").fontSize(10).text("Doctor's Notes:");
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(prescription.notes || "No additional notes", {
        width: 460,
        height: 40,
      });

    // --- FOOTER ---
    doc.moveDown(2);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Thank You for Shopping with Us!", { align: "center" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .text("Visit again. Follow us on Instagram @cleareyes_optical", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("Error generating prescription PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate prescription PDF" });
    } else {
      res.end();
    }
  }
};

// Generate thermal print for prescription (Production-Ready - No GST, includes Progressive/Bifocal, PD & Add Power)
exports.generatePrescriptionThermal = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id);
    const printerWidth = parseInt(process.env.THERMAL_PRINTER_WIDTH, 10) || 48;

    // Fetch prescription with patient details
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    // Verify prescription's patient belongs to the staff member's shop
    if (prescription.patient.shopId !== req.user.shopId) {
      return res.status(403).json({
        error: "Access denied. Prescription belongs to different shop.",
      });
    }

    const patientInfo = prescription.patient;
    const prescriptionType = prescription.rightEye?.type || "Progressive";

    const center = (text) =>
      text
        .padStart(Math.floor((printerWidth + text.length) / 2), " ")
        .padEnd(printerWidth, " ");
    const line = (left, right) =>
      `${left.padEnd(Math.floor(printerWidth / 2))}${right.padStart(
        Math.ceil(printerWidth / 2)
      )}`;
    const separator = "-".repeat(printerWidth);

    let receipt = [];

    // Header
    receipt.push(center("PRESCRIPTION RECEIPT"));
    receipt.push(center("Clear Eyes Optical"));
    receipt.push(center("68 Jessore Road, Diamond Plaza"));
    receipt.push(center("Kolkata +91-96765 43210"));
    receipt.push(separator);

    // Prescription Details
    receipt.push(
      line(
        `Rx No: RX${prescriptionId}`,
        `Date: ${prescription.createdAt.toLocaleDateString()}`
      )
    );
    receipt.push(line(`Type: ${prescriptionType}`, ""));
    receipt.push(separator);

    // Patient Information
    receipt.push("Bill To & Delivery Address:");
    receipt.push(patientInfo.name.substring(0, printerWidth));
    if (patientInfo.address)
      receipt.push(patientInfo.address.substring(0, printerWidth));
    if (patientInfo.phone)
      receipt.push(
        `Phone: ${patientInfo.phone.substring(0, printerWidth - 7)}`
      );
    receipt.push(separator);

    // Prescription Details Header
    receipt.push("PRESCRIPTION DETAILS");
    receipt.push("-".repeat(printerWidth));

    // Column headers - adjusted for thermal width
    const headerLine = "Eye  SPH    CYL    AXS   ADD   PD    BC";
    receipt.push(headerLine.substring(0, printerWidth));
    receipt.push("-".repeat(printerWidth));

    // Right Eye data
    if (prescription.rightEye) {
      const { sph, cyl, axis, add, pd, bc } = prescription.rightEye;
      const reLine = `RE   ${(sph || "-").padEnd(6)} ${(cyl || "-").padEnd(
        6
      )} ${(axis || "-").padEnd(5)} ${(add || "-").padEnd(5)} ${(
        pd || "-"
      ).padEnd(5)} ${bc || "-"}`;
      receipt.push(reLine.substring(0, printerWidth));
    }

    // Left Eye data
    if (prescription.leftEye) {
      const { sph, cyl, axis, add, pd, bc } = prescription.leftEye;
      const leLine = `LE   ${(sph || "-").padEnd(6)} ${(cyl || "-").padEnd(
        6
      )} ${(axis || "-").padEnd(5)} ${(add || "-").padEnd(5)} ${(
        pd || "-"
      ).padEnd(5)} ${bc || "-"}`;
      receipt.push(leLine.substring(0, printerWidth));
    }

    receipt.push(separator);

    // Doctor's Notes
    if (prescription.notes) {
      receipt.push("Doctor's Notes:");
      const notes = prescription.notes.substring(0, printerWidth - 1);
      receipt.push(notes);
    }

    receipt.push(separator);

    // Footer
    receipt.push(center("Thank You!"));
    receipt.push(center("Visit Again"));
    receipt.push(center("Follow @cleareyes_optical"));
    receipt.push(separator);
    receipt.push(center(new Date().toLocaleString()));
    receipt.push("");

    const receiptText = receipt.join("\n");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=RX${prescriptionId}-thermal.txt`
    );
    res.status(200).send(receiptText);
  } catch (error) {
    console.error("Error generating prescription thermal:", error);
    res
      .status(500)
      .json({ error: "Failed to generate prescription thermal print" });
  }
};
