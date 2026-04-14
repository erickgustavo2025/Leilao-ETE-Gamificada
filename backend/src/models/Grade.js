const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    alunoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    n1: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        default: 0
    },
    n2: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        default: 0
    },
    trimestre: {
        type: Number,
        required: true,
        enum: [1, 2, 3]
    },
    tipo: {
        type: String,
        required: true,
        enum: ['REGULAR', 'REDACAO'],
        default: 'REGULAR'
    },
    turma: {
        type: String, // ex: "3A", "3B"
        required: true
    }
}, {
    timestamps: true
});

// Índice para evitar duplicidade de notas do mesmo aluno/disciplina/trimestre/tipo
gradeSchema.index({ alunoId: 1, disciplinaId: 1, trimestre: 1, tipo: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
