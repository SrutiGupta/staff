const bwipjs = require('bwip-js');

exports.generateBarcode = async (req, res) => {
  const { data } = req.params;

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128', // Barcode type
      text: data,      // Text to encode
      scale: 3,            // 3x scaling factor
      height: 10,          // Bar height, in millimeters
      includetext: true,   // Show human-readable text
      textxalign: 'center', // Always good to set this
    });

    res.set('Content-Type', 'image/png');
    res.status(200).send(png);
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ error: 'Failed to generate barcode' });
  }
};
