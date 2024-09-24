const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const donatorSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
        // consider it will be unique or not
    },
    province: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Donator', donatorSchema);