const mongoose = require('mongoose');

const RegulationSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['GENERAL', 'TEACHER'], 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    teacherName: { 
        type: String, 
        default: null 
    },
    blockedSkills: [{ 
        type: String // IDs ou códigos das skills bloqueadas
    }],
    blockedBenefits: [{ 
        type: String // IDs ou nomes dos benefícios bloqueados
    }],
    usageLimits: {
        maxDailySkills: { type: Number, default: null },
        preventConsecutiveSameSkill: { type: Boolean, default: false }
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Regulation', RegulationSchema);
