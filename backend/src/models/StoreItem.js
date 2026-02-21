// backend/src/models/StoreItem.js
const mongoose = require('mongoose');
const { VALID_RARITIES } = require('../config/gameRules');

const StoreItemSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, required: true },
    imagem: { type: String, default: '/assets/store.png' },
    
    preco: { type: Number, required: true, min: 0 },
    estoque: { type: Number, default: -1 }, // -1 = Infinito
    
    // 🏷️ RANK / RARIDADE (Validado pelo gameRules)
   raridade: { 
        type: String, 
        default: 'Comum' 
    },
    // 📦 TIPO DO ITEM (Define o comportamento)
    tipo: {
        type: String,
        enum: ['ITEM', 'BUFF'], 
        default: 'ITEM'
    },

    // Se for BUFF, qual o efeito? (Ex: 'DUPLICADOR_PC')
    buffEffect: { type: String }, 

    // Validade Padrão (90 dias é o seu padrão)
    validadeDias: { type: Number, default: 90, min: 0 },

    // 🔒 PERMISSÕES E LOJAS
    cargoExclusivo: {
        type: String,
        enum: [
            'Todos',
            'Estudante Honorário',
            'Monitor de Disciplina',
            'Monitor da Escola',
            'Armada de Dumbledore',
            'Monitor da Biblioteca',
            'Monitor da Quadra',
            'Integrante da Banda',
            'Representante de Sala',
            'Colaborador'
        ],
        default: 'Todos'
    },

    lojaTematica: {
        type: String,
        enum: ['NENHUMA', 'VASSOURAS', 'VARINHAS', 'POCOES', 'MAROTO', 'MINISTERIO', 'MAGIC_BOOK'],
        default: 'NENHUMA'
    },

    // Flags Especiais
    isHouseItem: { type: Boolean, default: false }, // Beco Diagonal
    isSkill: { type: Boolean, default: false },     // Habilidade de Rank

    ativo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('StoreItem', StoreItemSchema);