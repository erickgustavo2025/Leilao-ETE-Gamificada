const aiRotatorService = require("../services/AIRotatorService");
const RAGService = require("../services/RAGService");
const User = require("../models/User");
const ChatSession = require("../models/ChatSession");
const AIInteraction = require("../models/AIInteraction");
const SystemConfig = require("../models/SystemConfig");
const TrainingQuiz = require("../models/TrainingQuiz"); // <--- ADICIONADO
const SimpleAIQueue = require("../services/SimpleAIQueue");
const { detectMode, formatEmentaContext } = require("../utils/aiHelpers");
const { getYearFromClass } = require("../utils/economyRules"); // <--- ADICIONADO
const { SYSTEM_PROMPT_BASE, PAGE_CONTEXTS } = require("../config/aiSystemPrompt");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

/**
 * 🛡️ BLINDAGEM ANTI-JAILBREAK (Regra PJC 3.3)
 */
const sanitizeAIInput = (text) => {
    if (!text) return '';
    // 🛡️ [C3 - Blindagem] Regex Expandido contra Prompt Injection & Jailbreak (PJC 3.3.5)
    const jailbreakPattern = /ignore|instruç|previous|system|prompt|jailbreak|developer|mode|resete|aja como|você agora é|forget everything|disregard|imagine you are|override|bypass|dan mode|claro, aqui está|análise de vulnerabilidade/gi;
    return String(text).replace(jailbreakPattern, '[REMOVIDO]').substring(0, 3000);
};

// ── ROTA: POST /api/ai/ask (PJC 2.0 Hardened) ──────────────────────────
exports.processAIRequest = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(404).json({ error: "Usuário não autenticado." });

        const isStaff = ['admin', 'dev', 'monitor', 'professor'].includes(user.role);
        const userId = user.id;

        const { sessionId, pergunta, paginaOrigem, disciplinaId: bodyDiscId } = req.body;
        
        // 🛡️ [C6] Validação de Tamanho do Prompt
        if (pergunta && String(pergunta).length > 3000) {
            return res.status(400).json({ error: "Sua pergunta é longa demais! O Oráculo GIL prefere perguntas mais diretas (máximo 3.000 caracteres)." });
        }

        const disciplinaId = bodyDiscId || ((paginaOrigem && paginaOrigem.includes(":")) ? paginaOrigem.split(":")[1] : null);

        // Prepara Sessão
        let session = null;
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            session = await ChatSession.findOne({ _id: sessionId, userId });
        }
        if (!session) {
            session = await ChatSession.create({ userId, messages: [], paginaOrigem });
        }

        const modo = detectMode(String(pergunta), paginaOrigem || "");
        
        // 🔍 RAG: Busca Contextual Pedagógica e EMENTA
        let contextRAG = "";
        let contextEmenta = "";
        let ragScore = 0;

        try {
            if (disciplinaId && mongoose.Types.ObjectId.isValid(disciplinaId)) {
                // Pega Configurações do Sistema
                const config = await SystemConfig.findOne({ key: 'general' }) || { currentTrimester: 1 };
                const anoAluno = isStaff ? null : getYearFromClass(user.turma);
                const trimAtivo = config.currentTrimester;

                const ragFilters = { disciplinaId };
                if (!isStaff && anoAluno) {
                    ragFilters.ano = String(anoAluno);
                    ragFilters.trimestre = trimAtivo;
                }

                // 1. Busca Ementas (Alta Prioridade)
                const ementas = await RAGService.vectorSearch(String(pergunta), { ...ragFilters, categoria: 'EMENTA' }, 2);
                contextEmenta = formatEmentaContext(ementas);

                // 2. Busca Conteúdo Geral
                const results = await RAGService.vectorSearch(String(pergunta), ragFilters, 3);
                if (results.length > 0) {
                    ragScore = results[0].score || 0;
                    contextRAG = "\n\n📖 CONTEXTO ADICIONAL DO PROFESSOR:\n" + 
                        results.filter(r => r.categoria !== 'EMENTA').map(r => `[Fonte: ${r.sourceDocument}] ${r.chunkText}`).join("\n---\n");
                }
            }
        } catch (ragErr) {
            console.error("⚠️ RAG Search failed:", ragErr.message);
        }
        
        // 📊 ANÁLISE PEDAGÓGICA (Média 6.0)
        let pedagogicalStatus = "NORMAL";
        if (!isStaff && user.notas) {
            const allGrades = [...(user.notas.n1 || []), ...(user.notas.n2 || [])];
            if (allGrades.length > 0) {
                const avg = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
                if (avg < 6.0) pedagogicalStatus = "ALERTA_ABAIXO_DA_MEDIA";
            }
        }

        const pageCtx = PAGE_CONTEXTS[paginaOrigem] || "";
        const dadosAluno = `Nome: ${user.nome} | Turma: ${user.turma} | Saldo: ${user.saldoPc} PC$ | Status Acadêmico: ${pedagogicalStatus}`;
        
        let systemPrompt = SYSTEM_PROMPT_BASE
            .replace("{PAGINA_ATUAL}", `${paginaOrigem}. ${pageCtx}`)
            .replace("{DADOS_ALUNO}", dadosAluno)
            + contextEmenta
            + contextRAG;

        // 🟢 INSTRUÇÃO DE LINGUAGEM ADAPTATIVA & SIMULADOS (PJC 2.0)
        systemPrompt += "\n\n📢 DIRETRIZ DE COMUNICAÇÃO: Observe o modo como o aluno escreve. Adapte sua resposta para ser fluida, usando gírias leves se ele usar, mas mantendo o rigor científico nos conceitos.";
        systemPrompt += "\n\n📢 FLUXO DE SIMULADOS DE TREINO (PJC 2.0):";
        systemPrompt += "\n1. Se você explicou um tópico desta disciplina, PERGUNTE: 'Quer fazer um questionário de treino do assunto [Assunto X] que acabamos de ver? Vale até 10 PC$!'";
        systemPrompt += "\n2. Se o aluno disser SIM ou aceitar, PERGUNTE: 'Qual nível de dificuldade você quer enfrentar? Fácil, Médio ou Difícil?'";
        systemPrompt += "\n3. Se o aluno escolher a dificuldade, ENCERRE sua fala confirmando a escolha. O sistema abrirá o desafio automaticamente.";
        systemPrompt += "\n4. IMPORTANTE: Seja proativo, mas não insista se o aluno mudar de assunto.";

        // Injeção de Puxão de Orelha (Regra 6.0)
        if (pedagogicalStatus === "ALERTA_ABAIXO_DA_MEDIA") {
            systemPrompt += "\n\n⚠️ INSTRUÇÃO PEDAGÓGICA: O aluno está com média abaixo de 6.0. Seja mais rigoroso com a concessão de respostas prontas, incentive o uso dos Materiais de Apoio e foque na superação acadêmica.";
        }

        const preferNvidia = (modo === "CONSULTOR" || modo === "SUPORTE");

        // 🧠 MEMÓRIA CONVERSACIONAL (PJC 2.0): Recupera as últimas 10 mensagens para contexto
        const history = (session.messages || []).slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));

        const cleanPergunta = sanitizeAIInput(pergunta);

        // 📝 DEFINIÇÃO DA TASK PARA A FILA
        const aiTask = async () => {
            const resposta = await aiRotatorService.ask(cleanPergunta, systemPrompt, { 
                disciplinaId, 
                preferNvidia,
                history 
            });
            const modoUsado = preferNvidia ? "NVIDIA/GEMINI" : "GEMINI";
            const uniqueInteractionId = uuidv4();

            // 🔍 Lógica PJC 2.0: Detectar se o aluno escolheu uma dificuldade e buscar o Quiz
            let suggestedQuiz = null;
            const perguntaLower = cleanPergunta.toLowerCase();
            const dificuldadesMap = { 'fácil': 'FACIL', 'facil': 'FACIL', 'médio': 'MEDIO', 'medio': 'MEDIO', 'difícil': 'DIFICIL', 'dificil': 'DIFICIL' };
            const escolha = Object.keys(dificuldadesMap).find(d => perguntaLower.includes(d));

            if (escolha) {
                const dificuldadeDB = dificuldadesMap[escolha];
                let targetDiscId = disciplinaId;

                // 🕵️ [C9] Detecção Automática de Disciplina (se estiver no Hub/Geral)
                if (!targetDiscId) {
                    const Disciplina = require("../models/Disciplina");
                    // Tenta achar pelo nome ou tópicos da ementa
                    const allDiscs = await Disciplina.find({ ativa: true });
                    const match = allDiscs.find(d => 
                        perguntaLower.includes(d.nome.toLowerCase()) || 
                        d.ementaTopics?.some(t => t.assuntos.some(a => perguntaLower.includes(a.toLowerCase())))
                    );
                    
                    if (match) {
                        targetDiscId = match._id;
                    } else {
                        // 🟢 Fallback: Cria/Recupera disciplina de "Auto-estudo"
                        let autoStudy = await Disciplina.findOne({ nome: /Auto-estudo/i });
                        if (!autoStudy) {
                            autoStudy = await Disciplina.create({ 
                                nome: 'Auto-estudo (IA)', 
                                ano: user.turma ? user.turma[0] : '1', 
                                curso: 'COMUM', 
                                ativa: true, 
                                ementa: 'Estudos independentes gerados pelo Oráculo.' 
                            });
                        }
                        targetDiscId = autoStudy._id;
                    }
                }

                // 📚 Busca Simulado Existente
                suggestedQuiz = await TrainingQuiz.findOne({ 
                    disciplinaId: targetDiscId, 
                    dificuldade: dificuldadeDB,
                    ativa: true 
                }).sort({ createdAt: -1 }).select('_id titulo topico dificuldade recompensa');

                // 🧪 [NOVO] Geração On-Demand se não houver no banco
                if (!suggestedQuiz && targetDiscId) {
                    try {
                        console.log(`🚀 [AI-Gen] Gerando simulado de "${cleanPergunta}" para ${targetDiscId}...`);
                        const config = await SystemConfig.findOne({ key: 'general' }) || { currentTrimester: 1 };
                        
                        const aiQuizData = await aiRotatorService.generateStructuredQuiz(cleanPergunta.substring(0, 30), dificuldadeDB);
                        
                        suggestedQuiz = await TrainingQuiz.create({
                            disciplinaId: targetDiscId,
                            titulo: aiQuizData.titulo || `Desafio de ${cleanPergunta.substring(0, 20)}`,
                            topico: aiQuizData.topico || cleanPergunta.substring(0, 20),
                            trimestre: config.currentTrimester || 1,
                            dificuldade: dificuldadeDB,
                            questoes: aiQuizData.questoes,
                            isAiGenerated: true,
                            recompensa: 10
                        });
                        console.log(`✅ [AI-Gen] Simulado gerado e salvo: ${suggestedQuiz._id}`);
                    } catch (genErr) {
                        console.error("⚠️ Erro na geração on-demand:", genErr.message);
                    }
                }
            }

            // Salva na sessão (rebusca para garantir estado atual se houver latência)
            const freshSession = await ChatSession.findById(session._id);
            freshSession.messages.push({ role: "user", content: cleanPergunta });
            freshSession.messages.push({
                role: "ai",
                content: resposta,
                interactionId: uniqueInteractionId,
                userRating: 0,
                metadata: { suggestedQuiz } // Passa para o histórico
            });

            if (freshSession.messages.length <= 2) {
                freshSession.title = cleanPergunta.substring(0, 40) + (cleanPergunta.length > 40 ? "..." : "");
            }
            freshSession.updatedAt = new Date();
            await freshSession.save();

            // Snapshot para Analytics
            const snapshot = {
                n1_media: user.notas?.n1?.length ? user.notas.n1.reduce((a, b) => a + b, 0) / user.notas.n1.length : null,
                n2_media: user.notas?.n2?.length ? user.notas.n2.reduce((a, b) => a + b, 0) / user.notas.n2.length : null,
                saldoPc: user.saldoPc,
                maxPcAchieved: user.maxPcAchieved
            };

            // Salva Interação Histórica
            await AIInteraction.create({
                interactionId: uniqueInteractionId,
                userId,
                sessionId: freshSession._id,
                disciplinaId,
                pergunta: cleanPergunta,
                resposta,
                modo,
                modoUsado,
                paginaOrigem,
                snapshotNotas: snapshot,
                metadata: { ragScore, disciplinaId, suggestedQuiz }
            });

            return {
                resposta,
                modo,
                modoUsado,
                sessionId: freshSession._id,
                interactionId: uniqueInteractionId,
                metadata: { suggestedQuiz, ragScore, disciplinaId }, // ✅ Enviando metadados completos
                suggestedQuiz // Mantendo no root por compatibilidade
            };
        };

        // 🚀 ENTRAR NA FILA E AGUARDAR (C1 - RESPOSTA DIRETA)
        const result = await SimpleAIQueue.enqueue(aiTask, userId);
        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("❌ Erro no Oráculo:", error.message);
        res.status(500).json({ error: "Erro ao processar sua pergunta. O Oráculo pode estar sobrecarregado, tente novamente em segundos." });
    }
};

// ── ROTA: GET /api/ai/status/:requestId ──────────────────────────────
exports.checkQueueStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const status = SimpleAIQueue.getStatus(requestId);

        if (status.status === 'NOT_FOUND') {
            return res.status(404).json({ error: "Requisição não encontrada ou expirada." });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: "Erro ao consultar status da fila." });
    }
};

// ── ROTA: GET /api/ai/onboarding/:disciplinaId ────────────────────────
exports.getOnboardingGreeting = async (req, res) => {
    try {
        const { disciplinaId } = req.params;
        const userId = req.user.id;

        if (!disciplinaId || !mongoose.Types.ObjectId.isValid(disciplinaId)) {
            return res.status(400).json({ error: "ID de disciplina inválido." });
        }

        const user = await User.findById(userId).select("nome turma saldoPc");
        const config = await SystemConfig.findOne({ key: 'general' }) || { currentTrimester: 1 };
        
        const anoAluno = getYearFromClass(user.turma);
        const trimAtivo = config.currentTrimester;

        // Busca a ementa da disciplina ESPECÍFICA para o ano e trimestre atuais
        const ementas = await RAGService.vectorSearch("objetivos ementa trimestre cronograma", { 
            disciplinaId, 
            categoria: 'EMENTA',
            ano: anoAluno,
            trimestre: trimAtivo
        }, 5);

        let greeting = `OLÁ, ${user.nome.split(' ')[0].toUpperCase()}! EU SOU O ORÁCULO GIL.`;
        
        if (ementas.length > 0) {
            const temas = ementas.map(e => e.chunkText.substring(0, 100)).join("... ");
            greeting += `\nESTOU PRONTO PARA TE AJUDAR COM OS CONTEÚDOS DESTA DISCIPLINA.`;
            greeting += `\nDE ACORDO COM A EMENTA DO SEU PROFESSOR, ESTAREMOS FOCADOS EM TEMAS COMO: ${temas.substring(0, 200)}...`;
            greeting += `\nRELEMBRE: VOCÊ PODE ME PEDIR EXPLICAÇÕES, EXERCÍCIOS OU AJUDA COM AS AÇÕES DO BECO DIAGONAL.`;
        } else {
            greeting += `\nESTOU PRONTO PARA TE AJUDAR! SEU PROFESSOR AINDA NÃO SUBIU A EMENTA OFICIAL, MAS POSSO RESPONDER DÚVIDAS GERAIS OU SOBRE ECONOMIA.`;
        }

        res.json({
            greeting,
            timestamp: new Date(),
            suggestedQueries: [
                "O que vamos aprender este trimestre?",
                "Me ajude com um exercício",
                "Como está minha carteira de investimentos?"
            ]
        });

    } catch (error) {
        console.error("❌ Erro no Onboarding:", error.message);
        res.status(500).json({ error: "Erro ao gerar boas-vindas do Oráculo." });
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
