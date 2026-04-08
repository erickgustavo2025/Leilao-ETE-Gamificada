const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
    rankId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    min: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: 'text-slate-500'
    },
    border: {
        type: String,
        default: 'border-slate-500'
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Rank', rankSchema);
