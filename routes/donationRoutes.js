const express = require('express');
const router = express.Router();
const DonationController = require('../controllers/donationController');

// Donation Routes

router.get('/', DonationController.getDonations);

router.post('/', DonationController.addDonations);

module.exports = router;