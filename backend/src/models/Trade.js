const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // O que o iniciador oferece
    offerInitiator: {
        pc: { type: Number, default: 0 },
        items: [{
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
            inventoryId: String,
            name: String,
            basePrice: Number,
            image: String,
            expiresAt: Date,
            descricao: String,
            isHouseItem: { type: Boolean, default: false }, // 🔥 O SALVADOR DA PÁTRIA!
            category: String,
            rarity: String
        }]
    },

    // O que o alvo oferece
    offerTarget: {
        pc: { type: Number, default: 0 },
        items: [{
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
            inventoryId: String,
            name: String,
            basePrice: Number,
            image: String,
            descricao: String,
            expiresAt: Date,
            isHouseItem: { type: Boolean, default: false }, 
            category: String,
            rarity: String
        }]
    },

    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'REJECTED'],
        default: 'PENDING'
    },

    fairnessRatio: { type: Number, default: 1 },
    
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Expira em 24h
}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema); 