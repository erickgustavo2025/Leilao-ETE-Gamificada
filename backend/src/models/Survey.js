const mongoose = require('mongoose');

const SurveyQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'rating', 'multiple_choice', 'checkbox', 'boolean'], 
        required: true 
    },
    options: [String], // Apenas para multiple_choice e checkbox
    required: { type: Boolean, default: true }
});

const SurveySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    rewardAmount: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    category: { 
        type: String, 
        enum: ['education', 'financial', 'performance', 'general'], 
        default: 'general' 
    },
    questions: [SurveyQuestionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Survey', SurveySchema);
