require('dotenv').config();
const express = require('express');
const compression = require('compression');

const app = express();

// Middleware
app.use(compression());
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/royalty', require('./routes/royalty'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/gift-card', require('./routes/giftCard'));
app.use('/api/reporting', require('./routes/reporting'));
app.use('/api/barcode', require('./routes/barcode'));
app.use('/api/invoice', require('./routes/invoice'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/prescription', require('./routes/prescription'));
app.use('/api/product', require('./routes/product'));


// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
