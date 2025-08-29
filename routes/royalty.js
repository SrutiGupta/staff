
const express = require('express');
const router = express.Router();
const royaltyController = require('../controllers/royaltyController');
const auth = require('../middleware/auth');

router.post('/', auth, royaltyController.addPoints);
router.get('/:patientId', auth, royaltyController.getPoints);

module.exports = router;
