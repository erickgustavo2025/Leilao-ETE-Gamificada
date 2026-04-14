const mongoose = require('mongoose');

const TrainingQuizSchema = new mongoose.Schema({
    disciplinaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disciplina',
        required: true
    },
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor'
    },
    titulo: { type: String, required: true },
    topico: { type: String, required: true }, // Deve bater com um dos assuntos da ementa
    trimestre: { type: Number, required: true, min: 1, max: 3 },
    
    questoes: [{
        pergunta: { type: String, required: true },
        alternativas: [{ type: String, required: true }],
        respostaCorreta: { type: Number, required: true }, // Index da alternativa
        explicacao: { type: String } // Por que essa é a correta? (A IA usa isso p/ ensinar)
    }],
    
    recompensa: { type: Number, default: 10 },
    dificuldade: { 
        type: String, 
        enum: ['FACIL', 'MEDIO', 'DIFICIL'], 
        default: 'MEDIO'
    },
    
    // Controle de quem já completou (p/ evitar farm de PC$)
    concluidoPor: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        data: { type: Date, default: Date.now }
    }],
    
    ativa: { type: Boolean, default: true },
    isAiGenerated: { type: Boolean, default: false } // <--- NOVO: Rastreio de IA
}, {
    timestamps: true
});

module.exports = mongoose.model('TrainingQuiz', TrainingQuizSchema);
