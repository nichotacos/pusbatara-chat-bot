const Donator = require('../models/donator');

exports.getDonators = async (req, res) => {
    try {
        const donators = await Donator.find().then((donator) => {
            console.log(donator);
            res.send(donator);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};