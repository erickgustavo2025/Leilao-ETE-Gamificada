// ARQUIVO: backend/src/models/HouseAction.js
const mongoose = require('mongoose');

const HouseActionSchema = new mongoose.Schema({
    turma: { type: String, required: true }, // "3A DS"
    tipo: { type: String, enum: ['GANHO', 'PUNICAO', 'COMPRA', 'BONUS' ], required: true },
    valor: { type: Number, required: true }, // Pode ser negativo
    motivo: { type: String, required: true }, // "Venceu Quadribol", "Punição Dolores - Leve"
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Quem aplicou (Admin/Monitor)
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HouseAction', HouseActionSchema);