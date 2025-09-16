const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// This is a placeholder for your configurable rules.
// You can replace this with a more dynamic solution, such as fetching rules from a database.
const royaltyRules = {
  pointsPerVisit: 10,
};

exports.addPoints = async (req, res) => {
  const { patientId } = req.body;

  try {
    // Verify patient belongs to the staff member's shop
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patient.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({ error: "Access denied. Patient belongs to different shop." });
    }

    const royalty = await prisma.royalty.upsert({
      where: { patientId: parseInt(patientId) },
      update: {
        points: {
          increment: royaltyRules.pointsPerVisit,
        },
      },
      create: {
        patientId: parseInt(patientId),
        points: royaltyRules.pointsPerVisit,
      },
    });

    res.status(200).json(royalty);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getPoints = async (req, res) => {
  const { patientId } = req.params;

  try {
    // Verify patient belongs to the staff member's shop
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patient.shopId !== req.user.shopId) {
      return res
        .status(403)
        .json({ error: "Access denied. Patient belongs to different shop." });
    }

    const royalty = await prisma.royalty.findUnique({
      where: { patientId: parseInt(patientId) },
    });

    if (!royalty) {
      return res
        .status(404)
        .json({ error: "Patient not found in royalty program" });
    }

    res.status(200).json(royalty);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
