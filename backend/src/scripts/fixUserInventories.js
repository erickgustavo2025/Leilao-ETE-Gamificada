// ARQUIVO: backend/src/scripts/fixUserInventories.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const GameSkill = require('../models/GameSkill'); // 🔥 IMPORTAMOS A FONTE DO PROBLEMA

async function run() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Conectado! Iniciando Faxina Global (GameSkills + Usuários)...\n');

        // ==========================================
        // ⚔️ FASE 1: A FONTE DA VERDADE (GameSkills)
        // ==========================================
        const skills = await GameSkill.find({});
        let skillsUpdated = 0;
        for (let skill of skills) {
            if (skill.image && skill.image.includes('.png')) {
                skill.image = skill.image.replace('.png', '.webp');
                await skill.save();
                skillsUpdated++;
            }
        }
        console.log(`🎯 Fonte da Verdade corrigida: ${skillsUpdated} GameSkills atualizadas para .webp.`);


        // ==========================================
        // 🎒 FASE 2: OS INVENTÁRIOS (Users)
        // ==========================================
        const users = await User.find({});
        let updatedCount = 0;
        let deletedRouletteCount = 0;

        for (let user of users) {
            let needsSave = false;

            // 🗑️ Exterminar 'ROULETTE'
            if (user.inventory && user.inventory.length > 0) {
                const originalLength = user.inventory.length;
                user.inventory = user.inventory.filter(item => item.category !== 'ROULETTE');
                if (user.inventory.length < originalLength) {
                    deletedRouletteCount += (originalLength - user.inventory.length);
                    needsSave = true;
                }
            }

            // 🖼️ Migrar inventário
            if (user.inventory && user.inventory.length > 0) {
                user.inventory.forEach(item => {
                    if (item.image && item.image.includes('.png')) {
                        item.image = item.image.replace('.png', '.webp');
                        needsSave = true;
                    }
                });
            }

            // 🖼️ Migrar buffs
            if (user.activeBuffs && user.activeBuffs.length > 0) {
                user.activeBuffs.forEach(buff => {
                    if (buff.image && buff.image.includes('.png')) {
                        buff.image = buff.image.replace('.png', '.webp');
                        needsSave = true;
                    }
                });
            }

            if (needsSave) {
                await user.save({ validateBeforeSave: false });
                updatedCount++;
            }
        }

        console.log(`\n🎉 FAXINA ABSOLUTA CONCLUÍDA!`);
        console.log(`🗑️ Itens 'ROULETTE' deletados: ${deletedRouletteCount}`);
        console.log(`🖼️ Alunos atualizados para .webp: ${updatedCount}`);
        console.log(`🛡️ O Cabo de Guerra acabou. O skillService.js agora espalhará .webp para todos!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        process.exit(1);
    }
}

run();