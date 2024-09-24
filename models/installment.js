const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const installmentSchema = new Schema({
    donation: {
        type: Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    current_amount: {
        type: Double,
        required: true
    },
    payment_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
    },
})