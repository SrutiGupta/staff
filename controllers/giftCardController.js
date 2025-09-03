const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.issueCard = async (req, res) => {
  const { patientId, balance } = req.body;
  const code = Math.random().toString(36).substring(2, 15);

  try {
    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        balance: parseFloat(balance),
        patientId: parseInt(patientId),
      },
    });
    res.status(201).json(giftCard);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.redeemCard = async (req, res) => {
  const { code, amount } = req.body;

  try {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    if (giftCard.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const updatedGiftCard = await prisma.giftCard.update({
      where: { code },
      data: {
        balance: {
          decrement: parseFloat(amount),
        },
      },
    });

    res.status(200).json(updatedGiftCard);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getCardBalance = async (req, res) => {
  const { code } = req.params;

  try {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    res.status(200).json({ balance: giftCard.balance });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
