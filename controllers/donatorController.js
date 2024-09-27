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

exports.addDonator = async (req, res) => {
    try {
        console.log('request:', req.body);
        Donator.findOne({
            phone: req.body.phone
        }).then((donator) => {
            if (!donator) {
                const donator = new Donator({
                    name: req.body.name,
                    phone: req.body.phone,
                    province: req.body.province,
                    city: req.body.city
                });
                donator.save().then((donator) => {
                    res.status(201).json({ message: 'Donator added successfully', request: donator });
                });
            } else {
                return res.json({ message: 'Donator already exists' });
            }
        })
    } catch (error) {
        console.log('error adding donator', error);
    }
}