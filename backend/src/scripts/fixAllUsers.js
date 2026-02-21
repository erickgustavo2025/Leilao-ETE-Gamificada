require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StoreItem = require('../models/StoreItem');
const skillService = require('../services/skillService'); 
const { RANK_SKILLS } = require('../config/gameRules');
const SKILLS_CATALOG = require('../config/skills');
const path = require('path');

// Garante o .env correto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixAll() {
    try {
        console.log("🔌 Conectando...");
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log("✅ Conectado! Iniciando OPERAÇÃO DE RESGATE E ALINHAMENTO...");

        const users = await User.find({});
        let count = 0;

        // Lista de códigos que são PASSIVAS (para remover da mochila se estiverem lá erradas)
        // O SORTUDO agora é ATIVA, então ele NÃO entra nessa lista de exclusão!
        const passiveCodes = Object.keys(SKILLS_CATALOG).filter(k => SKILLS_CATALOG[k].type === 'PASSIVA');

        for (const user of users) {
            let changed = false;

            // 1. GARANTIR PC MÁXIMO (Para não perder Rank)
            if (user.maxPcAchieved === undefined || user.maxPcAchieved < user.saldoPc) {
                user.maxPcAchieved = user.saldoPc || 0;
                changed = true;
            }

            // 2. 🚑 CIRURGIA NO SORTUDO (Alinhar para SUPREMO)
            user.inventory.forEach(item => {
                const nome = (item.name || '').toLowerCase();
                
                // Se for o Sortudo (ignorando o da loja que chama 'sortudo(a)')
                if (item.skillCode === 'SORTUDO' || (nome.includes('sortudo') && !nome.includes('sortudo(a)'))) {
                    
                    // Força a Raridade SUPREMO para alinhar no front
                    if (item.rarity !== 'SUPREMO' || item.category !== 'RANK_SKILL' || item.usesMax !== 3) {
                        // console.log(`   ✨ Promovendo Sortudo para SUPREMO no user ${user.nome}...`);
                        
                        item.name = "Sortudo (2x Chance)";
                        item.rarity = "SUPREMO";       // 🔥 AQUI QUE ALINHA NO FRONT
                        item.category = "RANK_SKILL";  // Garante aba Habilidades
                        item.skillCode = "SORTUDO";
                        item.descricao = "Dobra a chance na roleta (3 usos trimestrais).";
                        item.usesMax = 3;
                        
                        // Se estiver sem cargas ou zerado, reseta pra 3 (opcional, pode tirar se quiser manter o gasto)
                        if (item.usesLeft === undefined || item.usesLeft === null) item.usesLeft = 3;
                        
                        changed = true;
                    }
                }
            });

            // 3. LIMPEZA DE PASSIVAS (Remove skills passivas da aba de Itens/Habilidades)
            // Elas devem ficar apenas na aba STATUS (activeBuffs)
            const prevLen = user.inventory.length;
            user.inventory = user.inventory.filter(item => {
                // Se for item de loja, mantém
                if (item.category !== 'RANK_SKILL') return true;
                
                // Se for Sortudo, MANTÉM (agora é ativa)
                if (item.skillCode === 'SORTUDO') return true;

                // Se for passiva, remove (o skillService vai recriar no lugar certo)
                if (item.skillCode && passiveCodes.includes(item.skillCode)) return false; 
                
                return true;
            });
            if (user.inventory.length !== prevLen) changed = true;

            // 4. REPARO DE ITENS DA LOJA (Visual)
            for (const item of user.inventory) {
                if (item.category === 'CONSUMIVEL' && item.itemId) {
                    if (!item.rarity || item.rarity === 'Comum') { 
                        // Tenta recuperar do banco se tiver ID
                        // (Lógica simplificada pra não travar o script)
                        item.rarity = 'Evento'; // Valor seguro default se não achar
                        changed = true; 
                    }
                }
            }

            // 5. SINCRONIA FINAL (Recalcula quais skills o aluno merece pelo Rank)
            if (skillService && skillService.syncRankSkills) {
                const skillsUpdated = await skillService.syncRankSkills(user);
                if (skillsUpdated) changed = true;
            }

            if (changed) {
                // Avisa o Mongoose que mexemos profundamente nos arrays
                user.markModified('inventory');
                user.markModified('activeBuffs');
                
                await user.save();
                process.stdout.write('🛠️'); // Martelo = Consertado
                count++;
            } else {
                process.stdout.write('.');
            }
        }

        console.log(`\n\n✅ FIM! ${count} usuários foram alinhados e corrigidos.`);
        process.exit(0);

    } catch (error) {
        console.error("\n❌ ERRO:", error);
        process.exit(1);
    }
}

fixAll();