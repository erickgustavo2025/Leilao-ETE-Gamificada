const mongoose = require('mongoose');

const TeacherSurveyResponseSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
    },
    disciplinaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disciplina'
    },
    mesReferencia: {
        type: String, // format: "YYYY-MM"
        required: true
    },
    respostas: [{
        pergunta: String,
        nota: Number // 1-10
    }],
    comentariosGerais: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Índice para evitar múltiplas respostas no mesmo mês
TeacherSurveyResponseSchema.index({ professorId: 1, mesReferencia: 1 }, { unique: true });

module.exports = mongoose.model('TeacherSurveyResponse', TeacherSurveyResponseSchema);
