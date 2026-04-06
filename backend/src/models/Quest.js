// ARQUIVO: backend/src/models/Quest.js
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['DIARIA', 'SEMANAL', 'EVENTO', 'MENSAL', 'CAMPANHA', 'FUNCIONALIDADE'],
        required: true
    },
    validationMethod: {
        type: String,
        enum: ['AUTO', 'SECRET_CODE', 'MANUAL_ADMIN'],
        default: 'MANUAL_ADMIN'
    },
    validCodes: [{
        code: { type: String },
        isUsed: { type: Boolean, default: false },
        usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    rewards: {
        pc: { type: Number, default: 0 },
        badgeId: { type: String }
    },
    // 🚀 O NOVO COFRE DE ITENS
    rewardItems: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }, // Referência ao item real do jogo!
        name: { type: String },
        category: { type: String },
        validityDays: { type: Number, default: 90 },
        sendToClassroom: { type: Boolean, default: false }
    }],
    minRank: { type: Number, default: 1 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quest', questSchema);