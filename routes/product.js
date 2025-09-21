const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        company: true,
        shopInventory: true,
      }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Add a new product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      description,
      basePrice, 
      barcode,
      sku,
      eyewearType, 
      frameType,
      companyId,
      material,
      color,
      size,
      model
    } = req.body;

    // Validate required fields
    if (!name || !basePrice || !eyewearType || !companyId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, basePrice, eyewearType, and companyId are required.' 
      });
    }

    // Validate eyewear type
    const validEyewearTypes = ['GLASSES', 'SUNGLASSES', 'LENSES'];
    if (!validEyewearTypes.includes(eyewearType)) {
      return res.status(400).json({ 
        error: 'Invalid eyewearType. Must be GLASSES, SUNGLASSES, or LENSES.' 
      });
    }

    // Validate frame type for glasses and sunglasses
    if (eyewearType !== 'LENSES' && !frameType) {
      return res.status(400).json({ 
        error: 'FrameType is required for glasses and sunglasses.' 
      });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return res.status(400).json({ error: 'Company not found.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        basePrice: parseFloat(basePrice),
        barcode,
        sku,
        eyewearType,
        frameType: eyewearType === 'LENSES' ? null : frameType,
        companyId: parseInt(companyId),
        material,
        color,
        size,
        model
      },
      include: {
        company: true
      }
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002') {
      // Handle unique constraint violations
      if (error.meta?.target?.includes('barcode')) {
        return res.status(409).json({ error: 'Barcode already exists.' });
      }
      if (error.meta?.target?.includes('sku')) {
        return res.status(409).json({ error: 'SKU already exists.' });
      }
      return res.status(409).json({ error: 'Duplicate entry found.' });
    }
    
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

module.exports = router;
