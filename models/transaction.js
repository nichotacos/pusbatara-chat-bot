const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    installment: {
        type: Schema.Types.ObjectId,
        ref: 'Installment',
        default: null
    },
    amount: {
        type: Double,
        required: true
    },
    transaction_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    transaction_status: {
        type: String,
        required: true
    },
    transaction_receipt: {
        type: String,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },

})