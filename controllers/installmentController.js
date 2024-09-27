const Installment = require('../models/installment');
const Donation = require('../models/donation');

exports.getInstallments = async (req, res) => {
    try {
        const installments = await Installment.find().then((installment) => {
            console.log(installment);
            res.send(installment);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.addInstallment = async (req, res) => {
    try {
        const donation = await Donation.findOne({ _id: req.body.donation_id })
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        const installment = new Installment({
            donation: donation._id,
        });

        const newInstallment = await installment.save();
        return res.status(201).json({ message: 'Installment added successfully', data: newInstallment });

    } catch (error) {
        console.error('Error adding installment:', error);
        return res.status(500).json({ message: 'Error adding installment', error: error.message });
    }
}