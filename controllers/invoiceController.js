const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
require("dotenv").config();

const prisma = new PrismaClient();

// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { patientId, customerId, prescriptionId, items } = req.body;
  const staffId = req.user.staffId; // staffId is available in req.user from JWT token

  // Validate that either patientId or customerId is provided, but not both
  if ((!patientId && !customerId) || (patientId && customerId)) {
    return res.status(400).json({
      error: "Either Patient ID or Customer ID is required, but not both.",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required." });
  }

  try {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product with ID ${item.productId} not found.` });
      }

      const inventory = await prisma.shopInventory.findFirst({
        where: {
          productId: item.productId,
          shopId: req.user.shopId, // Use shop-specific inventory
        },
      });
      if (!inventory || inventory.quantity < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for ${product.name}.` });
      }

      const itemSubtotal = product.basePrice * item.quantity;
      const itemDiscount = item.discount || 0;
      const itemCgst = item.cgst || 0;
      const itemSgst = item.sgst || 0;
      // Note: IGST is handled at invoice level, not item level based on schema

      const totalPrice = itemSubtotal - itemDiscount + itemCgst + itemSgst;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalCgst += itemCgst;
      totalSgst += itemSgst;

      invoiceItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.basePrice,
        discount: itemDiscount,
        cgst: itemCgst,
        sgst: itemSgst,
        totalPrice: totalPrice,
      });
    }

    // Calculate total IGST at invoice level (can be based on business logic)
    // For now, setting to 0 but you can add logic here
    const totalIgst = req.body.totalIgst || 0;

    const totalAmount =
      subtotal - totalDiscount + totalIgst + totalCgst + totalSgst;

    // Create the invoice and its items in a transaction
    const newInvoice = await prisma.$transaction(async (prisma) => {
      const invoiceData = {
        staffId,
        prescriptionId: prescriptionId || null,
        subtotal,
        totalDiscount,
        totalIgst,
        totalCgst,
        totalSgst,
        totalAmount,
        items: {
          create: invoiceItems,
        },
      };

      // Add either patientId or customerId
      if (patientId) {
        invoiceData.patientId = patientId;
      } else {
        invoiceData.customerId = customerId;
      }

      const invoice = await prisma.invoice.create({
        data: invoiceData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          patient: true,
          customer: true,
        },
      });

      // Update shop inventory for each item
      for (const item of items) {
        await prisma.shopInventory.updateMany({
          where: {
            productId: item.productId,
            shopId: req.user.shopId, // Update shop-specific inventory
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
      return invoice;
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice." });
  }
};

// Get a single invoice by ID
exports.getInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
        transactions: true,
        prescription: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice." });
  }
};

function generateTableRow(doc, y, ...cols) {
  let x = 40;
  const widths = [150, 70, 70, 50, 50, 50, 40, 70];
  cols.forEach((text, i) => {
    doc.text(text, x, y, { width: widths[i], align: "left" });
    x += widths[i];
  });
}

// Generate and stream an invoice PDF
exports.generateInvoicePdf = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch invoice data (same as your original code)
    const invoiceData = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        customer: true,
        staff: true,
        items: {
          include: {
            product: {
              include: { company: true },
            },
          },
        },
        prescription: true,
      },
    });

    if (!invoiceData) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // --- Map Data ---
    const clientInfo = invoiceData.patient || invoiceData.customer;
    const invoice = {
      invoiceNo: invoiceData.id,
      date: invoiceData.createdAt.toLocaleDateString(),
      customer: {
        name: clientInfo ? clientInfo.name : "Unknown Client",
        phone: clientInfo ? clientInfo.phone || "N/A" : "N/A",
      },
      products: invoiceData.items.map((item) => ({
        name: item.product
          ? `${item.product.name}${
              item.product.company ? ` (${item.product.company.name})` : ""
            }`
          : "Product Not Found",
        qty: item.quantity,
        rate: item.unitPrice,
        discount: ((item.discount / item.unitPrice) * 100).toFixed(1),
        total: item.totalPrice,
      })),
      subtotal: invoiceData.subtotal,
      gst:
        invoiceData.totalCgst + invoiceData.totalSgst + invoiceData.totalIgst,
      advancePaid: invoiceData.paidAmount,
      balance: invoiceData.totalAmount - invoiceData.paidAmount,
    };

    // --- Prescription (Eye Power) ---
    if (invoiceData.prescription && invoiceData.patient) {
      const pres = invoiceData.prescription;
      invoice.eyePower = [
        {
          eye: "RE",
          sphere: pres.rightEye?.sph || "0.00",
          cylinder: pres.rightEye?.cyl || "0.00",
          axis: pres.rightEye?.axis || "0",
          gst: "18%",
        },
        {
          eye: "LE",
          sphere: pres.leftEye?.sph || "0.00",
          cylinder: pres.leftEye?.cyl || "0.00",
          axis: pres.leftEye?.axis || "0",
          gst: "12%",
        },
      ];
    } else {
      invoice.eyePower = [
        { eye: "RE", sphere: "0.00", cylinder: "0.00", axis: "0", gst: "18%" },
        { eye: "LE", sphere: "0.00", cylinder: "0.00", axis: "0", gst: "12%" },
      ];
    }

    // --- Start PDF ---
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice.invoiceNo}.pdf`
    );
    doc.pipe(res);

    // --- HEADER ---
    // Outer header box with grey background
    doc.save();
    doc.rect(40, 30, 520, 120).fillAndStroke("#f2f2f2", "#000");
    doc.restore();

    // === TOP ROW: Brand (shifted left) + Barcode ===
    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(22)
      // left shift by giving x instead of align:center
      .text("CLEAR EYES OPTICAL", 60, 50, { characterSpacing: 1.5 });

    // Barcode (right side, aligned properly)
    const barcodePng = await bwipjs.toBuffer({
      bcid: "code128",
      text: invoice.invoiceNo,
      scale: 2,
      height: 15,
      includetext: false,
    });
    doc.image(barcodePng, 400, 40, { width: 150, height: 50 });
    doc.fontSize(9).fillColor("#000").text(invoice.invoiceNo, 430, 90);

    // === MIDDLE ROW: Address + Contact ===
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333")
      .text("68 Jessore Road, Diamond Plaza", 0, 100, { align: "center" })
      .text("Kolkata | +91-96765 43210", { align: "center" })
      .text("Follow us on Instagram @cleareyes_optical", { align: "center" });

    // === BOTTOM ROW: Invoice Info ===
    let infoY = 160;
    doc.font("Helvetica-Bold").fontSize(11).text(`Invoice No:`, 40, infoY);
    doc.font("Helvetica").text(invoice.invoiceNo, 120, infoY);

    doc.font("Helvetica-Bold").text(`Date:`, 400, infoY);
    doc.font("Helvetica").text(invoice.date, 450, infoY);

    // Customer Info
    doc.moveDown(1);
    doc.font("Helvetica-Bold").text(`Customer Name:`, 40, doc.y);
    doc.font("Helvetica").text(invoice.customer.name, 150, doc.y - 12);
    doc.font("Helvetica-Bold").text(`Mobile:`, 40, doc.y + 10);
    doc.font("Helvetica").text(invoice.customer.phone, 150, doc.y - 12);

    // --- EYE POWER TABLE ---
    doc
      .moveDown(2)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Customer Eye Power");

    let startY = doc.y + 10;
    const colWidthsEye = [80, 100, 100, 100, 100];
    const colXEye = [40, 120, 220, 320, 420];
    const rowHeight = 25;

    // Draw header row
    doc.rect(40, startY, 480, rowHeight).stroke();
    ["Eye", "Sphere", "Cylinder", "Axis", "GST"].forEach((h, i) => {
      doc.text(h, colXEye[i] + 5, startY + 7);
      if (i < colXEye.length - 1) {
        doc
          .moveTo(colXEye[i + 1], startY)
          .lineTo(colXEye[i + 1], startY + rowHeight)
          .stroke();
      }
    });

    // Draw rows
    invoice.eyePower.forEach((eye, idx) => {
      let y = startY + rowHeight * (idx + 1);
      doc.rect(40, y, 480, rowHeight).stroke();
      const values = [eye.eye, eye.sphere, eye.cylinder, eye.axis, eye.gst];
      values.forEach((v, i) => {
        doc.text(v.toString(), colXEye[i] + 5, y + 7);
        if (i < colXEye.length - 1) {
          doc
            .moveTo(colXEye[i + 1], y)
            .lineTo(colXEye[i + 1], y + rowHeight)
            .stroke();
        }
      });
    });

    // --- PRODUCT DETAILS TABLE ---
    doc.moveDown(2).font("Helvetica-Bold").fontSize(11).text("Product Details");

    startY = doc.y + 10;
    const prodCols = [40, 250, 300, 370, 450];
    const prodWidths = [210, 50, 70, 80, 90];

    // Header Row
    doc.rect(40, startY, 500, rowHeight).stroke();
    ["Product", "Qty", "Rate", "Discount", "Total"].forEach((h, i) => {
      doc.text(h, prodCols[i] + 5, startY + 7);
      if (i < prodCols.length - 1) {
        doc
          .moveTo(prodCols[i + 1], startY)
          .lineTo(prodCols[i + 1], startY + rowHeight)
          .stroke();
      }
    });

    // Rows
    invoice.products.forEach((p, idx) => {
      let y = startY + rowHeight * (idx + 1);
      doc.rect(40, y, 500, rowHeight).stroke();
      const values = [p.name, p.qty, p.rate, `${p.discount}%`, p.total];
      values.forEach((v, i) => {
        doc.text(v.toString(), prodCols[i] + 5, y + 7, {
          width: prodWidths[i] - 10,
        });
        if (i < prodCols.length - 1) {
          doc
            .moveTo(prodCols[i + 1], y)
            .lineTo(prodCols[i + 1], y + rowHeight)
            .stroke();
        }
      });
    });

    // --- SUMMARY BOX ---
    let summaryY = startY + rowHeight * (invoice.products.length + 2);
    doc.rect(320, summaryY, 220, 100).stroke();

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Subtotal: ${invoice.subtotal}`, 330, summaryY + 10);
    doc.text(`GST (Included): ${invoice.gst}`, 330, summaryY + 30);
    doc.text(`Advance Paid: ${invoice.advancePaid}`, 330, summaryY + 50);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Balance: ${invoice.balance}`, 330, summaryY + 75);

    // --- FOOTER ---
    doc.moveDown(4);
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
    console.error("Error generating PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};

// Generate a plain text receipt for thermal printing
exports.generateInvoiceThermal = async (req, res) => {
  const { id } = req.params;
  const printerWidth = parseInt(process.env.THERMAL_PRINTER_WIDTH, 10) || 48;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get client information (either patient or customer)
    const clientInfo = invoice.patient || invoice.customer;
    if (!clientInfo) {
      return res
        .status(404)
        .json({ error: `Client data not found for invoice ID: ${id}` });
    }

    const center = (text) =>
      text
        .padStart(Math.floor((printerWidth + text.length) / 2), " ")
        .padEnd(printerWidth, " ");
    const line = (left, right) =>
      `${left.padEnd(printerWidth / 2)}${right.padStart(printerWidth / 2)}`;
    const separator = "-".repeat(printerWidth);

    let receipt = [];

    receipt.push(center("Tax Invoice"));
    receipt.push(center("Clear Eyes Optical"));
    receipt.push(center("68 Jessore Road, Diamond Plaza"));
    receipt.push(center("Kolkata +91-96765 43210"));
    receipt.push(separator);

    receipt.push(
      line(
        `Order #: ${invoice.id}`,
        `Date: ${invoice.createdAt.toLocaleDateString()}`
      )
    );
    receipt.push(
      line(
        `Total Qty: ${invoice.items.reduce(
          (acc, item) => acc + item.quantity,
          0
        )}`,
        ""
      )
    );
    receipt.push(separator);

    receipt.push("Bill To & Delivery Address:");
    receipt.push(clientInfo.name);
    if (clientInfo.address) receipt.push(clientInfo.address);
    if (clientInfo.phone) receipt.push(clientInfo.phone);
    receipt.push(separator);

    // Show prescription only for patients (customers don't have prescriptions in schema)
    if (invoice.prescription && invoice.patient) {
      receipt.push("Prescription Details:");
      const p = invoice.prescription;

      // Create properly aligned prescription table
      receipt.push("Eye   SPH     CYL     Axis    Add     PD      BC");
      receipt.push("-".repeat(48));

      if (p.rightEye) {
        const { sph, cyl, axis, add, pd, bc } = p.rightEye;
        const rightEyeLine = `R     ${(sph || "-").padEnd(7)} ${(
          cyl || "-"
        ).padEnd(7)} ${(axis || "-").padEnd(7)} ${(add || "-").padEnd(7)} ${(
          pd || "-"
        ).padEnd(7)} ${bc || "-"}`;
        receipt.push(rightEyeLine);
      }

      if (p.leftEye) {
        const { sph, cyl, axis, add, pd, bc } = p.leftEye;
        const leftEyeLine = `L     ${(sph || "-").padEnd(7)} ${(
          cyl || "-"
        ).padEnd(7)} ${(axis || "-").padEnd(7)} ${(add || "-").padEnd(7)} ${(
          pd || "-"
        ).padEnd(7)} ${bc || "-"}`;
        receipt.push(leftEyeLine);
      }

      receipt.push(separator);
    }

    receipt.push("Items");
    receipt.push(line("Name/Price", "Qty x Total"));
    receipt.push(separator);

    invoice.items.forEach((item) => {
      const productName = item.product
        ? item.product.name
        : "Product Not Found";
      const companyName =
        item.product && item.product.company
          ? ` (${item.product.company.name})`
          : "";

      receipt.push(`${productName}${companyName}`);
      receipt.push(
        line(
          `  @ ${item.unitPrice.toFixed(2)}`,
          `${item.quantity} x ${item.totalPrice.toFixed(2)}`
        )
      );
      if (item.discount > 0)
        receipt.push(line("  Discount:", `-${item.discount.toFixed(2)}`));
      if (item.cgst > 0)
        receipt.push(line("  CGST:", `${item.cgst.toFixed(2)}`));
      if (item.sgst > 0)
        receipt.push(line("  SGST:", `${item.sgst.toFixed(2)}`));
    });
    receipt.push(separator);

    receipt.push(line("Subtotal:", invoice.subtotal.toFixed(2)));
    receipt.push(
      line("Total Discount:", `-${invoice.totalDiscount.toFixed(2)}`)
    );
    if (invoice.totalIgst > 0)
      receipt.push(line("IGST:", invoice.totalIgst.toFixed(2)));
    if (invoice.totalCgst > 0)
      receipt.push(line("CGST:", invoice.totalCgst.toFixed(2)));
    if (invoice.totalSgst > 0)
      receipt.push(line("SGST:", invoice.totalSgst.toFixed(2)));
    receipt.push(separator);
    receipt.push(line("Grand Total:", invoice.totalAmount.toFixed(2)));
    receipt.push(separator);

    receipt.push(center("Thank You for Shopping with Us!"));
    receipt.push(center("Visit again. Follow us on Instagram"));
    receipt.push(center("@cleareyes_optical"));
    receipt.push(separator);

    const receiptText = receipt.join("\n");

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(receiptText);
  } catch (error) {
    console.error("Error generating thermal receipt:", error);
    res.status(500).json({ error: "Failed to generate thermal receipt" });
  }
};

// Get all invoices with optional filtering
exports.getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      patientId,
      customerId,
      staffId,
      prescriptionId,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (status) where.status = status;
    if (patientId) where.patientId = parseInt(patientId);
    if (customerId) where.customerId = parseInt(customerId);
    if (staffId) where.staffId = parseInt(staffId);
    if (prescriptionId) where.prescriptionId = parseInt(prescriptionId);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
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
          transactions: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.status(200).json({
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / take),
        totalItems: total,
        itemsPerPage: take,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "UNPAID",
    "PAID",
    "PARTIALLY_PAID",
    "CANCELLED",
    "REFUNDED",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        customer: true,
        staff: true,
        items: {
          include: {
            product: true,
          },
        },
        transactions: true,
      },
    });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice status:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Invoice not found." });
    }
    res.status(500).json({ error: "Failed to update invoice status." });
  }
};

// Add payment to invoice
exports.addPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, giftCardId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid payment amount is required." });
  }

  if (!paymentMethod) {
    return res.status(400).json({ error: "Payment method is required." });
  }

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Get current invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { transactions: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Calculate current paid amount
      const currentPaidAmount = invoice.transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      // Check if payment amount is valid
      const remainingAmount = invoice.totalAmount - currentPaidAmount;
      if (amount > remainingAmount) {
        throw new Error(
          `Payment amount exceeds remaining balance of ${remainingAmount.toFixed(
            2
          )}`
        );
      }

      // Handle gift card payment
      if (giftCardId && paymentMethod === "GIFT_CARD") {
        const giftCard = await prisma.giftCard.findUnique({
          where: { id: parseInt(giftCardId) },
        });

        if (!giftCard) {
          throw new Error("Gift card not found");
        }

        if (giftCard.balance < amount) {
          throw new Error("Insufficient gift card balance");
        }

        // Update gift card balance
        await prisma.giftCard.update({
          where: { id: parseInt(giftCardId) },
          data: { balance: { decrement: amount } },
        });
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          invoiceId: id,
          amount: parseFloat(amount),
          paymentMethod,
          giftCardId: giftCardId ? parseInt(giftCardId) : null,
        },
      });

      // Update invoice paid amount and status
      const newPaidAmount = currentPaidAmount + parseFloat(amount);
      let newStatus = "PARTIALLY_PAID";

      if (newPaidAmount >= invoice.totalAmount) {
        newStatus = "PAID";
      } else if (newPaidAmount === 0) {
        newStatus = "UNPAID";
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: {
          patient: true,
          customer: true,
          staff: true,
          items: {
            include: {
              product: true,
            },
          },
          transactions: true,
        },
      });

      return { invoice: updatedInvoice, transaction };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ error: error.message || "Failed to add payment." });
  }
};

// Delete invoice (soft delete by updating status)
exports.deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    // Check if invoice has payments
    if (invoice.transactions.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete invoice with existing payments. Please cancel instead.",
      });
    }

    // Update status to cancelled instead of hard delete
    const cancelledInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.status(200).json({
      message: "Invoice cancelled successfully",
      invoice: cancelledInvoice,
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice." });
  }
};
