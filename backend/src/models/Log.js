const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    // Quem fez a ação (Pode ser Admin, Aluno ou Sistema)
    // Antes eu chamei de 'admin', agora voltei para 'user' pra não quebrar seu logger antigo
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null 
    },
    
    // NOVO: Quem sofreu a ação (Opcional, usado nos bloqueios/promoções)
    target: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Ação: Tirei o ENUM. Agora aceita qualquer texto ('BLOCK', 'LOGIN_SUCCESS', etc)
    action: {
        type: String,
        required: true
    },

    details: {
        type: String,
        required: true
    },

    // Campos técnicos (Mantive do seu antigo)
    ip: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', LogSchema);