const Transaction = require('../models/transaction');
const Donation = require('../models/donation');
const Installment = require('../models/installment');


exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate([
                {
                    path: 'donation',
                    model: 'Donation',
                }
            ])
            .then((transaction) => {
                console.log(transaction);
                res.send(transaction);
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.addTransaction = async (req, res) => {
    try {
        const donation = await Donation.findOne({ _id: req.body.donation_id });
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        let installment;
        if (donation.installment_options) {
            installment = await Installment.findOne({ donation: donation._id });
        } else {
            installment = null;
        }

        const installmentReq = installment ? installment._id : null;

        const transaction = new Transaction({
            donation: donation._id,
            installment: installmentReq,
            amount: req.body.amount,
            transaction_receipt: req.body.transaction_receipt,
        });

        const newTransaction = await transaction.save();
        return res.status(201).json({ message: 'Transaction added successfully', data: newTransaction });
    } catch (error) {
        console.error('Error adding transaction:', error);
        return res.status(500).json({ message: 'Error adding transaction', error: error.message });
    }
}