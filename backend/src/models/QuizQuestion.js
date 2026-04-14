const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
    },
    disciplinaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disciplina',
        required: true
    },
    ano: {
        type: String,
        required: true,
        enum: ['1', '2', '3']
    },
    pergunta: {
        type: String,
        required: true,
        trim: true
    },
    opcoes: [{
        type: String,
        required: true
    }],
    respostaCorreta: {
        type: Number, // Índice (0-3 ou 0-4)
        required: true
    },
    explicacao: {
        type: String, // Texto da IA explicando o porquê da resposta
        trim: true
    },
    dificuldade: {
        type: String,
        enum: ['FACIL', 'MEDIO', 'DIFICIL'],
        default: 'MEDIO'
    },
    origem: {
        type: String,
        enum: ['IA', 'PROFESSOR'],
        default: 'IA'
    },
    tags: [String], // ex: ['Biologia', 'Célula']
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices para busca rápida no dashboard
QuizQuestionSchema.index({ disciplinaId: 1, ativo: 1 });
QuizQuestionSchema.index({ professorId: 1 });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
