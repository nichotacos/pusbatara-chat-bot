const express = require('express');
const router = express.Router();
const DonatorController = require('../controllers/donatorController');

router.get('/', DonatorController.getDonators);

module.exports = router;