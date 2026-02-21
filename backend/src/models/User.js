// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// Sub-schema: Item Físico/Consumível/Skill
const InventoryItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
    
    // Identificador único da Skill (Ex: 'ROLETADA', 'VIP_CARD')
    skillCode: String, 

    // Snapshot para persistência
    name: String,
    descricao: String,
    
    // Imagens (Suporte híbrido)
    image: String,
    imagem: String,
    
    // Raridade
    rarity: String,
    raridade: String,

    // Categorização
    // ✅ RELATÓRIO: 'BUFF' adicionado ao enum para suportar multiplicadores
    category: {
        type: String,
        enum: ['CONSUMIVEL', 'PERMANENTE', 'RANK_SKILL', 'TICKET', 'ROULETTE', 'BUFF'],
        default: 'CONSUMIVEL', 
    },

    // Dados de Uso/Skill
    usesMax: { type: Number, default: 1 },
    usesLeft: { type: Number, default: 1 },
    resetPeriod: { type: String, enum: ['NEVER', 'QUARTERLY'], default: 'NEVER' },
    
    quantity: { type: Number, default: 1 },
    acquiredAt: { type: Date, default: Date.now },
    expiresAt: Date,
    
    origin: { type: String }
});

// Sub-schema: Buff Ativo (Efeito Passivo)
// ✅ RELATÓRIO: Schema blindado para suportar todos os campos necessários
const ActiveBuffSchema = new mongoose.Schema({
    effect: { type: String, required: true }, // Ex: 'DUPLICADOR', 'TRIPLICADOR'
    name: { type: String },                   // Nome exibido na UI (Ex: "Dobrador de PC$")
    image: { type: String },                  // Ícone exibido na aba Buffs
    expiresAt: { type: Date },               // Null = Eterno | Date = Temporário
    source: { type: String, default: 'LOJA' } // 'LOJA', 'RANK', 'ADMIN'
});

const userSchema = new mongoose.Schema({
    // --- IDENTIDADE ---
    matricula: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    senha: { type: String, select: false, default: null },
    nome: { type: String, required: true },
    dataNascimento: { type: String, required: true },
    turma: { type: String, required: true },
    avatar: { type: String, default: null },

    role: { type: String, enum: ['student', 'admin', 'monitor', 'dev'], default: 'student' },
    cargos: { type: [String], default: [] }, 

    isFirstAccess: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    isVip: { type: Boolean, default: false },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // --- ECONOMIA & GAMIFICAÇÃO ---
    saldoPc: { type: Number, default: 0 },
    maxPcAchieved: { type: Number, default: 0 },
    xp: { type: Number, default: 0 }, 

    // Regras do Oloko
    financialLimits: {
        receivedThisYear: { type: Number, default: 0 },
        lastResetYear: { type: Number, default: new Date().getFullYear() }
    },

    // 🎒 INVENTÁRIO
    inventory: [InventoryItemSchema],

    // ✨ BUFFS (Efeitos passivos)
    activeBuffs: [ActiveBuffSchema],

    // Histórico Roleta
    rouletteHistory: [{
        date: { type: Date, default: Date.now },
        source: String,
        prize: String
    }]

}, {
    collection: 'alunos',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- HOOKS ---
userSchema.pre('save', async function (next) {
    // 1. Atualiza Rank Histórico
    if (this.isModified('saldoPc')) {
        const currentMax = this.maxPcAchieved || 0;
        if (this.saldoPc > currentMax) {
            this.maxPcAchieved = this.saldoPc;
        }
    }

    // 2. Criptografa Senha
    if (this.isModified('senha') && this.senha) {
        const hash = await bcrypt.hash(this.senha, 8);
        this.senha = hash;
    }

    // ✅ RELATÓRIO: Limpeza automática de buffs expirados a cada save
    if (this.activeBuffs && this.activeBuffs.length > 0) {
        const now = new Date();
        const beforeCount = this.activeBuffs.length;
        this.activeBuffs = this.activeBuffs.filter(buff => {
            // Mantém buffs eternos (sem expiresAt) ou que ainda não expiraram
            return !buff.expiresAt || new Date(buff.expiresAt) > now;
        });
        // Só marca como modified se realmente removeu algo
        if (this.activeBuffs.length !== beforeCount) {
            this.markModified('activeBuffs');
        }
    }
});

module.exports = mongoose.model('User', userSchema);
