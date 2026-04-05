const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const GameSkill = require('../models/GameSkill');

const MONGO_URI = process.env.MONGO_URI;

async function fix() {
    await mongoose.connect(MONGO_URI);
    
    // Força a mudança para ATIVA no banco de dados
    await GameSkill.updateMany(
        { name: { $regex: /Arrematador/i } }, 
        { $set: { type: 'ATIVA', usesMax: 3, resetPeriod: 'QUARTERLY' } }
    );
    
    console.log("✅ Arrematadores atualizados para ATIVA no Banco de Dados.");
    process.exit(0);
}
fix();