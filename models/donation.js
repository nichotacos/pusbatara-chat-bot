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
        type: Number,
        required: true
    },
    installment_options: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Donation', donationSchema);