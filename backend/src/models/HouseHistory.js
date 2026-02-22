// ARQUIVO: backend/src/models/HouseHistory.js
// Collection SEPARADA da Classroom — histórico imutável das casas lendárias
const mongoose = require('mongoose');

const houseHistorySchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    anosAtivos: {
        type: String,
        required: true,
        trim: true
    },   // Ex: "2021 - 2023"
    anoEntrada: {
        type: Number,
        required: true
    },
    anoSaida: {
        type: Number,
        required: true
    },
    vitorias: {
        type: Number,
        default: 0,
        min: 0
    },
    imagemUrl: {
        type: String,
        default: '/uploads/house_item.png'
    },
    // para ordenação e eventual destaque especial
    ordem: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// índice para buscar por nome (slug) e por período
houseHistorySchema.index({ nome: 1 });
houseHistorySchema.index({ anoEntrada: 1, anoSaida: 1 });

module.exports = mongoose.model('HouseHistory', houseHistorySchema);