// backend/src/controllers/aiController.js
const axios = require("axios");
const User = require("../models/User");
const AIInteraction = require("../models/AIInteraction");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { embedContent, getAvailableKey, markKeyAsQuoted } = require("../utils/geminiKeyManager");
const ChatSession = require("../models/ChatSession");
const DocumentEmbedding = require("../models/DocumentEmbedding");
const { SYSTEM_PROMPT_BASE, PAGE_CONTEXTS } = require("../config/aiSystemPrompt");



// ── HELPER: Produto Escalar ──────────────────────────────────────────
const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);

// ── DETECT MODE ──────────────────────────────────────────────────────
const detectMode = (pergunta, path) => {
    const p = pergunta.toLowerCase();
    if (p.includes("enem") || p.includes("redação") || p.includes("estudar") ||
        p.includes("matéria") || p.includes("cronograma") || p.includes("prova")) return "TUTOR";
    if (p.includes("investir") || p.includes("ação") || p.includes("cripto") ||
        p.includes("carteira") || p.includes("dividendo") || (path && path.includes("/gil-investe"))) return "CONSULTOR";
    return "SUPORTE";
};

async function callGemini(messages, systemPrompt, modelName = "gemini-flash-lite-latest") {
    const keyData = getAvailableKey();
    if (!keyData) throw new Error("429"); 

    try {
        const genAI = new GoogleGenerativeAI(keyData.key);
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const chat = model.startChat({
            history: messages.slice(0, -1).map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }))
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        return result.response.text();
    } catch (err) {
        const errMsg = err?.message || "";
        if (err?.status === 429 || err?.response?.status === 429 || errMsg.includes("429")) {
            markKeyAsQuoted(keyData.index);
            throw new Error("429"); 
        }
        if (errMsg.includes("503") || errMsg.includes("Service Unavailable")) {
            throw new Error("503");
        }
        throw err;
    }
}

// ── RESERVA: OPENROUTER (entra só se o Gemini falhar) ────────────────
async function callOpenRouter(messages, systemPrompt) {
    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            max_tokens: 1024,
            temperature: 0.5,
        },
        {
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}` },
            timeout: 15000,
        }
    );
    return response.data.choices[0].message.content;
}

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

        const messagesPayload = [
            ...historyMessages,
            { role: "user", content: pergunta }
        ];

        let resposta;
        let modoUsado = "GEMINI";
        let loopSucesso = false;

        // --- HIERARQUIA DE FALLBACK ---
        // 1. TENTA LITE (Maior cota)
        try {
            console.log("⚡ Tentando Nível 1: Gemini Lite...");
            resposta = await callGemini(messagesPayload, systemPrompt, "gemini-flash-lite-latest");
            loopSucesso = true;
        } catch (err) {
            console.warn(`⚠️ Nível 1 falhou (${err.message}). Pulando para Nível 2...`);
            
            // 2. TENTA GEMINI 2.5 (Modelo Alternativo VIP)
            try {
                console.log("⚡ Tentando Nível 2: Gemini 2.5...");
                resposta = await callGemini(messagesPayload, systemPrompt, "gemini-2.5-flash");
                loopSucesso = true;
            } catch (err2) {
                console.warn(`⚠️ Nível 2 falhou (${err2.message}). Acionando RECURSO FINAL...`);
                
                // 3. OPENROUTER (Nvidia Nemotron)
                try {
                    console.log("⚡ Acionando Nível 3: OpenRouter (Nvidia)...");
                    modoUsado = "OPENROUTER";
                    resposta = await callOpenRouter(messagesPayload, systemPrompt);
                    loopSucesso = true;
                } catch (errOR) {
                    console.error("❌ Todos os níveis de IA falharam:", errOR.message);
                }
            }
        }

        if (!loopSucesso) {
            throw new Error("Sistemas de IA indisponíveis no momento. Tente novamente em breve.");
        }

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
