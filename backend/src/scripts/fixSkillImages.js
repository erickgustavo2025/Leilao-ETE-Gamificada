const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// 1. Configura o dotenv para pegar o arquivo .env na raiz do backend (duas pastas acima)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 2. Importa os Models e Configs com o caminho ajustado para estar dentro de src/scripts
// Sobe um nível (..) para cair em 'src', e então acessa 'models' ou 'config'
const GameSkill = require('../models/GameSkill'); 
const SKILLS_CATALOG = require('../config/skills');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Erro: MONGO_URI não encontrada no .env!");
    process.exit(1);
}

async function fixImages() {
    try {
        console.log('🔌 Conectando ao Mongo...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado!');

        const skills = await GameSkill.find({});
        let count = 0;

        for (const skill of skills) {
            // Normaliza o nome para encontrar no catálogo (remove espaços extras, etc)
            // Tenta achar a definição no catálogo pelo NOME (chave mais confiável)
            const catalogEntry = Object.values(SKILLS_CATALOG).find(c => c.name === skill.name);

            if (catalogEntry && catalogEntry.image) {
                // Se a imagem no banco for diferente da imagem "nova" do catálogo (/uploads/...)
                // OU se a imagem no banco ainda for a antiga (/assets/...)
                if (skill.image !== catalogEntry.image) {
                    console.log(`🔧 Atualizando: ${skill.name}`);
                    console.log(`   🔴 Antes: ${skill.image}`);
                    console.log(`   🟢 Depois: ${catalogEntry.image}`);
                    
                    skill.image = catalogEntry.image;
                    
                    // Garante outros campos importantes também
                    if (catalogEntry.type) skill.type = catalogEntry.type;
                    if (catalogEntry.desc) skill.description = catalogEntry.desc;
                    if (catalogEntry.uses) skill.usesMax = catalogEntry.uses;
                    if (catalogEntry.reset) skill.resetPeriod = catalogEntry.reset;

                    await skill.save();
                    count++;
                }
            } else {
                console.warn(`⚠️ Skill não encontrada no catálogo novo: ${skill.name}`);
            }
        }

        console.log(`\n🎉 Processo finalizado! ${count} skills foram atualizadas.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro fatal:", error);
        process.exit(1);
    }
}

fixImages();