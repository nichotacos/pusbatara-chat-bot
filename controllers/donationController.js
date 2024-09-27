const Donation = require('../models/donation');
const Donator = require('../models/donator');
const Package = require('../models/package');

exports.getDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('donator').populate('package').then((donation) => {
            console.log(donation);
            res.send(donation);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.addDonations = async (req, res) => {
    try {
        const donator = await Donator.findOne({ phone: req.body.phone });
        if (!donator) {
            return res.status(404).json({ message: 'Donator not found' });
        }

        const selectedPackage = await Package.findOne({ name: req.body.package });
        if (!selectedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }

        const donation = new Donation({
            donator: donator._id,
            package: selectedPackage._id,
            amount: req.body.amount,
            installment_options: req.body.installment_options,
            status: 'pending'
        });

        const newDonation = await donation.save();
        return res.status(201).json({ message: 'Donation added successfully', data: newDonation });

    } catch (error) {
        console.error('Error adding donation:', error);
        return res.status(500).json({ message: 'Error adding donation', error: error.message });
    }
};
