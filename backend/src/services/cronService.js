const cron = require('node-cron');
const Item = require('../models/Item');
const auctionController = require('../controllers/auctionController');

const initCron = () => {
    // Roda a cada 1 minuto: "*/1 * * * *"
    cron.schedule('*/1 * * * *', async () => {
        // 🤫 PSIU! Removi o log barulhento daqui.
        
        try {
            const expiredItems = await Item.find({
                status: 'ativo',
                dataFim: { $lt: new Date() }
            });

            // Só loga se TIVER trabalho a fazer
            if (expiredItems.length > 0) {
                console.log(`⏰ [CRON] Encontrados ${expiredItems.length} leilões vencidos. Fechando...`);
                
                for (const item of expiredItems) {
                    await auctionController.executeAuctionClosure(item._id);
                }
            }
        } catch (error) {
            console.error('❌ Erro no Cron Job:', error);
        }
    });

    // 2. RECARGA DE SKILLS (Calendário Escolar Personalizado)
    // Roda todo dia 1º do mês às 00:00
    cron.schedule('0 0 1 * *', async () => {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0=Jan, 1=Fev ... 4=Maio, 7=Agosto

        // MESES DE RECARGA: Maio (4) e Agosto (7)
        const RECHARGE_MONTHS = [4, 7]; 

        // Se for mensal, recarrega sempre. Se for trimestral, só nos meses-chave.
        console.log(`📅 [CRON] Verificando Calendário Escolar... Mês: ${currentMonth + 1}`);

        const users = await User.find({ "inventory.category": "RANK_SKILL" });
        let count = 0;

        for (const user of users) {
            let modified = false;
            user.inventory.forEach(item => {
                if (item.category === 'RANK_SKILL') {
                    
                    let shouldReset = false;

                    if (item.resetPeriod === 'MONTHLY') {
                        shouldReset = true; // Todo dia 1º
                    } 
                    else if (item.resetPeriod === 'QUARTERLY') {
                        // Só recarrega em 01/Mai e 01/Ago
                        if (RECHARGE_MONTHS.includes(currentMonth)) {
                            shouldReset = true;
                        }
                    }

                    if (shouldReset && item.usesLeft < item.usesMax) {
                        item.usesLeft = item.usesMax;
                        item.lastUsedAt = null; // Reseta data de uso
                        modified = true;
                    }
                }
            });

            if (modified) {
                user.markModified('inventory');
                await user.save();
                count++;
            }
        }
        if (count > 0) console.log(`✅ Skills recarregadas para ${count} alunos (Novo Ciclo).`);
    });
    
    console.log('✅ Serviço de Cron Iniciado');
};

module.exports = { initCron };