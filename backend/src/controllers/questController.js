// ARQUIVO: backend/src/controllers/questController.js
const Quest = require('../models/Quest');
const User = require('../models/User');
const Log = require('../models/Log'); // Nosso velho amigo X9 para auditoria

const questController = {
    // 1. O ALUNO TENTA VALIDAR UMA MISSÃO POR CÓDIGO SECRETO (SISTEMA STEAM KEYS)
    async validateSecretCode(req, res) {
        try {
            const { questId, secretCode } = req.body;
            const userId = req.user._id;

            if (!questId || !secretCode) {
                return res.status(400).json({ error: 'ID da missão e Código Secreto são obrigatórios.' });
            }

            const user = await User.findById(userId);
            const quest = await Quest.findById(questId);

            if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });
            if (!quest) return res.status(404).json({ error: 'Missão não encontrada.' });

            if (quest.validationMethod !== 'SECRET_CODE') {
                return res.status(400).json({ error: 'Esta missão não pode ser concluída com código secreto.' });
            }

            // 🛡️ TRAVA 2 (NOVA): Procura o código dentro da "Caixa de Chaves" da missão
            const codeIndex = quest.validCodes.findIndex(
                c => c.code.trim().toUpperCase() === secretCode.trim().toUpperCase()
            );

            // Código não existe
            if (codeIndex === -1) {
                return res.status(400).json({ error: 'Código Secreto inválido. A porta da masmorra permanece fechada.' });
            }

            // Código já foi queimado!
            if (quest.validCodes[codeIndex].isUsed) {
                return res.status(400).json({ error: 'Tarde demais! Este código já foi resgatado por outro aventureiro.' });
            }

            // 🛡️ TRAVA 3: Ele já fez essa missão antes? 
            const hasCompleted = user.cargos.includes(quest.rewards?.badgeId) ||
                (user.activeQuests && user.activeQuests.some(q => q.questId.toString() === questId && q.status === 'COMPLETED'));

            if (hasCompleted) {
                return res.status(400).json({ error: 'Você já resgatou as glórias desta missão, aventureiro!' });
            }

            // 🏆 SUCESSO! HORA DO LOOT!
            user.activeQuests = user.activeQuests || [];

            if (quest.rewards?.pc > 0) {
                user.saldoPc += quest.rewards.pc;
                user.maxPcAchieved += quest.rewards.pc;
            }

            if (quest.rewards?.badgeId && !user.cargos.includes(quest.rewards.badgeId)) {
                user.cargos.push(quest.rewards.badgeId);
            }

            user.activeQuests.push({
                questId: quest._id,
                progress: 100,
                status: 'COMPLETED'
            });

            // 🔥 QUEIMA O CÓDIGO NO BANCO DE DADOS
            quest.validCodes[codeIndex].isUsed = true;
            quest.validCodes[codeIndex].usedBy = user._id;

            // Salva as duas pontas!
            await user.save();
            await quest.save();

            // Salva no Log de Auditoria
            if (Log) {
                await Log.create({
                    user: user._id,
                    action: 'QUEST_COMPLETED',
                    details: `Concluiu a missão: ${quest.title} usando o código ${secretCode}. Ganhou a badge: ${quest.rewards?.badgeId || 'Nenhuma'}.`,
                    ip: req.ip
                });
            }

            res.json({
                message: 'Missão Épica Concluída! Poderes desbloqueados.',
                badge: quest.rewards?.badgeId,
                saldoAtualizado: user.saldoPc
            });

        } catch (error) {
            console.error('❌ Erro no validateSecretCode:', error);
            res.status(500).json({ error: 'Erro interno ao validar o código da missão.' });
        }
    },
    // 2. BUSCAR MISSÕES SECUNDÁRIAS (TAVERNA)
    async getSecondaryQuests(req, res) {
        try {
            const userId = req.user._id;

            // Busca todas as missões ativas que não são de Campanha (Épicas/Secretas)
            const quests = await Quest.find({
                isActive: true,
                type: { $in: ['DIARIA', 'SEMANAL', 'EVENTO'] }
            }).sort({ createdAt: -1 });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });

            // Formata os dados exatamente como o Frontend do Claude espera!
            const formattedQuests = quests.map(q => {
                // Checa na mochila do aluno se ele já começou ou terminou essa missão
                const userQuest = user.activeQuests?.find(uq => uq.questId.toString() === q._id.toString());

                let status = 'available';
                if (userQuest) {
                    if (userQuest.status === 'COMPLETED') status = 'completed';
                    else if (userQuest.status === 'ACCEPTED') status = 'pending';
                }

                return {
                    id: q._id,
                    title: q.title,
                    description: q.description,
                    type: q.type.toLowerCase() === 'diaria' ? 'daily' : q.type.toLowerCase() === 'semanal' ? 'weekly' : 'event',
                    reward: {
                        pc: q.rewards?.pc || 0,
                        xp: q.rewards?.pc || 0 // Lembrando que na ETE Gamificada, PC$ histórico = XP
                    },
                    expiresAt: q.expiresAt,
                    status: status,
                    validationType: q.validationMethod === 'SECRET_CODE' ? 'code' : 'manual'
                };
            });

            res.json(formattedQuests);

        } catch (error) {
            console.error('❌ Erro no getSecondaryQuests:', error);
            res.status(500).json({ error: 'Erro ao carregar o mural de missões.' });
        }
    },

};

module.exports = questController;