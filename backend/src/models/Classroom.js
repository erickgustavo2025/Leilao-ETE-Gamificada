const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    serie: { type: String, required: true, unique: true, trim: true },
    logo: { type: String, default: '/assets/etegamificada.png' },
    cor: { type: String, default: '#3b82f6' },
    descricao: { type: String, default: '' },

    // 🏆 PONTUAÇÃO DA TAÇA DAS CASAS
    pontuacaoAtual: { type: Number, default: 0 },
    pontosHistorico: { type: Number, default: 0 },

    // 🎒 MOCHILA DA SALA
    roomInventory: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
        name: String,
        image: String,
        description: String,
        category: String,
        quantity: { type: Number, default: 1 },
        acquiredAt: { type: Date, default: Date.now },
        
        // 🔥 ESSENCIAL PARA VALIDADE
        expiresAt: { type: Date },

        // 🏷️ ORIGEM CORRIGIDA
        origin: { 
            type: String, 
            enum: [
                'COMPRA_COLETIVA', 
                'PRESENTE', 
                'PREMIO', 
                'COMPRA_INDIVIDUAL', 
                'TICKET_CANCELADO', 
                'ROULETTE', 
                'LEILAO',
                'TRADE',          
                'MARKETPLACE'     
            ],
            default: 'COMPRA_INDIVIDUAL'
        },

        acquiredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);