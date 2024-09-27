const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const installmentSchema = new Schema({
    donation: {
        type: Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    current_amount: {
        type: Number,
        default: 0
    },
    payment_date: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        default: 'on-going'
    },
})