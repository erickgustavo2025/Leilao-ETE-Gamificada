const mongoose = require('mongoose');

const DocumentEmbeddingSchema = new mongoose.Schema({
    chunkText:      { type: String, required: true },
    sourceDocument: { type: String, required: true }, // Ex: 'aula_01_robotica.pdf'
    fileId:         { type: String, required: true }, // Identificador único por arquivo carregado
    professorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: false }, // Opcional para docs globais
    disciplinaId:   { type: String, required: false }, // ID da disciplina associada
    categoria: {
        type: String,
        enum: [
            'ENEM_REDACAO', 'ENEM_MATEMATICA', 'ENEM_LINGUAGENS',
            'ENEM_CIENCIAS_NATUREZA', 'ENEM_CIENCIAS_HUMANAS',
            'FINANCEIRO', 'REGRAS_SITE', 'GERAL',
            'CONTEUDO_AULA', 'EXERCICIOS', 'GABARITO', 'MATERIAL_APOIO',
            'EMENTA'
        ],
        default: 'GERAL'
    },
    topico: { type: String, default: null }, // 🟢 NOVO: Assunto específico da ementa
    pageNumber:     { type: Number, default: null },
    ano:            { type: Number, required: false, min: 1, max: 3 }, // 1º, 2º ou 3º ano (Opcional para docs globais)
    trimestre:      { type: Number, required: false, min: 1, max: 3 }, // 1º, 2º ou 3º trimestre (Opcional para docs globais)
    embedding:      { type: [Number], required: true }, // Vetor gerado pela Gemini Embeddings API
}, { timestamps: true });

// Índices convencionais e compostos para filtragem no Vector Search
DocumentEmbeddingSchema.index({ categoria: 1 });
DocumentEmbeddingSchema.index({ ano: 1, trimestre: 1 });
DocumentEmbeddingSchema.index({ sourceDocument: 1 });
DocumentEmbeddingSchema.index({ disciplinaId: 1, professorId: 1, ano: 1, trimestre: 1 });
DocumentEmbeddingSchema.index({ fileId: 1 });

module.exports = mongoose.model('DocumentEmbedding', DocumentEmbeddingSchema);
