const mongoose = require('mongoose');

const GilEmpresaSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    tag: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true, 
        trim: true 
    },
    descricao: { 
        type: String, 
        required: true 
    },
    fundador: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    socios: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        porcentagem: { type: Number, min: 0, max: 100 }
    }],
    valuationInicial: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    totalAcoes: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    acoesDisponiveis: { 
        type: Number, 
        default: 0 
    },
    valorPorAcao: { 
        type: Number, 
        default: 0 
    },
    performanceAcademica: { 
        type: Number, 
        default: 100, // Escala 0-100 ou multiplicador
        min: 0 
    },
    status: { 
        type: String, 
        enum: ['INCUBACAO', 'OPERACIONAL', 'IPO_PENDENTE', 'LISTADA', 'FALIDA', 'REJEITADA'], 
        default: 'INCUBACAO' 
    },
    logo: { 
        type: String, 
        default: null 
    }
}, { timestamps: true });

// Índices para busca rápida
// O índice único em 'tag' já é criado pelo unique: true no schema.
GilEmpresaSchema.index({ fundador: 1 });

module.exports = mongoose.model('GilEmpresa', GilEmpresaSchema);
