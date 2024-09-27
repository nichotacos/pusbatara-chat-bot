const Transaction = require('../models/transaction');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().then((transaction) => {
            console.log(transaction);
            res.send(transaction);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}