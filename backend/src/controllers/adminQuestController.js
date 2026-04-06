const Quest = require("../models/Quest");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Log = require("../models/Log");
const QuestSubmission = require("../models/QuestSubmission"); // NOVO
const { deliverQuestRewards } = require("../utils/questRewards"); // NOVO

// Função auxiliar para gerar código estilo Steam Key (Ex: ETE-A9F3K)
const generateCode = () => {
  return "ETE-" + Math.random().toString(36).substring(2, 7).toUpperCase();
};

const adminQuestController = {
  // 1. LISTAR TODAS AS MISSÕES (GET /api/admin/quests)
  async getAllQuests(req, res) {
    try {
      const quests = await Quest.find().sort({ createdAt: -1 });
      res.json(quests);
    } catch (error) {
      console.error("❌ Erro no getAllQuests:", error);
      res.status(500).json({ error: "Erro ao buscar missões." });
    }
  },

  // 2. CRIAR MISSÃO + GERAR CHAVES (POST /api/admin/quests)
  async createQuest(req, res) {
    try {
      const {
        title,
        description,
        type,
        rewardPc,
        validationType,
        generateKeysCount,
        expiresAt,
        minRank,
        rewardItems,
      } = req.body;

      let validCodes = [];
      if (validationType === "SECRET_CODE" && generateKeysCount > 0) {
        for (let i = 0; i < generateKeysCount; i++) {
          validCodes.push({
            code: generateCode(),
            isUsed: false,
          });
        }
      }

      const newQuest = await Quest.create({
        title,
        description: description || "Sem descrição.",
        type,
        validationMethod: validationType,
        validCodes: validCodes,
        rewards: { pc: rewardPc },
        rewardItems: rewardItems || [],
        minRank: minRank || 1,
        expiresAt: expiresAt || null,
      });

      res.status(201).json(newQuest);
    } catch (error) {
      console.error("❌ Erro no createQuest:", error);
      res.status(500).json({ error: "Erro ao criar missão e gerar chaves." });
    }
  },

  // 3. ATIVAR / DESATIVAR MISSÃO (PATCH /api/admin/quests/:id/toggle)
  async toggleQuest(req, res) {
    try {
      const quest = await Quest.findById(req.params.id);
      if (!quest) return res.status(404).json({ error: "Missão não encontrada." });

      quest.isActive = !quest.isActive;
      await quest.save();

      res.json({ message: "Status da missão alterado!", isActive: quest.isActive });
    } catch (error) {
      console.error("❌ Erro no toggleQuest:", error);
      res.status(500).json({ error: "Erro ao alterar status." });
    }
  },

  // 4. DELETAR MISSÃO (DELETE /api/admin/quests/:id)
  async deleteQuest(req, res) {
    try {
      const quest = await Quest.findByIdAndDelete(req.params.id);
      if (!quest) return res.status(404).json({ error: "Missão não encontrada." });

      res.json({ message: "Missão apagada permanentemente." });
    } catch (error) {
      console.error("❌ Erro no deleteQuest:", error);
      res.status(500).json({ error: "Erro ao deletar missão." });
    }
  },

  // 5. LISTAR PENDÊNCIAS DE APROVAÇÃO (GET /api/admin/quests/approvals)
  async getPendingApprovals(req, res) {
    try {
      const pendingSubmissions = await QuestSubmission.find({ status: "PENDING" })
        .populate("studentId", "nome matricula turma")
        .populate("questId", "title rewards rewardItems");

      const formattedSubmissions = pendingSubmissions.map((sub) => ({
        _id: sub._id,
        submissionId: sub._id,
        studentId: sub.studentId._id,
        studentName: sub.studentId.nome,
        studentMatricula: sub.studentId.matricula,
        questId: sub.questId._id,
        questTitle: sub.questId.title,
        submissionContent: sub.submissionContent,
        submittedAt: sub.submittedAt,
        rewards: {
          pc: sub.questId.rewards?.pc || 0,
          items: sub.questId.rewardItems || [],
        },
      }));

      res.json(formattedSubmissions);
    } catch (error) {
      console.error("❌ Erro no getPendingApprovals:", error);
      res.status(500).json({ error: "Erro ao buscar pendências." });
    }
  },

  // 6. APROVAR MISSÃO (POST /api/admin/quests/approvals/:submissionId/approve)
  async approveQuest(req, res) {
    try {
      const { submissionId } = req.params;
      const adminId = req.user._id;

      const submission = await QuestSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submissão não encontrada." });
      }
      if (submission.status !== "PENDING") {
        return res.status(400).json({ error: "Esta submissão já foi processada." });
      }

      const user = await User.findById(submission.studentId);
      const quest = await Quest.findById(submission.questId);

      if (!user || !quest) {
        return res.status(404).json({ error: "Aluno ou Missão não encontrados." });
      }

      // 🏆 ENTREGA DO LOOT (Usando a função unificada)
      const { deliverQuestRewards } = require('../utils/questRewards');
      await deliverQuestRewards(user, quest);

      // Atualiza o status da submissão
      submission.status = "APPROVED";
      submission.reviewedBy = adminId;
      submission.reviewedAt = new Date();
      await submission.save();

      // Atualiza o activeQuests do usuário para COMPLETED
      const userQuestIndex = user.activeQuests.findIndex(
        (aq) => aq.questId.toString() === quest._id.toString()
      );
      if (userQuestIndex !== -1) {
        user.activeQuests[userQuestIndex].status = "COMPLETED";
        user.activeQuests[userQuestIndex].progress = 100;
      } else {
        user.activeQuests.push({
          questId: quest._id,
          progress: 100,
          status: "COMPLETED",
        });
      }
      await user.save();

      if (Log) {
        await Log.create({
          user: adminId,
          action: "ADMIN_QUEST_APPROVE",
          details: `Aprovou a submissão da missão "${quest.title}" para o aluno ${user.nome} (${user.matricula}).`,
          ip: req.ip,
        });
      }

      res.json({ message: "Missão aprovada e recompensas entregues!" });
    } catch (error) {
      console.error("❌ Erro no approveQuest:", error);
      res.status(500).json({ error: "Erro ao aprovar missão." });
    }
  },

  // 7. REJEITAR MISSÃO (POST /api/admin/quests/approvals/:submissionId/reject)
  async rejectQuest(req, res) {
    try {
      const { submissionId } = req.params;
      const adminId = req.user._id;

      const submission = await QuestSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submissão não encontrada." });
      }
      if (submission.status !== "PENDING") {
        return res.status(400).json({ error: "Esta submissão já foi processada." });
      }

      const user = await User.findById(submission.studentId);
      const quest = await Quest.findById(submission.questId);

      if (!user || !quest) {
        return res.status(404).json({ error: "Aluno ou Missão não encontrados." });
      }

      // Atualiza o status da submissão
      submission.status = "REJECTED";
      submission.reviewedBy = adminId;
      submission.reviewedAt = new Date();
      await submission.save();

      // Remove a quest do activeQuests do usuário para que ele possa tentar novamente
      user.activeQuests = user.activeQuests.filter(
        (aq) => !(aq.questId.toString() === quest._id.toString() && aq.status === "ACCEPTED")
      );
      await user.save();

      if (Log) {
        await Log.create({
          user: adminId,
          action: "ADMIN_QUEST_REJECT",
          details: `Rejeitou a submissão da missão "${quest.title}" para o aluno ${user.nome} (${user.matricula}).`,
          ip: req.ip,
        });
      }

      res.json({ message: "Submissão rejeitada." });
    } catch (error) {
      console.error("❌ Erro no rejectQuest:", error);
      res.status(500).json({ error: "Erro ao rejeitar submissão." });
    }
  },
};

module.exports = adminQuestController;
