// ARQUIVO: backend/src/controllers/adminQuestController.js
const Quest = require('../models/Quest');

// Função auxiliar para gerar código estilo Steam Key (Ex: ETE-A9F3K)
const generateCode = () => {
    return 'ETE-' + Math.random().toString(36).substring(2, 7).toUpperCase();
};

const adminQuestController = {
    // 1. LISTAR TODAS AS MISSÕES (GET /api/admin/quests)
    async getAllQuests(req, res) {
        try {
            const quests = await Quest.find().sort({ createdAt: -1 });
            res.json(quests);
        } catch (error) {
            console.error('❌ Erro no getAllQuests:', error);
            res.status(500).json({ error: 'Erro ao buscar missões.' });
        }
    },

    // 2. CRIAR MISSÃO + GERAR CHAVES (POST /api/admin/quests)
    async createQuest(req, res) {
        try {
            const { 
                title, description, type, rewardPc, 
                validationType, generateKeysCount, expiresAt, minRank 
            } = req.body;

            // 🔑 A Mágica do Gerador de Steam Keys
            let validCodes = [];
            if (validationType === 'SECRET_CODE' && generateKeysCount > 0) {
                for (let i = 0; i < generateKeysCount; i++) {
                    validCodes.push({
                        code: generateCode(),
                        isUsed: false
                    });
                }
            }

            const newQuest = await Quest.create({
                title,
                description: description || 'Sem descrição.', // Fallback
                type,
                validationMethod: validationType,
                validCodes: validCodes,
                rewards: { pc: rewardPc },
                minRank: minRank || 1,
                expiresAt: expiresAt || null
            });

            res.status(201).json(newQuest);

        } catch (error) {
            console.error('❌ Erro no createQuest:', error);
            res.status(500).json({ error: 'Erro ao criar missão e gerar chaves.' });
        }
    },

    // 3. ATIVAR / DESATIVAR MISSÃO (PATCH /api/admin/quests/:id/toggle)
    async toggleQuest(req, res) {
        try {
            const quest = await Quest.findById(req.params.id);
            if (!quest) return res.status(404).json({ error: 'Missão não encontrada.' });

            quest.isActive = !quest.isActive;
            await quest.save();

            res.json({ message: 'Status da missão alterado!', isActive: quest.isActive });
        } catch (error) {
            console.error('❌ Erro no toggleQuest:', error);
            res.status(500).json({ error: 'Erro ao alterar status.' });
        }
    },

    // 4. DELETAR MISSÃO (DELETE /api/admin/quests/:id)
    async deleteQuest(req, res) {
        try {
            const quest = await Quest.findByIdAndDelete(req.params.id);
            if (!quest) return res.status(404).json({ error: 'Missão não encontrada.' });

            res.json({ message: 'Missão apagada permanentemente.' });
        } catch (error) {
            console.error('❌ Erro no deleteQuest:', error);
            res.status(500).json({ error: 'Erro ao deletar missão.' });
        }
    }
};

module.exports = adminQuestController;