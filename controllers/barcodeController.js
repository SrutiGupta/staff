const bwipjs = require('bwip-js');

exports.generateBarcode = async (req, res) => {
  try {
    // Accept both /barcode/:data and /barcode?data=xyz
    const data = req.params.data || req.query.data;

    // Input validation
    if (!data || data.trim() === '') {
      return res.status(400).json({ error: 'Data is required to generate a barcode' });
    }

    // Allow customization via query params
    const {
      bcid = 'code128',        // Default barcode type
      scale = 3,               // Default scaling
      height = 20,             // Default height (better for scanners)
      includetext = true,      // Show text below barcode
      textxalign = 'center',   // Centered text
    } = req.query;

    // Generate PNG buffer
    const png = await bwipjs.toBuffer({
      bcid,                    
      text: data,              
      scale: parseInt(scale),  
      height: parseInt(height),
      includetext: includetext !== 'false', 
      textxalign,
    });

    // Response headers
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // cache for 1 day
    res.status(200).send(png);

  } catch (error) {
    console.error('Error generating barcode:', error.message);
    res.status(500).json({ error: 'Internal server error while generating barcode' });
  }
};
