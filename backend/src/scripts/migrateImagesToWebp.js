

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Importação dos Modelos
const User = require('../models/User');
const Item = require('../models/Item');
const StoreItem = require('../models/StoreItem');
const Classroom = require('../models/Classroom');


async function migrateImagesToWebp() {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI não encontrada no .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        const replaceExtension = (url) => {
            if (!url || typeof url !== 'string') return url;
            return url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        };

        console.log("🔄 Iniciando migração de URLs de imagens...");

        // 1. Alunos (Avatar)
        const users = await User.find({ avatar: { $regex: /\.(png|jpg|jpeg)$/i } });
        for (let user of users) {
            user.avatar = replaceExtension(user.avatar);
            await user.save();
        }
        console.log(`✅ Alunos atualizados: ${users.length}`);

        // 2. Itens de Leilão (imagemUrl)
        const items = await Item.find({ imagemUrl: { $regex: /\.(png|jpg|jpeg)$/i } });
        for (let item of items) {
            item.imagemUrl = replaceExtension(item.imagemUrl);
            await item.save();
        }
        console.log(`✅ Itens de Leilão atualizados: ${items.length}`);

        // 3. Itens da Loja (imagem)
        const storeItems = await StoreItem.find({ imagem: { $regex: /\.(png|jpg|jpeg)$/i } });
        for (let sItem of storeItems) {
            sItem.imagem = replaceExtension(sItem.imagem);
            await sItem.save();
        }
        console.log(`✅ Itens da Loja atualizados: ${storeItems.length}`);

        // 4. Salas (Logo e Inventário da Sala)
        const classrooms = await Classroom.find({
            $or: [
                { logo: { $regex: /\.(png|jpg|jpeg)$/i } },
                { "roomInventory.image": { $regex: /\.(png|jpg|jpeg)$/i } }
            ]
        });
        for (let classroom of classrooms) {
            classroom.logo = replaceExtension(classroom.logo);
            if (classroom.roomInventory && classroom.roomInventory.length > 0) {
                classroom.roomInventory.forEach(inv => {
                    inv.image = replaceExtension(inv.image);
                });
            }
            await classroom.save();
        }
        console.log(`✅ Salas atualizadas: ${classrooms.length}`);

  
        console.log("══════════════════════════════════════");
        console.log("🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
        console.log("══════════════════════════════════════");

    } catch (error) {
        console.error("❌ Erro durante a migração:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Conexão encerrada.");
        process.exit();
    }
}

migrateImagesToWebp();
