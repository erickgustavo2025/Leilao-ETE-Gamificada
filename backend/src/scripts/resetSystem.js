// backend/src/scripts/resetSystem.js
require('dotenv').config({ path: '../.env' }); // Caminho relativo para a raiz do backend
const mongoose = require('mongoose');

// --- IMPORTAÇÃO DOS MODELS ---
const Log = require('../models/Log');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const Bid = require('../models/Bid'); // Lances
const Item = require('../models/Item'); // 🔥 LEILÕES (O arquivo chama Item.js)
const Trade = require('../models/Trade');
const MarketListing = require('../models/MarketListing');
const Ticket = require('../models/Ticket');
const Feedback = require('../models/Feedback');
const GiftBox = require('../models/GiftBox');
const Loan = require('../models/Loan'); 
const HouseAction = require('../models/HouseAction'); 
const Punishment = require('../models/Punishment'); 
const User = require('../models/User'); 

async function resetAll() {
    try {
        // 1. Conexão
        if (!process.env.MONGO_URI) {
            throw new Error("❌ MONGO_URI não encontrada. Verifique o caminho do .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔥 Conectado ao Banco. PREPARANDO PURGA SEGURA...");
        console.log("🛡️ MODO SEGURO: Inventários e Saldos (PC$) serão PRESERVADOS.");

        // 2. Limpeza de Logs e Rastreabilidade
        console.log("\n--- 🧹 Limpando Históricos ---");
        await Log.deleteMany({});
        console.log("✅ Logs de sistema limpos.");
        
        await Notification.deleteMany({});
        console.log("✅ Notificações de usuários limpas.");
        
        await Transaction.deleteMany({});
        console.log("✅ Histórico bancário (Transações) limpo.");

        // 3. Limpeza da Economia Viva
        console.log("\n--- 💰 Limpando Economia Ativa ---");
        
        // 🔥 AQUI ESTÁ A CORREÇÃO: Limpa 'Item' (que são os Leilões)
        await Item.deleteMany({});
        console.log("✅ Leilões (Itens de Leilão) limpos.");
        
        await Bid.deleteMany({});
        console.log("✅ Lances de leilão limpos.");
        
        await Trade.deleteMany({});
        console.log("✅ Trocas (Trades) pendentes e finalizadas limpas.");
        
        await MarketListing.deleteMany({});
        console.log("✅ Anúncios do Mercado limpos.");
        
        await Loan.deleteMany({});
        console.log("✅ Empréstimos bancários limpos.");

        // 4. Limpeza Social e Suporte
        console.log("\n--- 🤝 Limpando Social/Suporte ---");
        await Ticket.deleteMany({});
        console.log("✅ Tickets de suporte limpos.");
        
        await Feedback.deleteMany({});
        console.log("✅ Feedbacks enviados limpos.");
        
        await GiftBox.deleteMany({});
        console.log("✅ Presentes (GiftBox) limpos.");

        // 5. Limpeza da Taça das Casas
        console.log("\n--- 🏆 Limpando Taça das Casas ---");
        await HouseAction.deleteMany({});
        console.log("✅ Histórico de Pontos das Casas zerado.");
        
        await Punishment.deleteMany({});
        console.log("✅ Histórico de Punições zerado.");

        console.log("\n✨=============================================✨");
        console.log("   SISTEMA LIMPO E PRONTO PARA O LANÇAMENTO!");
        console.log("   (Usuários, Itens e Dinheiro continuam salvos)");
        console.log("✨=============================================✨");
        
        process.exit();

    } catch (error) {
        console.error("❌ Erro fatal durante o reset:", error);
        process.exit(1);
    }
}

resetAll();