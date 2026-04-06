const mongoose = require('mongoose');

const AIInteractionSchema = new mongoose.Schema({
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pergunta:     { type: String, required: true, maxlength: 5000 },
    resposta:     { type: String, required: true, maxlength: 15000 },
    modo:         { type: String, enum: ['SUPORTE', 'TUTOR', 'CONSULTOR', 'GERAL'], default: 'GERAL' },
    paginaOrigem: { type: String, required: true },
    avaliacaoAluno: { type: Number, min: 1, max: 5, default: null },

    // ── SNAPSHOT CIENTÍFICO ─────────────────────────────
    // Capturado no momento exato da interação via populate do User
    snapshotNotas: {
        n1_media:            { type: Number, min: 0, max: 10, default: null },
        n2_media:            { type: Number, min: 0, max: 10, default: null },
        redacao_media:       { type: Number, min: 0, max: 1000, default: null },
        simulado_enem_score: { type: Number, min: 0, max: 1000, default: null },
        saldoPc:             { type: Number, default: null },
        maxPcAchieved:       { type: Number, default: null },
        trimestre:           { type: String, default: null }, // Ex: '2026-T2'
    },

    // ── MÉTRICAS LONGITUDINAIS (preenchidas pelo CRON 30 dias depois) ──
    rendimentoDepois: {
        n1_media:            { type: Number, default: null },
        n2_media:            { type: Number, default: null },
        simulado_enem_score: { type: Number, default: null },
        saldoPc:             { type: Number, default: null },
        coletadoEm:          { type: Date, default: null },
    },

}, { timestamps: true });

AIInteractionSchema.index({ userId: 1, createdAt: -1 });
AIInteractionSchema.index({ modo: 1 });
AIInteractionSchema.index({ 'rendimentoDepois.coletadoEm': 1 }); // Para o CRON encontrar pendentes

module.exports = mongoose.model('AIInteraction', AIInteractionSchema);
