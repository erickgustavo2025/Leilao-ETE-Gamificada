const mongoose = require('mongoose');

const EngagementMetricSchema = new mongoose.Schema({
    // Data de referência (sem hora para garantir unicidade diária)
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },

    // 🕵️ Presença Passiva: Apenas abriu o site (Visitante)
    passiveVisits: {
        type: Number,
        default: 0
    },

    // 🔑 Presença Ativa: Fez login no sistema (Participante)
    activeLogins: {
        type: Number,
        default: 0
    },

    // 📈 Pico Live do dia: Maior número de conexões simultâneas detectadas
    livePeak: {
        type: Number,
        default: 0
    },

    // 🏦 Economia: Total de PC$ em circulação no snapshot do dia
    totalPcCirculation: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EngagementMetric', EngagementMetricSchema);
