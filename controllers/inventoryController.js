
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addProduct = async (req, res) => {
  const { name, description, barcode } = req.body;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        barcode,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.stockIn = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const inventory = await prisma.inventory.upsert({
      where: { productId: parseInt(productId) },
      update: {
        quantity: {
          increment: parseInt(quantity),
        },
      },
      create: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.stockOut = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const inventory = await prisma.inventory.update({
      where: { productId: parseInt(productId) },
      data: {
        quantity: {
          decrement: parseInt(quantity),
        },
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
    });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, description, barcode } = req.body;

  try {
    const product = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name,
        description,
        barcode,
      },
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};
