const mongoose = require('mongoose');

const RankBenefitSchema = new mongoose.Schema({
    rank: { 
        type: String, 
        required: true, 
        unique: true, 
        enum: [
            'BRONZE', 'PRATA', 'OURO', 'DIAMANTE', 
            'ÉPICO', 
            'ÉPICO LENDÁRIO', 
            'ÉPICO SUPREMO',  
            'ÉPICO MITHOLÓGICO', // 👈 CORRIGIDO: TH mantido!
            'ÉPICO SOBERANO'
        ]
    },
    minPc: { type: Number, required: true },
    benefits: { type: [String], default: [] },
    icon: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('RankBenefit', RankBenefitSchema);