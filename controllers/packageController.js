const Package = require('../models/package');

exports.getPackages = async (req, res) => {
    try {
        const packages = await Package.find().then((package) => {
            console.log(package);
            res.send(package);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}