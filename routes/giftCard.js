
const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const auth = require('../middleware/auth');

router.post('/issue', auth, giftCardController.issueCard);
router.post('/redeem', auth, giftCardController.redeemCard);
router.get('/:code', auth, giftCardController.getCardBalance);

module.exports = router;
