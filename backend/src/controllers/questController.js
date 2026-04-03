// ARQUIVO: backend/src/controllers/questController.js
const Quest = require('../models/Quest');
const User = require('../models/User');
const Log = require('../models/Log'); // Nosso velho amigo X9 para auditoria

const questController = {
    // 1. O ALUNO TENTA VALIDAR UMA MISSÃO POR CÓDIGO SECRETO
    async validateSecretCode(req, res) {
        try {
            const { questId, secretCode } = req.body;
            const userId = req.user._id; // Pego pelo middleware protect

            if (!questId || !secretCode) {
                return res.status(400).json({ error: 'ID da missão e Código Secreto são obrigatórios.' });
            }

            // Busca o Aluno e a Missão
            const user = await User.findById(userId);
            const quest = await Quest.findById(questId);

            if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });
            if (!quest) return res.status(404).json({ error: 'Missão não encontrada.' });

            // 🛡️ TRAVA 1: Essa missão realmente usa código secreto?
            if (quest.validationMethod !== 'SECRET_CODE') {
                return res.status(400).json({ error: 'Esta missão não pode ser concluída com código secreto.' });
            }

            // 🛡️ TRAVA 2: O código está certo? (Ignora maiúsculas/minúsculas para evitar erro bobo do aluno)
            if (quest.secretCode.trim().toUpperCase() !== secretCode.trim().toUpperCase()) {
                return res.status(400).json({ error: 'Código Secreto inválido. A porta da masmorra permanece fechada.' });
            }

            // 🛡️ TRAVA 3: Ele já fez essa missão antes? (Evita farm infinito)
            // Checa se ele já tem a badge ou se a missão está no histórico dele
            const hasCompleted = user.cargos.includes(quest.rewards?.badgeId) || 
                (user.activeQuests && user.activeQuests.some(q => q.questId.toString() === questId && q.status === 'COMPLETED'));

            if (hasCompleted) {
                return res.status(400).json({ error: 'Você já resgatou as glórias desta missão, aventureiro!' });
            }

            // 🏆 SUCESSO! HORA DO LOOT!
            user.activeQuests = user.activeQuests || [];
            
            // Adiciona PC$ e XP (maxPcAchieved) se a missão pagar bem
            if (quest.rewards?.pc > 0) {
                user.saldoPc += quest.rewards.pc;
                user.maxPcAchieved += quest.rewards.pc; // Sobe o nível!
            }

            // Destranca o Poder! (Dá a Badge do Rank para o aluno)
            if (quest.rewards?.badgeId && !user.cargos.includes(quest.rewards.badgeId)) {
                user.cargos.push(quest.rewards.badgeId);
            }

            // Registra no histórico do aluno
            user.activeQuests.push({
                questId: quest._id,
                progress: 100,
                status: 'COMPLETED'
            });

            await user.save();

            // Salva no Log de Auditoria para o Admin ver depois
            if (Log) {
                await Log.create({
                    user: user._id,
                    action: 'QUEST_COMPLETED',
                    details: `Concluiu a missão: ${quest.title}. Ganhou a badge: ${quest.rewards?.badgeId || 'Nenhuma'}.`,
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
    }
};

module.exports = questController;