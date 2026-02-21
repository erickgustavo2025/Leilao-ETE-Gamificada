// backend/src/services/cronService.js
const cron = require('node-cron');
const Item = require('../models/Item');
const User = require('../models/User'); // ✅ FIX: estava faltando — crashava silenciosamente no cron de skills
const auctionController = require('../controllers/auctionController');

const initCron = () => {

    // 1. FECHAR LEILÕES EXPIRADOS (a cada 1 minuto)
    cron.schedule('*/1 * * * *', async () => {
        try {
            const expiredItems = await Item.find({
                status: 'ativo',
                dataFim: { $lt: new Date() }
            });

            if (expiredItems.length > 0) {
                console.log(`⏰ [CRON] Encontrados ${expiredItems.length} leilões vencidos. Fechando...`);
                for (const item of expiredItems) {
                    await auctionController.executeAuctionClosure(item._id);
                }
            }
        } catch (error) {
            console.error('❌ Erro no Cron de Leilões:', error);
        }
    });

    // 2. RECARGA DE SKILLS (Todo dia 1º do mês às 00:00)
    cron.schedule('0 0 1 * *', async () => {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0=Jan ... 4=Mai, 7=Ago

        // MESES DE RECARGA TRIMESTRAL: Maio (4) e Agosto (7)
        const RECHARGE_MONTHS = [4, 7];

        console.log(`📅 [CRON] Verificando Calendário Escolar... Mês: ${currentMonth + 1}`);

        try {
            const users = await User.find({ 'inventory.category': 'RANK_SKILL' });
            let count = 0;

            // ✅ FIX: Ao invés de fazer user.save() um por um (1 roundtrip por aluno),
            // coletamos todas as atualizações e mandamos num único bulkWrite.
            const bulkOps = [];

            for (const user of users) {
                const updatedSlots = [];
                let modified = false;

                user.inventory.forEach((item, index) => {
                    if (item.category !== 'RANK_SKILL') return;

                    let shouldReset = false;

                    if (item.resetPeriod === 'MONTHLY') {
                        shouldReset = true;
                    } else if (item.resetPeriod === 'QUARTERLY') {
                        if (RECHARGE_MONTHS.includes(currentMonth)) {
                            shouldReset = true;
                        }
                    }

                    if (shouldReset && item.usesLeft < item.usesMax) {
                        updatedSlots.push({ index, usesMax: item.usesMax });
                        modified = true;
                    }
                });

                if (modified) {
                    // Monta o $set apenas para os slots que mudaram
                    const setPayload = {};
                    updatedSlots.forEach(({ index, usesMax }) => {
                        setPayload[`inventory.${index}.usesLeft`] = usesMax;
                        setPayload[`inventory.${index}.lastUsedAt`] = null;
                    });

                    bulkOps.push({
                        updateOne: {
                            filter: { _id: user._id },
                            update: { $set: setPayload }
                        }
                    });
                    count++;
                }
            }

            // Uma única chamada ao banco para todos os alunos
            if (bulkOps.length > 0) {
                await User.bulkWrite(bulkOps);
                console.log(`✅ [CRON] Skills recarregadas para ${count} alunos (bulkWrite).`);
            }

        } catch (error) {
            console.error('❌ Erro no Cron de Skills:', error);
        }
    });

    console.log('✅ Serviço de Cron Iniciado');
};

module.exports = { initCron };
