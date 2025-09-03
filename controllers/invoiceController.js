const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const prisma = new PrismaClient();

// Create a new invoice
exports.createInvoice = async (req, res) => {
  const { patientId, customerId, prescriptionId, items } = req.body;
  const staffId = req.user.id; // Assuming staffId is available in req.user

  // Validate that either patientId or customerId is provided, but not both
  if ((!patientId && !customerId) || (patientId && customerId)) {
    return res
      .status(400)
      .json({
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

      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
      });
      if (!inventory || inventory.quantity < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for ${product.name}.` });
      }

      const itemSubtotal = product.price * item.quantity;
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
        unitPrice: product.price,
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

      // Update inventory for each item
      for (const item of items) {
        await prisma.inventory.updateMany({
          where: { productId: item.productId },
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

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice.id}.pdf`
    );

    doc.pipe(res);

    // ===== Header =====
    doc.fontSize(16).text("Tax Invoice", 250, 40, { align: "center" });

    doc
      .fontSize(10)
      .text("LENSKART SOLUTIONS PRIVATE LIMITED", 250, 60, { align: "center" })
      .text("Property No 29/24/2, 25/2/1 ... Gurugram (06) - 122004", 250, 75, {
        align: "center",
      });

    // Right top box (Shipment details)
    doc
      .rect(450, 40, 120, 100)
      .stroke()
      .fontSize(10)
      .text(`Shipment Code: ${invoice.id}`, 455, 50)
      .text(`Order #: ${invoice.id}`, 455, 65)
      .text(`Order Date: ${invoice.createdAt.toLocaleDateString()}`, 455, 80)
      .text(
        `Total Quantity: ${invoice.items.reduce(
          (acc, item) => acc + item.quantity,
          0
        )}`,
        455,
        95
      );

    // ===== Bill To & Delivery =====
    const clientInfo = invoice.patient || invoice.customer;
    const clientName = clientInfo ? clientInfo.name : "Unknown Client";
    const clientAddress = clientInfo ? clientInfo.address || "" : "";
    const clientPhone = clientInfo ? clientInfo.phone || "" : "";

    doc
      .moveDown()
      .fontSize(11)
      .text("Bill To Address", 40, 160, { underline: true })
      .text(clientName)
      .text(clientAddress)
      .text(clientPhone);

    doc
      .text("Address Of Delivery", 300, 160, { underline: true })
      .text(clientName)
      .text(clientAddress)
      .text(clientPhone);

    // ===== Prescription Table =====
    // Only show prescription if the invoice is for a patient and has prescription data
    if (invoice.prescription && invoice.patient) {
      doc.moveDown().fontSize(11).text("Prescription Details:", 40, 250);

      const prescTableTop = 270;
      const p = invoice.prescription;
      const rightEye = p.rightEye || {};
      const leftEye = p.leftEye || {};
      generateTableRow(
        doc,
        prescTableTop,
        "Eye",
        "SPH",
        "CYL",
        "Axis",
        "Add",
        "PD",
        "BC"
      );
      generateTableRow(
        doc,
        prescTableTop + 20,
        "Right",
        rightEye.sph || "",
        rightEye.cyl || "",
        rightEye.axis || "",
        rightEye.add || "",
        rightEye.pd || "",
        rightEye.bc || ""
      );
      generateTableRow(
        doc,
        prescTableTop + 40,
        "Left",
        leftEye.sph || "",
        leftEye.cyl || "",
        leftEye.axis || "",
        leftEye.add || "",
        leftEye.pd || "",
        leftEye.bc || ""
      );
    }

    // ===== Item Table =====
    doc.moveDown().text("Description Of Goods", 40, 350);

    const itemTableTop = 370;
    generateTableRow(
      doc,
      itemTableTop,
      "Description",
      "Unit Price",
      "Discount",
      "IGST",
      "SGST",
      "CGST",
      "QTY",
      "Total"
    );

    invoice.items.forEach((item, i) => {
      const y = itemTableTop + (i + 1) * 20;
      const productName = item.product
        ? item.product.name
        : "Product Not Found";
      const companyName =
        item.product && item.product.company
          ? ` (${item.product.company.name})`
          : "";

      generateTableRow(
        doc,
        y,
        productName + companyName,
        item.unitPrice.toFixed(2),
        item.discount.toFixed(2),
        "0.00", // IGST - using 0 as schema doesn't have igst field in InvoiceItem
        item.sgst.toFixed(2),
        item.cgst.toFixed(2),
        item.quantity.toString(),
        item.totalPrice.toFixed(2)
      );
    });

    // ===== Summary =====
    doc
      .moveDown()
      .fontSize(11)
      .text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: "right" })
      .text(`Discount: ${invoice.totalDiscount.toFixed(2)}`, { align: "right" })
      .text(`IGST: ${invoice.totalIgst.toFixed(2)}`, { align: "right" })
      .text(`CGST: ${invoice.totalCgst.toFixed(2)}`, { align: "right" })
      .text(`SGST: ${invoice.totalSgst.toFixed(2)}`, { align: "right" })
      .text(`Grand Total: ${invoice.totalAmount.toFixed(2)}`, {
        align: "right",
      });

    // ===== Footer =====
    doc
      .moveDown()
      .fontSize(9)
      .text(
        "Disclaimer: This is computer generated invoice and does not require signature",
        40,
        700
      )
      .text("For T&C please visit www.lenskart.com", 40, 715);

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF invoice" });
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
    receipt.push(center("LENSKART SOLUTIONS PRIVATE LIMITED"));
    receipt.push(center("Gurugram (06) - 122004"));
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

    // Only show prescription if invoice is for a patient and has prescription data
    if (invoice.prescription && invoice.patient) {
      receipt.push("Prescription Details:");
      const p = invoice.prescription;
      receipt.push("Eye   SPH    CYL    Axis   Add");
      if (p.rightEye) {
        const { sph, cyl, axis, add } = p.rightEye;
        receipt.push(
          `R     ${sph || "-"}    ${cyl || "-"}    ${axis || "-"}    ${
            add || "-"
          }`
        );
      }
      if (p.leftEye) {
        const { sph, cyl, axis, add } = p.leftEye;
        receipt.push(
          `L     ${sph || "-"}    ${cyl || "-"}    ${axis || "-"}    ${
            add || "-"
          }`
        );
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

    receipt.push(center("Disclaimer: This is a computer"));
    receipt.push(center("generated invoice and does not"));
    receipt.push(center("require a signature."));
    receipt.push(center("For T&C please visit www.company.com"));

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
