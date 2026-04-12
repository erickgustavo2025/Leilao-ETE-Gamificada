const aiRotatorService = require("../services/AIRotatorService");

// ── ROTA: POST /api/ai/ask ───────────────────────────────────────────
exports.processAIRequest = async (req, res) => {
    try {
        const { pergunta, paginaOrigem, sessionId } = req.body;
        const userId = req.user.id;
        const { v4: uuidv4 } = require('uuid');

        if (!pergunta || pergunta.trim().length < 1) {
            return res.status(400).json({ error: "Pergunta vazia." });
        }

        const user = await User.findById(userId).select(
            "nome turma saldoPc maxPcAchieved cargos notas investments"
        );
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        let session = null;
        let historyMessages = [];

        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId });
            if (session) {
                historyMessages = session.messages.slice(-10).map(m => ({
                    role: m.role === "ai" ? "assistant" : "user",
                    content: m.content
                }));
            }
        }

        if (!session) {
            session = await ChatSession.create({ userId, messages: [], paginaOrigem });
        }

        const modo = detectMode(pergunta, paginaOrigem || "");
        let contextRAG = "";
        
        const pageCtx = PAGE_CONTEXTS[paginaOrigem] || "";
        const dadosAluno = `Nome: ${user.nome} | Turma: ${user.turma} | Saldo: ${user.saldoPc} PC$ | Rank: ${user.maxPcAchieved} PC$ máx`;
        const systemPrompt = SYSTEM_PROMPT_BASE
            .replace("{PAGINA_ATUAL}", `${paginaOrigem}. ${pageCtx}`)
            .replace("{DADOS_ALUNO}", dadosAluno)
            + contextRAG;

        // Decidimos se preferimos NVIDIA pela velocidade ou Gemini pela pedagogia
        const preferNvidia = (modo === "CONSULTOR" || modo === "SUPORTE");

        console.log(`🤖 [Oráculo] Processando modo: ${modo} (${preferNvidia ? "NVIDIA" : "GEMINI"} priority)`);
        
        const resposta = await aiRotatorService.ask(pergunta, systemPrompt, preferNvidia);
        const modoUsado = preferNvidia ? "NVIDIA/GEMINI" : "GEMINI"; // Rotator decide internamente

        // 7. Salva na sessão
        const uniqueInteractionId = uuidv4();

        session.messages.push({ role: "user", content: pergunta });
        session.messages.push({
            role: "ai",
            content: resposta,
            interactionId: uniqueInteractionId,
            userRating: 0
        });

        if (session.messages.length <= 2) {
            session.title = pergunta.substring(0, 40) + (pergunta.length > 40 ? "..." : "");
        }

        session.updatedAt = new Date();
        await session.save();

        // 8. Snapshot para Analytics
        const snapshot = {
            n1_media: user.notas?.n1?.length ? user.notas.n1.reduce((a, b) => a + b, 0) / user.notas.n1.length : null,
            n2_media: user.notas?.n2?.length ? user.notas.n2.reduce((a, b) => a + b, 0) / user.notas.n2.length : null,
            redacao_media: user.notas?.redacoes?.length ? user.notas.redacoes.reduce((a, b) => a + b, 0) / user.notas.redacoes.length : null,
            simulado_enem_score: user.notas?.simulados?.length ? user.notas.simulados[user.notas.simulados.length - 1] : null,
            saldoPc: user.saldoPc,
            maxPcAchieved: user.maxPcAchieved,
            trimestre: `${new Date().getFullYear()}-T${Math.ceil((new Date().getMonth() + 1) / 4)}`
        };

        // 9. Salvar Interação Histórica
        try {
            await AIInteraction.create({
                interactionId: uniqueInteractionId,
                userId,
                sessionId: session._id,
                pergunta,
                resposta,
                modo,
                modoUsado,          // registra qual motor respondeu (GEMINI ou OPENROUTER)
                paginaOrigem,
                snapshotNotas: snapshot
            });
        } catch (e) {
            console.error("❌ Erro ao salvar histórico de interação:", e.message);
        }

        res.json({
            resposta,
            modo,
            modoUsado,
            sessionId: session._id,
            interactionId: uniqueInteractionId
        });

    } catch (error) {
        console.error("❌ Erro no Oráculo:", error.message);
        if (error.response?.status === 429) {
            return res.status(429).json({ error: "O Oráculo está muito ocupado. Tente em alguns segundos." });
        }
        res.status(500).json({ error: "Erro ao processar pergunta." });
    }
};

// ── ROTA: POST /api/ai/feedback ──────────────────────────────────────
exports.submitFeedback = async (req, res) => {
    try {
        const { sessionId, interactionId, avaliacao } = req.body;

        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({ error: "Avaliação inválida." });
        }

        await ChatSession.updateOne(
            { _id: sessionId, userId: req.user._id, "messages.interactionId": interactionId },
            { $set: { "messages.$.userRating": avaliacao } }
        );

        await AIInteraction.findOneAndUpdate(
            { interactionId, userId: req.user._id },
            { avaliacaoAluno: avaliacao }
        );

        res.json({ success: true });
    } catch (error) {
        console.error("❌ Erro no feedback:", error);
        res.status(500).json({ error: "Erro ao salvar feedback." });
    }
};

// ── ROTA: GET /api/ai/sessions ───────────────────────────────────────
exports.getSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.user._id })
            .select("_id title paginaOrigem updatedAt messages")
            .sort({ updatedAt: -1 })
            .limit(20);

        const summary = sessions.map(s => ({
            _id: s._id,
            title: s.title || (s.messages.length > 0 ? s.messages[0].content.substring(0, 50) + "..." : "Nova Conversa"),
            paginaOrigem: s.paginaOrigem,
            updatedAt: s.updatedAt,
            lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].content.substring(0, 50) + "..." : ""
        }));

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar sessões." });
    }
};

// ── ROTA: GET /api/ai/sessions/:id ───────────────────────────────────
exports.getSessionById = async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
        if (!session) return res.status(404).json({ error: "Sessão não encontrada." });
        res.json(session.messages);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar mensagens da sessão." });
    }
};

// ── ROTA: DELETE /api/ai/sessions/:id ────────────────────────────────
exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ChatSession.findOneAndDelete({ _id: id, userId: req.user._id });

        if (!deleted) return res.status(404).json({ error: "Sessão não encontrada." });

        await AIInteraction.deleteMany({ userId: req.user._id, sessionId: id });

        res.json({ success: true, message: "Conversa apagada e memória limpa." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar conversa." });
    }
};

// ── ROTA: PATCH /api/ai/sessions/:id ─────────────────────────────────
exports.renameSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle } = req.body;

        if (!newTitle || newTitle.trim().length < 2) {
            return res.status(400).json({ error: "Título inválido." });
        }

        const session = await ChatSession.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { title: newTitle.trim() },
            { new: true }
        );

        if (!session) return res.status(404).json({ error: "Sessão não encontrada." });

        res.json({ success: true, title: session.title });
    } catch (error) {
        res.status(500).json({ error: "Erro ao renomear conversa." });
    }
};
