const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    matricula: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nome: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true
    },
    senha: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'dev'],
        default: 'admin'
    }
}, {
    timestamps: true,
    collection: 'admins'
});

module.exports = mongoose.model('Admin', AdminSchema);