const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Process a payment for an invoice
exports.processPayment = async (req, res) => {
  const { invoiceId, amount, paymentMethod, giftCardCode } = req.body;

  if (!invoiceId || !amount || !paymentMethod) {
    return res
      .status(400)
      .json({ error: "Invoice ID, amount, and payment method are required." });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        staff: true,
        transactions: true, // ✅ FIX: Include transactions for accurate calculation
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    // Verify invoice belongs to the same shop as the staff member
    if (invoice.staff.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({ error: "Access denied. Invoice belongs to different shop." });
    }

    if (invoice.status === "PAID") {
      return res
        .status(400)
        .json({ error: "This invoice has already been paid in full." });
    }

    // ✅ FIX: Calculate actual paid amount from transactions (single source of truth)
    const actualPaidAmount = invoice.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const amountDue = invoice.totalAmount - actualPaidAmount;

    if (amount > amountDue) {
      return res.status(400).json({
        error: `Payment amount cannot exceed the amount due of $${amountDue.toFixed(
          2
        )}.`,
      });
    }

    let giftCardId = null;

    // Handle Gift Card payments
    if (paymentMethod === "GIFT_CARD") {
      if (!giftCardCode) {
        return res.status(400).json({
          error: "Gift card code is required for gift card payments.",
        });
      }

      const giftCard = await prisma.giftCard.findUnique({
        where: { code: giftCardCode },
      });

      if (!giftCard) {
        return res.status(404).json({ error: "Gift card not found." });
      }

      if (giftCard.balance < amount) {
        return res.status(400).json({
          error: `Insufficient gift card balance. Current balance is $${giftCard.balance.toFixed(
            2
          )}.`,
        });
      }

      // Deduct from gift card balance
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { balance: { decrement: amount } },
      });
      giftCardId = giftCard.id;
    }

    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        invoiceId,
        amount,
        paymentMethod,
        giftCardId,
      },
    });

    // ✅ FIX: Recalculate new paid amount from ALL transactions (not just adding to old value)
    const allTransactions = await prisma.transaction.findMany({
      where: { invoiceId },
    });
    const newPaidAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const newStatus =
      newPaidAmount >= invoice.totalAmount ? "PAID" : "PARTIALLY_PAID";

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: {
        transactions: true,
      },
    });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment." });
  }
};
