const mongoose = require('mongoose');

const trainingQuizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingQuiz',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['PENDENTE', 'CONCLUIDO'],
        default: 'PENDENTE'
    },
    performance: {
        type: Number // Em porcentagem (0-100)
    }
}, { timestamps: true });

// Índice para busca rápida de tentativas pendentes do usuário em um quiz específico
trainingQuizAttemptSchema.index({ userId: 1, quizId: 1, status: 1 });

module.exports = mongoose.model('TrainingQuizAttempt', trainingQuizAttemptSchema);
