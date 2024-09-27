const express = require('express');
const router = express.Router();
const DonatorController = require('../controllers/donatorController');


// Donatro Routes
router.get('/', DonatorController.getDonators);
router.post('/', DonatorController.addDonator);

module.exports = router;