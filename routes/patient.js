
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');

router.post('/', auth, patientController.createPatient);

module.exports = router;
