// backend/src/controllers/aiController.js
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const AIInteraction = require("../models/AIInteraction");
const ChatSession = require("../models/ChatSession");
const DocumentEmbedding = require("../models/DocumentEmbedding");
const { SYSTEM_PROMPT_BASE, PAGE_CONTEXTS } = require("../config/aiSystemPrompt");

// Embeddings continuam no Gemini (text-embedding-004 tem 1500 req/dia grátis)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// ── CHAMAR OPENROUTER (substitui Gemini para geração de texto) ───────
async function callOpenRouter(messages, systemPrompt) {
    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "qwen/qwen3.6-plus:free", // MODELO EXATO CONFORME ORDEM DE SERVIÇO
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            max_tokens: 1024,
            temperature: 0.7,
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
                "X-Title": "ETE Gamificada 2K26 — Oráculo GIL",
            },
            timeout: 30000, // 30s timeout
        }
    );
    return response.data.choices[0].message.content;
}

// ── ROTA: POST /api/ai/ask ───────────────────────────────────────────
exports.processAIRequest = async (req, res) => {
    try {
        const { pergunta, paginaOrigem, sessionId } = req.body;
        const userId = req.user.id;

        // Validação
        if (!pergunta || pergunta.trim().length < 3) {
            return res.status(400).json({ error: "Pergunta muito curta." });
        }

        // 1. Dados do aluno
        const user = await User.findById(userId).select(
            "nome turma saldoPc maxPcAchieved cargos notas investments"
        );
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        // 2. Recuperar sessão e histórico (se sessionId fornecido)
        let session = null;
        let historyMessages = [];

        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId });
            if (session) {
                // Pega as últimas 10 mensagens para contexto (não mandar tudo para economizar tokens)
                historyMessages = session.messages.slice(-10).map(m => ({
                    role: m.role === "ai" ? "assistant" : "user",
                    content: m.content
                }));
            }
        }

        // Se não tem sessão, cria uma nova
        if (!session) {
            session = await ChatSession.create({ userId, messages: [], paginaOrigem });
        }

        // 3. Modo e RAG
        const modo = detectMode(pergunta, paginaOrigem || "");
        let contextRAG = "";

        if (modo === "TUTOR" || modo === "CONSULTOR") {
            try {
                const modelEmb = genAI.getGenerativeModel({ model: "text-embedding-004" });
                const resEmb = await modelEmb.embedContent(pergunta);
                const queryVector = resEmb.embedding.values;

                const docs = await DocumentEmbedding.find({
                    categoria: modo === "TUTOR" ? { $regex: /ENEM/ } : "FINANCEIRO"
                }).select("chunkText embedding").limit(50);

                const scored = docs
                    .map(d => ({ text: d.chunkText, score: dotProduct(queryVector, d.embedding) }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3);

                if (scored.length > 0) {
                    contextRAG = `\n\nCONHECIMENTO RELEVANTE:\n"""\n${scored.map(s => s.text).join("\n\n")}\n"""`;
                }
            } catch (embErr) {
                // RAG falhou (pode ser limite de embedding), mas não bloqueia a resposta
                console.error("⚠️ RAG falhou, respondendo sem contexto:", embErr.message);
            }
        }

        // 4. Monta System Prompt
        const pageCtx = PAGE_CONTEXTS[paginaOrigem] || "";
        const dadosAluno = `Nome: ${user.nome} | Turma: ${user.turma} | Saldo: ${user.saldoPc} PC$ | Rank: ${user.maxPcAchieved} PC$ máx`;
        const systemPrompt = SYSTEM_PROMPT_BASE
            .replace("{PAGINA_ATUAL}", `${paginaOrigem}. ${pageCtx}`)
            .replace("{DADOS_ALUNO}", dadosAluno)
            + contextRAG;

        // 5. Monta mensagens com histórico
        const messagesPayload = [
            ...historyMessages,
            { role: "user", content: pergunta }
        ];

        // 6. Chama OpenRouter
        const resposta = await callOpenRouter(messagesPayload, systemPrompt);

        // 7. Salva na sessão
        session.messages.push({ role: "user", content: pergunta });
        session.messages.push({ role: "ai", content: resposta });
        
        // Atualiza o título se for a primeira mensagem
        if (session.messages.length <= 2) {
            session.title = pergunta.substring(0, 40) + (pergunta.length > 40 ? "..." : "");
        }
        
        session.updatedAt = new Date();
        await session.save();

        // 8. Restaurar snapshot exato (FIX 2)
        const snapshot = {
            n1_media: user.notas?.n1?.length ? user.notas.n1.reduce((a,b)=>a+b,0)/user.notas.n1.length : null,
            n2_media: user.notas?.n2?.length ? user.notas.n2.reduce((a,b)=>a+b,0)/user.notas.n2.length : null,
            redacao_media: user.notas?.redacoes?.length ? user.notas.redacoes.reduce((a,b)=>a+b,0)/user.notas.redacoes.length : null,
            simulado_enem_score: user.notas?.simulados?.length ? user.notas.simulados[user.notas.simulados.length-1] : null,
            saldoPc: user.saldoPc, 
            maxPcAchieved: user.maxPcAchieved,
            trimestre: `${new Date().getFullYear()}-T${Math.ceil((new Date().getMonth()+1)/4)}`
        };

        // 9. Capturar ID síncrono (FIX 1)
        let interactionId;
        try {
            const interaction = await AIInteraction.create({ 
                userId, 
                pergunta, 
                resposta, 
                modo, 
                paginaOrigem, 
                snapshotNotas: snapshot 
            });
            interactionId = interaction._id.toString();
        } catch (e) { 
            console.error("❌ Erro ao salvar interação:", e); 
        }

        res.json({ resposta, modo, sessionId: session._id, interactionId });

    } catch (error) {
        console.error("❌ Erro no Oráculo:", error.message);
        
        // Mensagem amigável baseada no tipo de erro
        if (error.response?.status === 429) {
            return res.status(429).json({ error: "O Oráculo está muito ocupado. Tente em alguns segundos." });
        }
        res.status(500).json({ error: "Erro ao processar pergunta." });
    }
};

// ── ROTA: POST /api/ai/feedback ──────────────────────────────────────
exports.submitFeedback = async (req, res) => {
    try {
        const { interactionId, avaliacao } = req.body;
        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            return res.status(400).json({ error: "Avaliação inválida." });
        }
        await AIInteraction.findOneAndUpdate(
            { _id: interactionId, userId: req.user._id },
            { avaliacaoAluno: avaliacao }
        );
        res.json({ success: true });
    } catch (error) {
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

        // Retorna resumo (sem messages completas)
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
