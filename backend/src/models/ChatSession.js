const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        role: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },

        // ── CAMPOS ESSENCIAIS PARA O RAG E FEEDBACK ──
        interactionId: { type: String }, // O ID único que o uuidv4 gera
        userRating: { type: Number, default: 0 }, // Onde as estrelas são salvas
        modo: { type: String }, // TUTOR, CONSULTOR ou SUPORTE

        timestamp: { type: Date, default: Date.now }
    }],
    paginaOrigem: { type: String },
    title: { type: String, default: 'Nova Conversa' },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Índice TTL de 7 dias (604800 segundos)
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
// Índice para busca rápida de mensagens específicas no feedback
ChatSessionSchema.index({ "messages.interactionId": 1 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);