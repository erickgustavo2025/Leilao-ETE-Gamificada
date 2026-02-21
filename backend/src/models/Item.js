const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    titulo: { type: String, required: true, trim: true },
    descricao: { type: String, required: true },
    imagemUrl: { type: String, required: true },
    lanceMinimo: { type: Number, required: true, min: 0 },
    dataFim: { type: Date, required: true },
    status: { type: String, enum: ['ativo', 'finalizado', 'entregue'], default: 'ativo' },
    validadeDias: { type: Number, default: 0 },

    // --- NOVOS CAMPOS DE SEGMENTAÇÃO ---
    // Ex: ['1', '2'] para 1º e 2º ano. Se vazio [], todos podem.
    seriesPermitidas: { type: [String], default: [] },
    // Ex: 'OURO'. Se vazio, qualquer rank.
    rankMinimo: { type: String, default: '' },
    // -----------------------------------
    isHouseItem: { type: Boolean, default: false },
    maiorLance: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        valor: { type: Number, default: 0 },
        data: { type: Date, default: Date.now }
    },
    ganhador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);