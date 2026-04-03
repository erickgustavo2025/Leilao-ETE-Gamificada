// ARQUIVO: backend/src/controllers/questController.js
const Quest = require('../models/Quest');
const User = require('../models/User');
const Log = require('../models/Log'); // Nosso velho amigo X9 para auditoria
const Classroom = require('../models/Classroom');

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

            // 1. Entrega o Dinheiro (PC$)
            if (quest.rewards?.pc > 0) {
                user.saldoPc += quest.rewards.pc;
                // maxPcAchieved é atualizado no hook pre-save do User.js
            }

            // 2. Entrega a Badge (se houver)
            if (quest.rewards?.badgeId && !user.cargos.includes(quest.rewards.badgeId)) {
                user.cargos.push(quest.rewards.badgeId);
            }

            // 🎁 3. O SISTEMA DE ITENS OFICIAL (Mochila Pessoal vs Turma)
            if (quest.rewardItems && quest.rewardItems.length > 0) {
                for (const item of quest.rewardItems) {
                    let expirationDate = null;
                    if (item.validityDays) {
                        expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + item.validityDays);
                    }

                    if (item.sendToClassroom) {
                        const turma = await Classroom.findOne({ serie: user.turma });
                        if (turma) {
                            turma.roomInventory.push({
                                itemId: item.itemId,
                                name: item.name,
                                category: item.category,
                                quantity: 1,
                                acquiredAt: new Date(),
                                expiresAt: expirationDate,
                                origin: 'PREMIO',
                                acquiredBy: user._id
                            });
                            await turma.save();
                        }
                    } else {
                        if (item.category === 'BUFF') {
                            user.activeBuffs = user.activeBuffs || [];
                            user.activeBuffs.push({
                                effect: item.itemId.toString(),
                                name: item.name,
                                source: `Missão: ${quest.title}`,
                                expiresAt: expirationDate
                            });
                        } else {
                            user.inventory = user.inventory || [];
                            user.inventory.push({
                                itemId: item.itemId,
                                name: item.name,
                                category: item.category,
                                quantity: 1,
                                acquiredAt: new Date(),
                                expiresAt: expirationDate,
                                origin: 'Missão'
                            });
                        }
                    }
                }
            }

            // 4. Marca a quest como completa para o aluno
            const qIndex = user.activeQuests.findIndex(aq => aq.questId.toString() === questId);
            if (qIndex !== -1) {
                user.activeQuests[qIndex].status = 'COMPLETED';
                user.activeQuests[qIndex].progress = 100;
            } else {
                user.activeQuests.push({
                    questId: quest._id,
                    progress: 100,
                    status: 'COMPLETED'
                });
            }

            // 🔥 QUEIMA O CÓDIGO NO BANCO DE DADOS
            quest.validCodes[codeIndex].isUsed = true;
            quest.validCodes[codeIndex].usedBy = user._id;

            await user.save();
            await quest.save();

            if (Log) {
                await Log.create({
                    user: user._id,
                    action: 'QUEST_COMPLETED',
                    details: `Concluiu a missão: ${quest.title} usando o código ${secretCode}.`,
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
            const quests = await Quest.find({
                isActive: true,
                type: { $in: ['DIARIA', 'SEMANAL', 'EVENTO'] }
            }).sort({ createdAt: -1 });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });

            const formattedQuests = quests.map(q => {
                const userQuest = user.activeQuests?.find(uq => uq.questId.toString() === q._id.toString());
                let status = 'available';
                if (userQuest) {
                    if (userQuest.status === 'COMPLETED' || userQuest.status === 'REWARD_CLAIMED') status = 'completed';
                    else if (userQuest.status === 'ACCEPTED') status = 'pending';
                }

                return {
                    id: q._id,
                    title: q.title,
                    description: q.description,
                    type: q.type.toLowerCase() === 'diaria' ? 'daily' : q.type.toLowerCase() === 'semanal' ? 'weekly' : 'event',
                    reward: { pc: q.rewards?.pc || 0 },
                    rewardItems: q.rewardItems || [],
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

    // 3. ALUNO SOLICITA VALIDAÇÃO MANUAL
    async requestManualValidation(req, res) {
        try {
            const { questId } = req.body;
            const userId = req.user._id;

            const user = await User.findById(userId);
            const quest = await Quest.findById(questId);

            if (!user || !quest) return res.status(404).json({ error: 'Aventureiro ou Missão não encontrados.' });

            if (quest.validationMethod !== 'MANUAL_ADMIN') {
                return res.status(400).json({ error: 'Esta missão exige um código secreto para ser validada.' });
            }

            const existingQuest = user.activeQuests?.find(q => q.questId.toString() === questId);
            if (existingQuest) {
                if (existingQuest.status === 'COMPLETED' || existingQuest.status === 'REWARD_CLAIMED') return res.status(400).json({ error: 'Você já completou esta missão!' });
                if (existingQuest.status === 'ACCEPTED') return res.status(400).json({ error: 'Você já solicitou a validação desta missão. Aguarde o professor.' });
            }

            user.activeQuests = user.activeQuests || [];
            user.activeQuests.push({
                questId: quest._id,
                progress: 0,
                status: 'ACCEPTED'
            });

            await user.save();
            res.json({ message: 'Solicitação enviada com sucesso!' });
        } catch (error) {
            console.error('❌ Erro no requestManualValidation:', error);
            res.status(500).json({ error: 'Erro ao solicitar validação.' });
        }
    }
};

module.exports = questController;
