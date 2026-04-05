const mongoose = require('mongoose');

const GiftBoxSchema = new mongoose.Schema({
    // ... outros campos (titulo, etc) ...
    titulo: { type: String, required: true },
    descricao: { type: String },
    active: { type: Boolean, default: true },
    turmasPermitidas: [{ type: String }],
    rankMinimo: { type: String, default: "Iniciante" },
    limitePorUsuario: { type: Number, default: 1 },
    permitirBonusVip: { type: Boolean, default: false },
    dataExpiracao: { type: Date },
    isDoavel: { type: Boolean, default: false },
    recompensaPc: { type: Number, default: 0 },

    // 👇 AQUI A MUDANÇA
    recompensaItens: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
        quantidade: { type: Number, default: 1 },
        validadeValor: { type: Number, default: 0 }, // Mudado de 'validadeEmDias' pra 'validadeValor'
        unidadeValidade: { type: String, enum: ['MINUTOS', 'HORAS', 'DIAS'], default: 'DIAS' } // Novo campo
    }],

    claims: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        data: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('GiftBox', GiftBoxSchema);