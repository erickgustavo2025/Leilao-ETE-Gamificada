const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI não encontrada!");
    process.exit(1);
}

async function resetSkills() {
    try {
        console.log('🔌 Conectando ao Mongo...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado!');

        const users = await User.find({});
        let count = 0;

        for (const user of users) {
            // 1. Remove todas as skills de Rank do inventário (para recriar limpo depois)
            // Mantém itens CONSUMIVEL (comprados na loja) e PERMANENTE (custom)
            const initialLength = user.inventory.length;
            
            user.inventory = user.inventory.filter(item => item.category !== 'RANK_SKILL');
            
            // Também limpa os buffs ativos que vieram de Rank para garantir
            user.activeBuffs = user.activeBuffs.filter(buff => buff.source !== 'RANK');

            if (user.inventory.length !== initialLength) {
                console.log(`🧹 Limpando skills de: ${user.nome}`);
                await user.save();
                count++;
            }
        }

        console.log(`\n🎉 Limpeza concluída! ${count} usuários tiveram skills resetadas.`);
        console.log("👉 No próximo login, o sistema irá recriar as skills com os dados novos do Banco.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro fatal:", error);
        process.exit(1);
    }
}

resetSkills();