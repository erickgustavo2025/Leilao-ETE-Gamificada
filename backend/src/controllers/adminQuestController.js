// ARQUIVO: backend/src/controllers/adminQuestController.js
const Quest = require('../models/Quest');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Log = require('../models/Log');

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
        validationType, generateKeysCount, expiresAt, minRank,
        rewardItems
      } = req.body;

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
        description: description || 'Sem descrição.',
        type,
        validationMethod: validationType,
        validCodes: validCodes,
        rewards: { pc: rewardPc },
        rewardItems: rewardItems || [],
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
  },

  // 5. LISTAR PENDÊNCIAS DE APROVAÇÃO (GET /api/admin/quests/approvals)
  async getPendingApprovals(req, res) {
    try {
      // Busca usuários que tenham quests com status 'ACCEPTED'
      const users = await User.find({ 'activeQuests.status': 'ACCEPTED' });
      
      let pendingList = [];
      for (const user of users) {
        for (const aq of user.activeQuests) {
          if (aq.status === 'ACCEPTED') {
            const quest = await Quest.findById(aq.questId);
            if (quest && quest.validationMethod === 'MANUAL_ADMIN') {
              pendingList.push({
                _id: `${user._id}_${quest._id}`, // ID composto para o front
                userId: user._id,
                questId: quest._id,
                studentName: user.nome,
                studentMatricula: user.matricula,
                questTitle: quest.title,
                requestedAt: user.updatedAt,
                rewards: {
                  pc: quest.rewards?.pc || 0,
                  items: quest.rewardItems || []
                }
              });
            }
          }
        }
      }

      res.json(pendingList);
    } catch (error) {
      console.error('❌ Erro no getPendingApprovals:', error);
      res.status(500).json({ error: 'Erro ao buscar pendências.' });
    }
  },

  // 6. APROVAR MISSÃO (POST /api/admin/quests/approvals/:id/approve)
  async approveQuest(req, res) {
    try {
      const [userId, questId] = req.params.id.split('_');
      const user = await User.findById(userId);
      const quest = await Quest.findById(questId);

      if (!user || !quest) return res.status(404).json({ error: 'Dados não encontrados.' });

      const aqIndex = user.activeQuests.findIndex(aq => aq.questId.toString() === questId && aq.status === 'ACCEPTED');
      if (aqIndex === -1) return res.status(400).json({ error: 'Solicitação não encontrada ou já processada.' });

      // --- ENTREGA DO LOOT (Lógica similar ao validateSecretCode) ---
      if (quest.rewards?.pc > 0) {
        user.saldoPc += quest.rewards.pc;
      }

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

      user.activeQuests[aqIndex].status = 'COMPLETED';
      user.activeQuests[aqIndex].progress = 100;

      await user.save();

      if (Log) {
        await Log.create({
          user: req.user._id, // Admin que aprovou
          action: 'ADMIN_QUEST_APPROVE',
          details: `Aprovou a missão "${quest.title}" para o aluno ${user.nome} (${user.matricula})`,
          ip: req.ip
        });
      }

      res.json({ message: 'Missão aprovada e recompensas entregues!' });
    } catch (error) {
      console.error('❌ Erro no approveQuest:', error);
      res.status(500).json({ error: 'Erro ao aprovar missão.' });
    }
  },

  // 7. REJEITAR MISSÃO (POST /api/admin/quests/approvals/:id/reject)
  async rejectQuest(req, res) {
    try {
      const [userId, questId] = req.params.id.split('_');
      const user = await User.findById(userId);

      if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });

      const aqIndex = user.activeQuests.findIndex(aq => aq.questId.toString() === questId && aq.status === 'ACCEPTED');
      if (aqIndex === -1) return res.status(400).json({ error: 'Solicitação não encontrada.' });

      // Remove a solicitação para que ele possa tentar de novo
      user.activeQuests.splice(aqIndex, 1);
      await user.save();

      res.json({ message: 'Solicitação rejeitada.' });
    } catch (error) {
      console.error('❌ Erro no rejectQuest:', error);
      res.status(500).json({ error: 'Erro ao rejeitar missão.' });
    }
  }
};

module.exports = adminQuestController;
