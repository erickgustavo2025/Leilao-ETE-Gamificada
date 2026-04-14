const Quest = require("../models/Quest");
const User = require("../models/User");
const Log = require("../models/Log");
const Classroom = require("../models/Classroom");
const QuestSubmission = require("../models/QuestSubmission"); // NOVO
const { deliverQuestRewards } = require("../utils/questRewards"); // NOVO

const questController = {
  // 1. O ALUNO TENTA VALIDAR UMA MISSÃO POR CÓDIGO SECRETO (SISTEMA STEAM KEYS)
  async validateSecretCode(req, res) {
    try {
      const { questId, secretCode } = req.body;
      const userId = req.user._id;

      if (!questId || !secretCode) {
        return res
          .status(400)
          .json({ error: "ID da missão e Código Secreto são obrigatórios." });
      }

      const user = await User.findById(userId);
      const quest = await Quest.findById(questId);

      if (!user) return res.status(404).json({ error: "Aluno não encontrado." });
      if (!quest) return res.status(404).json({ error: "Missão não encontrada." });

      if (quest.validationMethod !== "SECRET_CODE") {
        return res
          .status(400)
          .json({ error: "Esta missão não pode ser concluída com código secreto." });
      }

      // 🛡️ TRAVA 2 (NOVA): Procura o código dentro da "Caixa de Chaves" da missão
      const codeIndex = quest.validCodes.findIndex(
        (c) => c.code.trim().toUpperCase() === secretCode.trim().toUpperCase()
      );

      // Código não existe
      if (codeIndex === -1) {
        return res
          .status(400)
          .json({ error: "Código Secreto inválido. A porta da masmorra permanece fechada." });
      }

      // Código já foi queimado!
      if (quest.validCodes[codeIndex].isUsed) {
        return res
          .status(400)
          .json({ error: "Tarde demais! Este código já foi resgatado por outro aventureiro." });
      }

      // 🛡️ TRAVA 3: Ele já fez essa missão antes?
      const hasCompleted =
        user.cargos.includes(quest.rewards?.badgeId) ||
        (user.activeQuests &&
          user.activeQuests.some(
            (q) => q.questId.toString() === questId && q.status === "COMPLETED"
          ));

      if (hasCompleted) {
        return res
          .status(400)
          .json({ error: "Você já resgatou as glórias desta missão, aventureiro!" });
      }

      // 🏆 SUCESSO! HORA DO LOOT ATÔMICO!
      const updateOps = await deliverQuestRewards(user, quest);

      // Prepara o status da missão
      const qIndex = user.activeQuests.findIndex(
        (aq) => aq.questId.toString() === questId
      );
      if (qIndex !== -1) {
        updateOps.$set = updateOps.$set || {};
        updateOps.$set[`activeQuests.${qIndex}.status`] = "COMPLETED";
        updateOps.$set[`activeQuests.${qIndex}.progress`] = 100;
      } else {
        updateOps.$push = updateOps.$push || {};
        updateOps.$push.activeQuests = {
          questId: quest._id,
          progress: 100,
          status: "COMPLETED",
        };
      }

      // 4. Executa a grande atualização atômica do Usuário
      await User.findByIdAndUpdate(user._id, updateOps);

      // 🔥 QUEIMA O CÓDIGO NO BANCO DE DADOS (Objeto da Missão)
      quest.validCodes[codeIndex].isUsed = true;
      quest.validCodes[codeIndex].usedBy = user._id;
      await quest.save();

      if (Log) {
        await Log.create({
          user: user._id,
          action: "QUEST_COMPLETED",
          details: `Concluiu a missão: ${quest.title} usando o código ${secretCode}.`,
          ip: req.ip,
        });
      }

      res.json({
        message: "Missão Épica Concluída! Poderes desbloqueados.",
        badge: quest.rewards?.badgeId,
        saldoAtualizado: user.saldoPc,
      });
    } catch (error) {
      console.error("❌ Erro no validateSecretCode:", error);
      res.status(500).json({ error: "Erro interno ao validar o código da missão." });
    }
  },

  // 2. BUSCAR MISSÕES SECUNDÁRIAS (TAVERNA)
  async getSecondaryQuests(req, res) {
    try {
      const userId = req.user._id;
      const quests = await Quest.find({
        isActive: true,
        type: { $in: ["DIARIA", "SEMANAL", "EVENTO", "MENSAL", "CAMPANHA", "FUNCIONALIDADE"] },
      }).sort({ createdAt: -1 });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "Aluno não encontrado." });

      const formattedQuests = quests.map((q) => {
        const userQuest = user.activeQuests?.find(
          (uq) => uq.questId.toString() === q._id.toString()
        );
        let status = "available";
        if (userQuest) {
          if (
            userQuest.status === "COMPLETED" ||
            userQuest.status === "REWARD_CLAIMED"
          )
            status = "completed";
          else if (userQuest.status === "ACCEPTED") status = "pending";
        }

        return {
          id: q._id,
          title: q.title,
          description: q.description,
          type:
            q.type.toLowerCase() === "diaria"
              ? "daily"
              : q.type.toLowerCase() === "semanal"
              ? "weekly"
              : q.type.toLowerCase() === "mensal"
              ? "monthly"
              : q.type.toLowerCase() === "campanha"
              ? "campaign"
              : q.type.toLowerCase() === "funcionalidade"
              ? "functionality"
              : "event",
          reward: { pc: q.rewards?.pc || 0 },
          rewardItems: q.rewardItems || [],
          expiresAt: q.expiresAt,
          status: status,
          validationType: q.validationMethod === "SECRET_CODE" ? "code" : "manual",
        };
      });

      res.json(formattedQuests);
    } catch (error) {
      console.error("❌ Erro no getSecondaryQuests:", error);
      res.status(500).json({ error: "Erro ao carregar o mural de missões." });
    }
  },

  // 3. ALUNO SOLICITA VALIDAÇÃO MANUAL (AGORA CRIA UM QUESTSUBMISSION)
  async requestManualValidation(req, res) {
    try {
      const { questId, submissionContent } = req.body; // Adicionado submissionContent
      const userId = req.user._id;

      const user = await User.findById(userId);
      const quest = await Quest.findById(questId);

      if (!user || !quest)
        return res
          .status(404)
          .json({ error: "Aventureiro ou Missão não encontrados." });

      if (quest.validationMethod !== "MANUAL_ADMIN") {
        return res
          .status(400)
          .json({ error: "Esta missão exige um código secreto para ser validada." });
      }

      // Captura o anexo se existir
      const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Tenta criar a submissão. O índice único no QuestSubmissionSchema vai impedir duplicatas PENDING.
      const newSubmission = await QuestSubmission.create({
        studentId: userId,
        questId: questId,
        submissionContent: submissionContent || "",
        attachmentUrl: attachmentUrl,
        status: "PENDING",
      });

      // Atualiza activeQuests para refletir a submissão pendente (se ainda não existir)
      const existingQuestIndex = user.activeQuests.findIndex(
        (aq) => aq.questId.toString() === questId
      );

      if (existingQuestIndex === -1) {
        user.activeQuests.push({
          questId: quest._id,
          progress: 0,
          status: "ACCEPTED", // Mapeia para PENDING no QuestSubmission
        });
      } else if (user.activeQuests[existingQuestIndex].status !== "ACCEPTED") {
        user.activeQuests[existingQuestIndex].status = "ACCEPTED";
      }
      await user.save();

      res.json({ message: "Solicitação enviada com sucesso!", submission: newSubmission });
    } catch (error) {
      // Erro de índice único (duplicata PENDING ou APPROVED)
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "Você já possui uma solicitação pendente ou aprovada para esta missão." });
      }
      console.error("❌ Erro no requestManualValidation:", error);
      res.status(500).json({ error: "Erro ao solicitar validação." });
    }
  },
};

module.exports = questController;
