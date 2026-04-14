const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
    // Chave principal
    key: { type: String, default: 'general', unique: true },
    
    // --- 🎨 IDENTIDADE VISUAL (NOVOS) ---
    siteName: { type: String, default: 'ETE GAMIFICADA' }, 
    logoUrl: { type: String, default: '/assets/etegamificada.png' },
    landingMessage: { type: String, default: 'Transformando educação em conquista.' },

    // --- ⚙️ SISTEMA (EXISTENTES) ---
    currentYear: { type: Number, default: new Date().getFullYear() },
    currentTrimester: { type: Number, default: 1, min: 1, max: 3 }, // 🟢 NOVO: Controla o Oráculo e Resets
    vipCode: { type: String, default: 'VIP-2026' },

    // BLOQUEIOS
    maintenanceMode: { type: Boolean, default: false }, // Bloqueio Parcial
    lockdownMode: { type: Boolean, default: false },    // Bloqueio Total
    houseCupVisible: { type: Boolean, default: true }, 
    becoDiagonalOpen: { type: Boolean, default: true }, 

    // 🔥 CONTROLE DE MÓDULOS (UNIFICADO E BLINDADO) 🔥
    modules: {
        // Módulos Core
        leilao: { active: { type: Boolean, default: true } },
        pontos: { active: { type: Boolean, default: true } },
        beco: { active: { type: Boolean, default: false } },
        notas: { active: { type: Boolean, default: false } },
        
        // Módulos "Em Breve"
        gilbet: { type: Boolean, default: false }, 
        gincana: { type: Boolean, default: false },
        leiturarte: { type: Boolean, default: false }
    },

    archivedYears: [{ type: Number }]
}, { 
    collection: 'system_config',
    timestamps: true // Adiciona createdAt/updatedAt automaticamente
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);