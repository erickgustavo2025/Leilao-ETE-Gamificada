const mongoose = require('mongoose');

const examLockSchema = new mongoose.Schema({
    turmaId: {
        type: String, // Nome da turma (ex: '3AADM', '1ATI')
        required: true
    },
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
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'concluido'],
        default: 'ativo'
    },
    mensagem: {
        type: String,
        default: 'Avaliação em andamento. O acesso à plataforma está temporariamente restrito para sua turma.'
    }
}, {
    timestamps: true
});

// Index para busca rápida durante o login
examLockSchema.index({ turmaId: 1, status: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('ExamLock', examLockSchema);
