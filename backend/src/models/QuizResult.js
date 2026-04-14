const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
    alunoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
    },
    disciplinaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disciplina',
        required: true
    },
    acertou: {
        type: Boolean,
        required: true
    },
    respostaDada: {
        type: Number, // Índice da opção selecionada
        required: true
    },
    tempoResposta: {
        type: Number, // Segundos para responder
        default: 0
    },
    tentativas: {
        type: Number,
        default: 1
    },
    recompensa: {
        xp: { type: Number, default: 0 },
        saldoPc: { type: Number, default: 0 }
    },
    tipoInteracao: {
        type: String,
        enum: ['IA_GENERATIVE', 'FIXED_BANK'],
        default: 'IA_GENERATIVE'
    },
    // --- SNAPSHOT ANALYTICS (PJC) ---
    // Captura o estado do aluno no momento da resposta para correlação futura
    snapshot: {
        xpAtual: Number,
        saldoAtual: Number,
        trimestre: String
    }
}, {
    timestamps: true
});

// Índices para o Dashboard de Analytics do Professor
QuizResultSchema.index({ disciplinaId: 1, createdAt: -1 });
QuizResultSchema.index({ alunoId: 1, questionId: 1 });

module.exports = mongoose.model('QuizResult', QuizResultSchema);
