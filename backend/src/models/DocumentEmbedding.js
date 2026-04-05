const mongoose = require('mongoose');

const DocumentEmbeddingSchema = new mongoose.Schema({
    chunkText:      { type: String, required: true },
    sourceDocument: { type: String, required: true }, // Ex: 'enem_redacao_2023.pdf'
    categoria:      {
        type: String,
        enum: ['ENEM_REDACAO', 'ENEM_MATEMATICA', 'ENEM_LINGUAGENS',
               'ENEM_CIENCIAS_NATUREZA', 'ENEM_CIENCIAS_HUMANAS',
               'FINANCEIRO', 'REGRAS_SITE', 'GERAL'],
        default: 'GERAL'
    },
    pageNumber:     { type: Number, default: null },
    embedding:      { type: [Number], required: true }, // Vetor gerado pela Gemini Embeddings API
    // ⚠️ NÃO adicionar índice Mongoose aqui para o campo embedding.
    // O índice vetorial é criado diretamente no MongoDB Atlas via painel,
    // ou via script separado (ver Seção 3.4). Índice "2dsphere" está ERRADO.
}, { timestamps: true });

// Índices convencionais (não vetoriais)
DocumentEmbeddingSchema.index({ categoria: 1 });
DocumentEmbeddingSchema.index({ sourceDocument: 1 });

module.exports = mongoose.model('DocumentEmbedding', DocumentEmbeddingSchema);
