const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// Procura o .env exatamente na pasta backend/
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function resetSkillCharges() {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error("A variável MONGO_URI não foi encontrada no arquivo .env");
        }

        await mongoose.connect(uri);
        console.log("🔋 Conectado ao MongoDB para reset de cargas...");

        // Busca todos os usuários que possuem skills no inventário
        const users = await User.find({ "inventory.category": "RANK_SKILL" });
        let totalResets = 0;

        for (let user of users) {
            let hasChanged = false;

            user.inventory.forEach(item => {
                if (item.category === 'RANK_SKILL') {
                    // Restaura as cargas para o máximo definido ou padrão 3
                    const maxCharges = item.usesMax || 3;
                    if (item.usesLeft !== maxCharges) {
                        item.usesLeft = maxCharges;
                        hasChanged = true;
                    }
                }
            });

            if (hasChanged) {
                user.markModified('inventory');
                await user.save();
                totalResets++;
            }
        }

        console.log(`✅ Sucesso! Cargas resetadas para ${totalResets} usuários.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao resetar cargas:", error);
        process.exit(1);
    }
}

resetSkillCharges();