const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    },
    data: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bid', BidSchema);