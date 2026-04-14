const TrainingQuiz = require('../models/TrainingQuiz');
const User = require('../models/User');
const Disciplina = require('../models/Disciplina');
const RAGService = require('../services/RAGService');
const aiRotatorService = require('../services/AIRotatorService');
const SimpleAIQueue = require('../services/SimpleAIQueue');
const TrainingQuizAttempt = require('../models/TrainingQuizAttempt');
const mongoose = require('mongoose');

/**
 * 🛡️ BLINDAGEM ANTI-JAILBREAK (Regra PJC 3.3)
 * Bloqueia tentativas de Prompt Injection e desvio de conduta da IA.
 */
const sanitizeAIInput = (text) => {
    if (!text) return '';
    const jailbreakPattern = /ignore|instruç|previous|system|prompt|jailbreak|developer|mode|resete|aja como|você agora é/gi;
    return String(text).replace(jailbreakPattern, '[REMOVIDO]').substring(0, 3000);
};

/**
 * Mágica IA: Gera simulado baseado no material real (RAG)
 */
exports.generateAIQuestions = async (req, res) => {
    try {
        const disciplinaId = String(req.body.disciplinaId);
        const topico = sanitizeAIInput(String(req.body.topico));
        const trimestre = req.body.trimestre;
        const dificuldade = String(req.body.dificuldade || 'MEDIO');
        const quantidade = Number(req.body.quantidade) || 5;
        const diretrizAdicional = req.body.diretrizAdicional ? sanitizeAIInput(String(req.body.diretrizAdicional)) : '';

        if (!disciplinaId || !topico) {
            return res.status(400).json({ error: 'Disciplina e Tópico são obrigatórios.' });
        }
        
        //req.disciplina vem do enrollmentGuard
        if (!req.disciplina) return res.status(404).json({ error: 'Disciplina não encontrada.' });

        // 1. Busca Contexto no RAG
        const contextResults = await RAGService.vectorSearch(topico, {
            disciplinaId,
            topico
        }, 8);

        const contextText = contextResults.map(r => r.chunkText).join('\n\n');
        
        if (!contextText) {
            console.warn(`⚠️ Nenhum contexto RAG encontrado para o tópico: ${topico}. Usando base de conhecimento geral.`);
        }

        // 2. Prompt Especialista (Regra X=X)
        // 🛡️ [M4 - PJC 3.3.5] Sanitização de Diretriz Extra (Anti-Prompt Injection de Professor)
        const diretrizSafe = diretrizAdicional 
            ? String(diretrizAdicional).slice(0, 1000).replace(/ignore|instrução anterior|system prompt|jailbreak|aja como|developer mode/gi, '[REMOVIDO]')
            : '';

        const systemPrompt = `Você é o Oráculo GIL, um mentor pedagógico de alto nível da ETE. 
        Sua missão é gerar um simulado de ${quantidade} questões de múltipla escolha sobre o assunto "${topico}".
        Nível de Dificuldade solicitado: ${dificuldade}.
        
        CONDIÇÕES OBRIGATÓRIAS:
        1. REGRA X=X: Use EXATAMENTE os termos técnicos e conceitos presentes no contexto fornecido. Não invente definições.
        2. FORMATO: Gere 4 alternativas por questão (A, B, C, D).
        3. RESPOSTA: Forneça o index da resposta correta (0 a 3).
        4. EXPLICAÇÃO: Para cada questão, escreva uma explicação pedagógica curta (máximo 2 linhas) para o aluno que errar.
        5. LINGUAGEM: Use um tom incentivador e focado em pesquisa científica.
        ${diretrizSafe ? `6. DIRETRIZ EXTRA DO PROFESSOR: ${diretrizSafe}` : ''}

        CONTEXTO DO MATERIAL DIDÁTICO DO PROFESSOR:
        ${contextText || 'Não há material específico. Use conhecimento acadêmico padrão brasileiro.'}

        Retorne APENAS um JSON puro no formato:
        {
          "titulo": "Simulado PJC: [Nome do Assunto]",
          "questoes": [
            {
              "pergunta": "...",
              "alternativas": ["...", "...", "...", "..."],
              "respostaCorreta": 0,
              "explicacao": "..."
            }
          ]
        }`;

        const aiTask = async () => {
            const aiResponse = await aiRotatorService.ask(`Gere simulado sobre ${topico}`, systemPrompt, true);
            // Limpeza de Markdown
            const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanJson);
        };

        const quizData = await SimpleAIQueue.enqueue(aiTask, req.user.id);

        res.json({
            success: true,
            questions: quizData.questoes,
            titulo: quizData.titulo,
            contextUsed: !!contextText
        });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Falha ao gerar simulado via IA.' });
    }
};

/**
 * Cria um novo simulado de treino (Professor)
 */
exports.createQuiz = async (req, res) => {
    try {
        const disciplinaId = String(req.body.disciplinaId);
        const titulo = String(req.body.titulo);
        const topico = String(req.body.topico);
        const trimestre = req.body.trimestre;
        const dificuldade = String(req.body.dificuldade || 'MEDIO');
        const questoes = req.body.questoes;
        const professorId = req.user.id;

        if (!disciplinaId || !titulo || !topico || !questoes || questoes.length === 0) {
            return res.status(400).json({ error: 'Dados incompletos para criar o simulado.' });
        }

        // 🛡️ Validação de Propriedade (Professor)
        const disciplina = await Disciplina.findById(disciplinaId);
        if (!disciplina) return res.status(404).json({ error: 'Disciplina não encontrada.' });
        
        if (disciplina.professorId.toString() !== professorId && !['admin', 'dev'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Você não tem permissão para criar simulados nesta disciplina.' });
        }

        const quiz = await TrainingQuiz.create({
            disciplinaId,
            professorId,
            titulo,
            topico,
            trimestre,
            dificuldade,
            questoes
        });

        res.status(201).json({
            success: true,
            message: 'Simulado de treino criado com sucesso!',
            quizId: quiz._id
        });
    } catch (error) {
        console.error('Create Quiz Error:', error);
        res.status(500).json({ error: 'Erro ao criar simulado.' });
    }
};

/**
 * Lista simulados disponíveis para o aluno (baseado na disciplina atual)
 */
exports.listAvailableQuizzes = async (req, res) => {
    try {
        const disciplinaId = String(req.params.disciplinaId);
        const userId = req.user.id;

        const quizzes = await TrainingQuiz.find({ 
            disciplinaId, 
            ativa: true 
        }).sort({ createdAt: -1 });

        // Formata para indicar se o aluno já completou
        const formatted = quizzes.map(q => ({
            _id: q._id,
            titulo: q.titulo,
            topico: q.topico,
            trimestre: q.trimestre,
            dificuldade: q.dificuldade,
            recompensa: q.recompensa,
            jaConcluiu: q.concluidoPor.some(c => c.userId.toString() === userId)
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar simulados.' });
    }
};

/**
 * Retorna um simulado específico com as questões
 */
exports.getQuizById = async (req, res) => {
    try {
        const id = String(req.params.id);
        const quiz = await TrainingQuiz.findById(id).select('-concluidoPor');
        
        if (!quiz) return res.status(404).json({ error: 'Simulado não encontrado.' });
        
        // --- REGISTRO DE INÍCIO (BLINDAGEM PJC 2.0) ---
        // 🛡️ [L3 - PJC 3.3.5] Trava de Tempo: Só registra o startTime na PRIMEIRA vez que abre
        await TrainingQuizAttempt.findOneAndUpdate(
            { userId: req.user.id, quizId: id, status: 'PENDENTE' },
            { $setOnInsert: { startTime: Date.now() } },
            { upsert: true, new: true }
        );

        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar simulado.' });
    }
};

/**
 * Processa a conclusão do simulado e paga a recompensa cronometrada
 */
exports.submitQuizResult = async (req, res) => {
    try {
        const id = String(req.params.id);
        const acertos = Number(req.body.acertos);
        const userId = req.user.id;

        const quiz = await TrainingQuiz.findById(id);
        if (!quiz) return res.status(404).json({ error: 'Simulado não encontrado.' });

        // 1. Busca tentativa pendente para validar cronômetro real (SERVER-SIDE)
        const attempt = await TrainingQuizAttempt.findOne({ 
            userId: userId, 
            quizId: id, 
            status: 'PENDENTE' 
        });

        if (!attempt) {
            return res.status(400).json({ error: 'Nenhuma tentativa de treino iniciada encontrada.' });
        }

        // 2. Calcula tempo real (Ignora o tempoGeralSegundos do body por segurança)
        const tempoRealSegundos = Math.floor((Date.now() - attempt.startTime) / 1000);

        // 2. Validação de Desempenho (Mínimo 60% ou Nota 6.0)
        const totalQuestoes = quiz.questoes.length;
        const performance = acertos / totalQuestoes;

        if (performance < 0.6) {
            return res.status(400).json({ 
                error: 'Desempenho insuficiente.', 
                message: `Você acertou ${acertos} de ${totalQuestoes} (${Math.round(performance * 100)}%). A nota mínima para a recompensa é 6.0. Estude mais e tente novamente!` 
            });
        }

        // 3. Validação do Cronômetro de Bônus (Regras PJC 2.0)
        const segsPorQuestao = quiz.dificuldade === 'FACIL' ? 60 : (quiz.dificuldade === 'MEDIO' ? 120 : 240);
        const tempoLimiteBonus = totalQuestoes * segsPorQuestao;
        const ganhouBonus = tempoRealSegundos <= tempoLimiteBonus;

        let pcGanho = 0;
        let message = '';

        // 🛡️ [C1/C2/C3] TRANSAÇÃO ATÔMICA E CORREÇÃO DE TYPO (Blindagem 3.3)
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (ganhouBonus) {
                pcGanho = quiz.recompensa;
                
                // Paga a recompensa com proteção de transação
                await User.updateOne(
                    { _id: userId },
                    { $inc: { saldoPc: pcGanho } }, // [C3] maxPcAchieved removido (handled by pre-save hook)
                    { session }
                );

                // [C1/C2] REGISTRO ATÔMICO: Só adiciona se o aluno ainda não estiver no array (sem acento!)
                const updateQuiz = await TrainingQuiz.updateOne(
                    { 
                        _id: id, 
                        'concluidoPor.userId': { $ne: userId } // Trava atômica de unicidade
                    },
                    { $push: { concluidoPor: { userId, at: new Date() } } },
                    { session }
                );

                if (updateQuiz.modifiedCount === 0) {
                    throw new Error('Recompensa já resgatada por este usuário.');
                }
                
                message = `PARABÉNS! Você foi ágil e dominou o assunto! Recebeu ${pcGanho} PC$. 🚀`;
            } else {
                message = `Treino concluído com foco pedagógico! Infelizmente o bônus de PC$ expirou por tempo (${Math.round(tempoRealSegundos/60)}min). Continue praticando para ser mais rápido na próxima! 🧠`;
            }

            // Atualiza status da tentativa para histórico
            attempt.status = 'CONCLUIDO';
            attempt.endTime = Date.now();
            attempt.performance = Math.round(performance * 100);
            attempt.tempoTotal = tempoRealSegundos;
            await attempt.save({ session });

            await session.commitTransaction();
            session.endSession();

            const finalUser = await User.findById(userId);

            res.json({
                success: true,
                ganhouBonus,
                message,
                performance: Math.round(performance * 100),
                tempoGeralSegundos: tempoRealSegundos,
                novoSaldo: finalUser.saldoPc
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error('Submit Quiz Error:', error);
        res.status(500).json({ error: 'Erro ao processar resultado do treino.' });
    }
};

/**
 * Módulo de Descoberta: Retorna tópicos que possuem treinos ativos (Aluno)
 */
exports.getTopicsForStudent = async (req, res) => {
    try {
        const disciplinaId = String(req.params.disciplinaId);
        
        // Busca tópicos únicos que tenham pelo menos um quiz ativo
        const topics = await TrainingQuiz.distinct('topico', { 
            disciplinaId, 
            ativa: true 
        });

        res.json({
            success: true,
            topics: topics
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tópicos de treino.' });
    }
};
