const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updateStockByBarcode = async (req, res) => {
  const { barcode, quantity } = req.body;

  if (!barcode || quantity === undefined) {
    return res.status(400).json({ error: 'Barcode and quantity are required.' });
  }

  const quantityInt = parseInt(quantity);

  if (isNaN(quantityInt)) {
    return res.status(400).json({ error: 'Quantity must be a valid number.' });
  }

  try {
    // Step 1: Find the product by its barcode
    const product = await prisma.product.findUnique({
      where: { barcode: barcode },
    });

    if (!product) {
      return res.status(404).json({ error: `Product with barcode ${barcode} not found.` });
    }

    // Step 2: Use `upsert` to efficiently update or create the inventory record
    const inventory = await prisma.inventory.upsert({
      where: { productId: product.id }, // Unique identifier for the inventory item
      update: {
        quantity: {
          increment: quantityInt, // Add the new quantity to the existing stock
        },
      },
      create: {
        productId: product.id,
        quantity: quantityInt, // Create a new record if it doesn't exist
      },
      include: {
        product: true, // Include product details in the response
      }
    });

    res.status(200).json(inventory);
  } catch (error) {
    console.error('Failed to update stock by barcode:', error);
    res.status(500).json({ error: 'An error occurred while updating the inventory.' });
  }
};


exports.addProduct = async (req, res) => {
  const { name, description, barcode, price } = req.body;

  if (price === undefined) {
    return res.status(400).json({ error: 'Price is a required field.' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        barcode,
        price,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.stockIn = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const existingInventory = await prisma.inventory.findFirst({
      where: { productId: parseInt(productId) },
    });

    if (existingInventory) {
      const inventory = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: {
            increment: parseInt(quantity),
          },
        },
      });
      res.status(200).json(inventory);
    } else {
      const inventory = await prisma.inventory.create({
        data: {
          productId: parseInt(productId),
          quantity: parseInt(quantity),
        },
      });
      res.status(201).json(inventory);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.stockOut = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const inventory = await prisma.inventory.updateMany({
      where: { 
        productId: parseInt(productId),
        quantity: {
          gte: parseInt(quantity)
        }
      },
      data: {
        quantity: {
          decrement: parseInt(quantity),
        },
      },
    });

    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { name, description, barcode, price } = req.body;

  try {
    const product = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name,
        description,
        barcode,
        price
      },
    });
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
