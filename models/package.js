const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const packageSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    goal_amount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Package', packageSchema);