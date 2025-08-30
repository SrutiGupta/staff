const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Add a new product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, price } = req.body;
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
      },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

module.exports = router;
