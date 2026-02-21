const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    valorOriginal: { type: Number, required: true }, // Quanto pegou
    valorDevido: { type: Number, required: true },   // Quanto tem que pagar (Original + 15%)
    taxaJuros: { type: Number, default: 0.15 },      // 15%
    status: { 
        type: String, 
        enum: ['PENDENTE', 'PAGO', 'ATRASADO'], 
        default: 'PENDENTE' 
    },
    dataVencimento: { type: Date, required: true },  // 7 dias depois
    dataPagamento: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);