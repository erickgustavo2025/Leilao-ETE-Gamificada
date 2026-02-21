const mongoose = require('mongoose');

const RouletteItemSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    image: { type: String }, 
    type: { type: String, enum: ['PC', 'ITEM'], required: true },
    value: { type: Number }, 
    prizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
    isHouseItem: { type: Boolean, default: false }, 
    probability: { type: Number, required: true }, 
    rarity: { type: String, default: 'Comum' },
    
    // 🔥 OBRIGATÓRIO: Sem isso, a validade definida no admin nunca será salva
    validadeDias: { type: Number, default: 0 } 
});

const RouletteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['ROLETADA', 'SORTEIO'], required: true },
    cost: { type: Number, default: 0 },
    items: [RouletteItemSchema], 
    active: { type: Boolean, default: true },
    validUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Roulette', RouletteSchema);