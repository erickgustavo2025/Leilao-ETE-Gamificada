const QuizQuestion = require('../models/QuizQuestion');
const QuizResult = require('../models/QuizResult');
const AIRotatorService = require('../services/AIRotatorService');
const User = require('../models/User');

exports.getTeacherQuestions = async (req, res) => {
    try {
        const { disciplinaId } = req.query;
        const questions = await QuizQuestion.find({ 
            disciplinaId,
            professorId: req.user.id 
        }).sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar questões.' });
    }
};

exports.generateAIQuestions = async (req, res) => {
    try {
        const { disciplinaId, tema, ano, quantidade = 5 } = req.body;
        
        const systemPrompt = `Você é um professor PhD especialista. Gere ${quantidade} questões de múltipla escolha sobre o tema "${tema}" para o ${ano}º ano do Ensino Médio. 
        Retorne APENAS um JSON válido no formato: 
        {"questions": [{"pergunta": "...", "opcoes": ["A", "B", "C", "D"], "respostaCorreta": 0, "explicacao": "..."}]}`;

        const aiResponse = await AIRotatorService.ask(`Gere as questões sobre ${tema}`, systemPrompt, true);
        
        // Limpeza de possíveis markdown na resposta da IA
        const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
        const { questions } = JSON.parse(cleanJson);

        const savedQuestions = await Promise.all(questions.map(q => {
            return QuizQuestion.create({
                ...q,
                professorId: req.user.id,
                disciplinaId,
                ano,
                origem: 'IA'
            });
        }));

        res.json({ message: `${savedQuestions.length} questões geradas com sucesso!`, questions: savedQuestions });
    } catch (error) {
        console.error('AI Quiz Error:', error);
        res.status(500).json({ message: 'Falha ao gerar questões via IA.' });
    }
};

exports.submitQuizAnswer = async (req, res) => {
    try {
        const { questionId, respostaDada, tempoResposta } = req.body;
        const alunoId = req.user.id;

        const question = await QuizQuestion.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Questão não encontrada.' });

        const isCorreto = question.respostaCorreta === respostaDada;
        
        // Gamificação: Recompensas
        let xpGanho = 0;
        let pcGanho = 0;

        if (isCorreto) {
            xpGanho = question.dificuldade === 'DIFICIL' ? 50 : (question.dificuldade === 'MEDIO' ? 30 : 15);
            pcGanho = Math.floor(xpGanho / 2);

            // Atualiza Aluno
            await User.findByIdAndUpdate(alunoId, {
                $inc: { xp: xpGanho, saldoPc: pcGanho }
            });
        }

        // Registro Científico (Snapshot PJC)
        const aluno = await User.findById(alunoId);
        const result = await QuizResult.create({
            alunoId,
            questionId,
            disciplinaId: question.disciplinaId,
            acertou: isCorreto,
            respostaDada,
            tempoResposta,
            recompensa: { xp: xpGanho, saldoPc: pcGanho },
            snapshot: {
                xpAtual: aluno.xp,
                saldoAtual: aluno.saldoPc,
                trimestre: '2026-T1'
            }
        });

        res.json({ 
            correto: isCorreto, 
            explicacao: question.explicacao,
            recompensa: result.recompensa 
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar resposta.' });
    }
};
