const mongoose = require('mongoose');

const SurveyResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, // Suporta String, Number, ou Array
        required: true
    },
    respondedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Garante que o usuário só responda uma vez por pesquisa
SurveyResponseSchema.index({ userId: 1, surveyId: 1 }, { unique: true });

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema);
