const bwipjs = require('bwip-js');
const { createCanvas, loadImage } = require('canvas');

exports.generateBarcodeLabel = async (req, res) => {
  try {
    // Data will come from frontend (query or body)
    const {
      name,          // Product name
      description,   // Product description
      price,         // Product price
      data,          // Barcode value (SKU, ID, etc.)
      bcid = 'code128',   // Barcode type
      scale = 3,          // Scaling
      height = 20,        // Barcode height
      includetext = false // Barcode text, default false since we draw our own
    } = req.body; // <-- frontend sends JSON in body (POST request)

    // Validate required fields
    if (!name || !price || !data) {
      return res.status(400).json({
        error: 'Missing required fields: name, price, data',
      });
    }

    // Generate barcode buffer
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid,
      text: data,
      scale: parseInt(scale),
      height: parseInt(height),
      includetext: includetext === true, // only true if frontend sends true
    });

    // Create canvas for full label
    const canvas = createCanvas(400, 150);
    const ctx = canvas.getContext('2d');

    // Background white
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Product name
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(name, 10, 25);

    // Description (optional)
    if (description) {
      ctx.font = '12px Arial';
      ctx.fillText(description, 10, 45);
    }

    // Price (align right)
    ctx.font = 'bold 14px Arial';
    ctx.fillText(price, 300, 25);

    // Load barcode onto canvas
    const barcodeImg = await loadImage(barcodeBuffer);
    ctx.drawImage(barcodeImg, 10, 60, 300, 60);

    // Send final label as PNG
    res.set('Content-Type', 'image/png');
    res.send(canvas.toBuffer());

  } catch (error) {
    console.error('Error generating barcode label:', error.message);
    res.status(500).json({ error: 'Internal server error while generating label' });
  }
};