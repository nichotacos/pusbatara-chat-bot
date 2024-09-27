const express = require('express');
const router = express.Router();
const InstallmentController = require('../controllers/installmentController');

// Installment Routes
router.get('/', InstallmentController.getInstallments);
router.post('/', InstallmentController.addInstallment);

module.exports = router;