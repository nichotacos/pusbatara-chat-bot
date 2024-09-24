const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const donationSchema = new Schema({
    donator: {
        type: Schema.Types.ObjectId,
        ref: 'Donator',
        required: true
    },
    package: {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: true
    },
    amount: {
        type: Double,
        required: true
    },
    installment_options: {
        type: Boolean,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'pending'
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
});