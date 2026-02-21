// ARQUIVO: backend/src/models/MarketListing.js
const mongoose = require('mongoose');

const MarketListingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    itemData: {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        name: { type: String, required: true },
        descricao: String,
        imagem: String,
        raridade: String,
        basePrice: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        expiresAt: Date,
        category: String,
        isHouseItem: { type: Boolean, default: false } // 🔥 ESTAVA FALTANDO AQUI!
    },

    price: { type: Number, required: true, min: 1 },
    isOverpriced: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'SOLD', 'CANCELLED'], default: 'ACTIVE' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    soldAt: Date,
    taxPaid: { type: Number, default: 0 }

}, { timestamps: true });

MarketListingSchema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model('MarketListing', MarketListingSchema);