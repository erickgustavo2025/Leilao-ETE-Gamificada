const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// Ajuste o caminho para o seu .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixSortudoFinal() {
    try {
        console.log("🔌 Conectando ao MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        
        console.log("🔎 Buscando usuários...");
        const users = await User.find({}); // Pega todo mundo para garantir

        let count = 0;
        for (const user of users) {
            let hasChanged = false;
            
            // --- 1. RESGATAR DE BUFFS (Aba Status) ---
            if (user.activeBuffs && user.activeBuffs.length > 0) {
                // Procura qualquer buff com nome Sortudo
                const buffIndex = user.activeBuffs.findIndex(b => b.name && b.name.toLowerCase().includes('sortudo'));
                
                if (buffIndex > -1) {
                    console.log(`   ✨ Encontrado Buff em ${user.nome}. Convertendo para Skill...`);
                    
                    // Remove do Buff
                    user.activeBuffs.splice(buffIndex, 1);
                    
                    // Adiciona no Inventário (se já não tiver a skill)
                    const jaTemSkill = user.inventory.find(i => i.skillCode === 'SORTUDO' || i.name.includes('Sortudo (2x Chance)'));
                    
                    if (!jaTemSkill) {
                        user.inventory.push({
                            name: "Sortudo (2x Chance)",
                            image: "/assets/icons/clover.png", // (Use a imagem que preferir)
                            descricao: "Dobra a chance na roleta (3 usos trimestrais).",
                            rarity: "LENDÁRIO",
                            category: "RANK_SKILL", // Vai para aba Habilidades
                            skillCode: "SORTUDO",
                            usesLeft: 3,
                            usesMax: 3,
                            quantity: 1,
                            acquiredAt: new Date(),
                            origin: "MIGRACAO_BUFF"
                        });
                    }
                    hasChanged = true;
                }
            }

            // --- 2. CORRIGIR INVENTÁRIO (Caso esteja como Permanente) ---
            user.inventory.forEach(item => {
                const nome = (item.name || '').toLowerCase();
                
                // Se for o Sortudo do Rank (ignorando o da loja que chama 'sortudo(a)')
                if (nome.includes('sortudo') && !nome.includes('sortudo(a)')) {
                    
                    // Se não tiver cargas ou estiver na categoria errada
                    if (item.category !== 'RANK_SKILL' || !item.usesLeft) {
                        console.log(`   🛠️ Corrigindo item '${item.name}' no inventário de ${user.nome}...`);
                        
                        item.category = 'RANK_SKILL';
                        item.skillCode = 'SORTUDO';
                        item.usesLeft = 3;
                        item.usesMax = 3;
                        item.descricao = "Dobra a chance na roleta (3 usos trimestrais).";
                        
                        hasChanged = true;
                    }
                }
            });

            if (hasChanged) {
                user.markModified('inventory');
                user.markModified('activeBuffs');
                await user.save();
                count++;
                console.log(`   ✅ Usuário ${user.nome} atualizado!`);
            }
        }

        console.log(`\n🚀 FIM! ${count} usuários migrados de Buff para Skill.`);
        process.exit();
    } catch (error) {
        console.error("❌ Erro:", error);
        process.exit(1);
    }
}

fixSortudoFinal();