require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('../models/Item');
const auctionController = require('../controllers/auctionController');

async function testMidnightLogic() {
    try {
        console.log('🧪 [TESTE-MIDNIGHT] Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado.');

        console.log('\n📦 1. [MANUTENÇÃO] Expiração de Vantagens Temporárias...');
        const now = new Date();
        const expiredItems = await Item.find({ expirationDate: { $lte: now }, status: { $ne: 'expired' } });
        console.log(`   🔍 Itens detectados para expirar: ${expiredItems.length}`);
        
        const result = await Item.updateMany(
            { expirationDate: { $lte: now }, status: { $ne: 'expired' } }, 
            { status: 'expired' }
        );
        console.log(`   ✅ Sucesso: ${result.modifiedCount} benefícios mudaram para status "expired".`);

        console.log('\n🤖 2. [IA-RAG] Re-aprendizado Total (Oráculo GIL)...');
        const { cleanAndReindex } = require('./cleanAndReindex');
        await cleanAndReindex();
        
        console.log('\n🔨 3. [ECONOMIA] Fechamento de Leilões e PJC...');
        await auctionController.checkAndCloseAuctions();
        console.log('   ✅ Leilões pendentes processados.');

        console.log('\n✨ [VALIDAÇÃO CONCLUÍDA] O sistema está pronto para a próxima virada de dia.');
        process.exit(0);
    } catch (error) {
        console.error('❌ [ERRO-TESTE]', error);
        process.exit(1);
    }
}

testMidnightLogic();
