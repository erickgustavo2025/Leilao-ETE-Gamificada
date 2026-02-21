const mongoose = require('mongoose');

const punishmentSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['PUNIÇÃO', 'DECRETO', 'AVISO'], 
        default: 'PUNIÇÃO' 
    },
    reason: { type: String, required: true }, // O motivo (ex: "Uso indevido de magia")
    pointsDeducted: { type: Number, default: 0 }, // Quantos pontos a casa perdeu
    
    // Vínculos
    house: { type: String, required: true }, // A série da turma (ex: "3A DS")
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }, // Link direto pra sala
    
    targetAluno: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Se foi um aluno específico (opcional)
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Quem aplicou (Admin/Monitor)
    
    appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Punishment', punishmentSchema);