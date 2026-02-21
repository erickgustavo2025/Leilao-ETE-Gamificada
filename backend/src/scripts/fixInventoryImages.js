const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente da raiz
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User'); // Ajuste o caminho se necessário

// MAPA DE DE-PARA (O mesmo que usamos antes, mas aplicado ao inventário)
const IMAGE_MAP = {
    // Skills e Itens Gerais
    'ajuda divina': '/uploads/ajudadivina.png',
    'sorteio diamante': '/uploads/sorteio.png',
    'treinamento épico': '/uploads/Treinamentoepico.png',
    'redução de dano': '/uploads/Reducao de dano.png',
    'áurea do saber': '/uploads/aureadosaber.png',
    'invisibilidade': '/uploads/Invisibilidade.png',
    'converter pc$ em nota': '/uploads/PCSNota.png',
    'redução de dano aprimorada': '/uploads/redcdedanoapri.png',
    'invisibilidade aprimorada': '/uploads/Invisibilidade Aprimorada.png',
    'essência do saber': '/uploads/essencia.png',
    'treinamento épico avançado': '/uploads/treinamentoepicoanvanc.png',
    'ajuda suprema': '/uploads/Ajuda Suprema.png',
    'ressuscitar': '/uploads/Ressuscitar.png',
    'ajuda divina ilimitada': '/uploads/Ajuda Divina Ilimitada.png',
    'redução de dano absoluta': '/uploads/reducaodedanoabsoluta.png',
    'conceder ressuscitar': '/uploads/conceder.png',
    'presente dos deuses': '/uploads/presentedosdeuses.png',
    'transf. conhecimento': '/uploads/saber.png',
    'círculo de cura': '/uploads/circulodecura.png',
    'ajuda soberana': '/uploads/ajuda soberana.png',
    'poder da fênix': '/uploads/poderdafenix.png',
    'roletada grátis': '/uploads/roletada.png',
    'canalizador de mana': '/uploads/canalisador.png',
    'pedra da fênix': '/uploads/pedra.png',
    'sortudo': '/uploads/Sortudo.png',
    'vip card': '/uploads/vip card.png',
    'arrematador de leilões': '/uploads/arrematadordeleiloes.png',
    'arrematador aprimorado': '/uploads/ArrematadordeLeiloesAprimorado.png',
    'dobrador de pc$': '/uploads/dobrador de pc.png',
    'triplicador de pc$': '/uploads/Triplicador.png',
    'gilbet premium': '/uploads/ticket.png',
    'essência da fênix': '/uploads/Penadefenix.png',
    'imortal do classcraft': '/uploads/Imortal do Classcraft.png',
    'imunidade atraso': '/uploads/Imunidade.png',
    'brinde épico': '/uploads/brindepico.png',
    'mina de diamantes': '/uploads/Mina.png',
    'plano estudo gamificado': '/uploads/plano gamificado.png',
    'plano estudo mundo bruxo': '/uploads/plano bruxo.png',
    'pc$ gold': '/uploads/PCGold.png',
    'presente a&c': '/uploads/presenteAC.png',
    'presente taça das casas': '/uploads/presente taca.png',
    'presente ete gamificada': '/uploads/presente gamificada.png',
    'avaliações rankiadas': '/uploads/avaliacao.png',
    'baú dos enigmas': '/uploads/baudeenigmas.png',
    'aula vip bimestral': '/uploads/aulavip.png',
    'grupo vip whatsapp': '/uploads/grupo.png',
    'renomado a&c': '/uploads/Renomado A&C.png',
    'campeão(ã) mithológico': '/uploads/campeao.png',
    'galo sem ser de sala': '/uploads/1770561558392-775753899.png',
    
    // Tratamento de variações de nome
    'arrematador aprimorado (75%)': '/uploads/ArrematadordeLeiloesAprimorado.png',
    'sortudo (2x chance)': '/uploads/Sortudo.png',
    'imunidade (1 sem)': '/uploads/Invisibilidade.png', // Invisibilidade 1
    
    // Itens Genéricos (caso precise)
    'gavel.png': '/uploads/gavel.png' // Se tiver
};

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI não encontrada!");
    process.exit(1);
}

async function fixInventory() {
    try {
        console.log('🔌 Conectando ao Mongo...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado!');

        const users = await User.find({});
        let totalUpdated = 0;

        for (const user of users) {
            let userChanged = false;

            // Percorre o inventário do usuário
            user.inventory.forEach(item => {
                // Se tiver imagem e for antiga (/assets)
                if (item.image && item.image.startsWith('/assets')) {
                    const nameKey = item.name.toLowerCase().trim();
                    
                    // Tenta achar match exato ou parcial no mapa
                    let newImage = null;
                    
                    // 1. Tenta match exato
                    if (IMAGE_MAP[nameKey]) {
                        newImage = IMAGE_MAP[nameKey];
                    } 
                    // 2. Tenta encontrar chave dentro do nome (ex: "ajuda divina (extra)" acha "ajuda divina")
                    else {
                        const partialKey = Object.keys(IMAGE_MAP).find(k => nameKey.includes(k));
                        if (partialKey) newImage = IMAGE_MAP[partialKey];
                    }

                    if (newImage) {
                        console.log(`🔧 [${user.nome}] Item: ${item.name}`);
                        console.log(`   🔴 ${item.image} -> 🟢 ${newImage}`);
                        item.image = newImage;
                        userChanged = true;
                    } else {
                        console.warn(`⚠️ Sem mapa para: ${item.name} (${item.image})`);
                    }
                }
            });

            if (userChanged) {
                // Marca o array como modificado para o Mongoose salvar
                user.markModified('inventory');
                await user.save();
                totalUpdated++;
            }
        }

        console.log(`\n🎉 Processo finalizado! Inventário de ${totalUpdated} usuários atualizado.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Erro fatal:", error);
        process.exit(1);
    }
}

fixInventory();