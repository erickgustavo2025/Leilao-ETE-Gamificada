const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis de ambiente (Voltando duas pastas: scripts -> src -> backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Importações com os caminhos consertados e modelo de Leilão corrigido (Item)
const Log = require('../models/Log');
const Item = require('../models/Item'); // <-- AQUI ERA O AUCTION!
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const Ticket = require('../models/Ticket');
const HouseAction = require('../models/HouseAction');
const Punishment = require('../models/Punishment');
const Classroom = require('../models/Classroom');

async function wipeForProduction() {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        console.log("\n🧹 [1/2] LIMPANDO RASTROS DE TESTES...");
        await Log.deleteMany({});
        await Item.deleteMany({}); // <-- Limpando os leilões
        await Bid.deleteMany({});
        await Notification.deleteMany({});
        await Ticket.deleteMany({});
        await HouseAction.deleteMany({});
        await Punishment.deleteMany({});
        console.log("✅ Logs, Leilões, Tickets e Tribunal limpos!");

        console.log("\n🧹 [2/2] ZERANDO A TAÇA DAS CASAS...");
        // Zera APENAS a pontuação das turmas e esvazia o Beco Diagonal da sala
        const resultClasses = await Classroom.updateMany({}, { 
            $set: { pontuacaoAtual: 0, roomInventory: [] } 
        });
        console.log(`✅ ${resultClasses.modifiedCount} Turmas tiveram a pontuação e os baús zerados!`);

        console.log("\n🛡️ ALUNOS 100% SEGUROS: XP, PC$ e Mochilas não foram tocados.");
        console.log("\n🚀 SISTEMA PRONTO PARA O DEPLOY (TUDO LIMPO E SEGURO)!");

    } catch (error) {
        console.error("❌ Erro fatal ao limpar sistema:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Conexão encerrada.");
        process.exit();
    }
}

wipeForProduction();
