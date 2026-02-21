// ARQUIVO: backend/src/models/GameSkill.js
const mongoose = require('mongoose');

const GameSkillSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, 
    description: { type: String, required: true },
    
    // 🔥 CORREÇÃO: Removemos o '/assets/store.png' que não existe mais.
    // Deixamos vazio. Se não tiver imagem, o Front usa o ícone padrão.
    image: { type: String, default: '' }, 
    
    rarity: { type: String, required: true }, 
    type: { type: String, default: 'PASSIVE' }, 
    
    // Regras de Uso
    usesMax: { type: Number, default: 3 },
    resetPeriod: { type: String, enum: ['NEVER', 'MONTHLY', 'QUARTERLY'], default: 'QUARTERLY' },
    
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('GameSkill', GameSkillSchema);