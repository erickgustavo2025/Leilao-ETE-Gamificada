const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    remetente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destinatario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    valorBruto: { type: Number, required: true }, // Quanto saiu da conta
    taxa: { type: Number, default: 0 }, // Quanto o sistema comeu
    valorLiquido: { type: Number, required: true }, // Quanto chegou
    tipo: { type: String, enum: ['TRANSFERENCIA', 'PAGAMENTO', 'SISTEMA', 'INVESTMENT_BUY', 'INVESTMENT_SELL', 'DIVIDENDO', 'COMPRA_LOJA', 'COMPRA_NOTA', 'MARKETPLACE'], default: 'TRANSFERENCIA' },
    assetSymbol: { type: String },
    assetType: { type: String, enum: ['STOCK', 'CRYPTO', 'STARTUP'] },
    quantity: { type: Number },
    priceAtTime: { type: Number },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);