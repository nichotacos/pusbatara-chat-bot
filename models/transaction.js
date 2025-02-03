const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    installment: {
        type: Schema.Types.ObjectId,
        ref: 'Installment',
        default: null
    },
    donation: {
        type: Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    transaction_date: {
        type: Date,
        default: Date.now
    },
    approval_date: {
        type: Date,
        default: null
    },
    transaction_status: {
        type: String,
        required: true,
        default: 'Waiting for approval'
    },
    transaction_receipt: {
        type: String,
        required: true
    },
    payment_method: {
        type: String,
        default: null
    },
});

module.exports = mongoose.model('Transaction', transactionSchema);