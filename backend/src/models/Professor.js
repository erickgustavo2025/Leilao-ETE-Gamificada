const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    usuario: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    senha: {
        type: String,
        required: true,
        select: false
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'professor',
        enum: ['professor']
    },
    // Vínculos multidisciplinares do professor
    disciplinas: [{
        disciplinaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Disciplina',
            required: true
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
        turmas: [{
            type: String, // ex: ['3A', '3B']
            required: true
        }],
        isRedacao: {
            type: Boolean,
            default: false
        }
    }],
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// --- HOOKS ---
professorSchema.pre('save', async function () {
    if (!this.isModified('senha')) return;
    
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        this.senha = await bcrypt.hash(this.senha, salt);
    } catch (err) {
        throw err;
    }
});

module.exports = mongoose.model('Professor', professorSchema);
