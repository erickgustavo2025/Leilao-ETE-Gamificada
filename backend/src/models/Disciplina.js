const mongoose = require('mongoose');

const disciplinaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    professor: {
        type: String,
        required: true,
        trim: true
    },
    ano: {
        type: String,
        required: true,
        enum: ['1', '2', '3']
    },
    curso: {
        type: String,
        required: true,
        enum: ['ADM', 'DS', 'COMUM']
    },
    precoN1: {
        type: Number,
        default: 1000
    },
    precoN2: {
        type: Number,
        default: 1200
    },
    ativa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Disciplina', disciplinaSchema);
