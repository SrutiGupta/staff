const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updateStockByBarcode = async (req, res) => {
  const { barcode, quantity, price } = req.body;

  if (!barcode || quantity === undefined) {
    return res.status(400).json({ error: 'Barcode and quantity are required.' });
  }

  const quantityInt = parseInt(quantity, 10);
  const newPrice = price !== undefined ? parseFloat(price) : undefined;

  if (isNaN(quantityInt)) {
    return res.status(400).json({ error: 'Quantity must be a valid number.' });
  }
  if (price !== undefined && isNaN(newPrice)) {
      return res.status(400).json({ error: 'Price must be a valid number.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find the product by its barcode
      const product = await tx.product.findUnique({
        where: { barcode: barcode },
      });

      if (!product) {
        throw new Error(`Product with barcode ${barcode} not found.`);
      }

      // Step 2 (Optional): Update the product's price if a new price is provided
      let updatedProduct = product;
      if (newPrice !== undefined && product.price !== newPrice) {
        updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: { price: newPrice },
        });
      }

      // Step 3: Upsert the inventory record
      const inventory = await tx.inventory.upsert({
        where: { productId: product.id },
        update: {
          quantity: {
            increment: quantityInt,
          },
        },
        create: {
          productId: product.id,
          quantity: quantityInt,
        },
      });

      return { ...inventory, product: updatedProduct };
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('Failed to update stock by barcode:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
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
