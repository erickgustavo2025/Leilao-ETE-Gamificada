// ARQUIVO: backend/src/models/Quest.js
const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['DIARIA', 'SEMANAL', 'EPICA', 'SECRETA'],
        required: true
    },
    // COMO O ALUNO PROVA QUE FEZ A MISSÃO?
    validationMethod: {
        type: String,
        enum: ['AUTO', 'SECRET_CODE', 'MANUAL_ADMIN'],
        default: 'MANUAL_ADMIN'
        // AUTO: O sistema detecta (ex: logou 3 dias seguidos).
        // SECRET_CODE: O professor dá um código na lousa e o aluno digita no site.
        // MANUAL_ADMIN: O aluno clica em "Fiz" e vai pra uma fila pro Admin aprovar.
    },
    validCodes: [{
        code: { type: String },
        isUsed: { type: Boolean, default: false },
        usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // A RECOMPENSA (ECA Digital)
    rewards: {
        pc: { type: Number, default: 0 }, // Sobe o saldoPc E o maxPcAchieved ao mesmo tempo!
        badgeId: { type: String } // Opcional: Ganha um cargo/emblema especial (ex: 'cientista_júnior')
    },

    minRank: { type: Number, default: 1 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quest', questSchema);