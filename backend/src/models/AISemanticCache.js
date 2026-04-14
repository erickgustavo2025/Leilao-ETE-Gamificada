// backend/src/models/AISemanticCache.js
const mongoose = require('mongoose');

const AISemanticCacheSchema = new mongoose.Schema({
    prompt: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        required: true
    },
    model: {
        type: String,
        default: 'gemini-1.5-flash'
    },
    disciplinaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disciplina',
        index: true
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Expira em 30 dias para manter a memória econômica e consistência pedagógica
    }
}, { timestamps: true });

// Índice para busca vetorial (necessário configurar no Atlas depois)
// O nome do índice no Atlas deve ser "vector_index_cache"
module.exports = mongoose.model('AISemanticCache', AISemanticCacheSchema);
