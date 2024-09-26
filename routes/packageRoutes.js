const expreess = require('express');
const router = expreess.Router();
const PackageController = require('../controllers/packageController');

router.get('/', PackageController.getPackages);

module.exports = router;