const mongoose = require('mongoose');
const path = require('path');
// Carrega o .env da raiz do backend
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User'); 

// Definição da Skill
const VIP_CARD_DEF = {
    id: "VIP_CARD",
    name: "💳 VIP Card",
    description: "Acesso a empréstimos no banco.",
    image: "/assets/vip_card.png",
    type: "ATIVA",
    uses: 3,
    maxUses: 3,
    resetPeriod: "QUARTERLY",
    dataAquisicao: new Date()
};

const migrate = async () => {
    try {
        console.log("🔌 Conectando ao MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        console.log("🔍 Buscando usuários com VIP_CARD em activeBuffs...");
        const users = await User.find({ "activeBuffs.effect": "VIP_CARD" });
        
        console.log(`📋 Encontrados ${users.length} usuários para migrar.`);

        let successCount = 0;

        for (const user of users) {
            // 🔥 CORREÇÃO DE SEGURANÇA: Garante que o array skills existe
            if (!user.skills) {
                user.skills = [];
            }

            // Remove de 'activeBuffs' filtrando pelo 'effect'
            // (Garanta que activeBuffs também existe, por via das dúvidas)
            if (user.activeBuffs) {
                user.activeBuffs = user.activeBuffs.filter(b => b.effect !== 'VIP_CARD');
            }

            // Verifica se já tem a Skill para não duplicar
            const hasSkill = user.skills.find(s => s.id === 'VIP_CARD');

            if (!hasSkill) {
                // Adiciona na lista de Skills
                user.skills.push(VIP_CARD_DEF);
                
                await user.save();
                successCount++;
                // Log mais limpo pra não poluir se forem muitos
                if (successCount % 10 === 0) console.log(`🔄 Progresso: ${successCount}/${users.length} migrados...`);
            } else {
                await user.save(); // Salva a remoção do buff mesmo se já tiver a skill
            }
        }

        console.log(`\n🚀 Migração finalizada! ${successCount} usuários atualizados.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro fatal na migração:", error);
        process.exit(1);
    }
};

migrate();