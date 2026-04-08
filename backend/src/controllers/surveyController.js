const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// --- ESTUDANTE ---

/**
 * Retorna a pesquisa ativa atual para o aluno
 */
exports.getActiveSurvey = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Busca a pesquisa ativa
        const survey = await Survey.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (!survey) return res.json({ available: false });

        // Verifica se o aluno já respondeu
        const alreadyResponded = await SurveyResponse.findOne({ userId, surveyId: survey._id });
        if (alreadyResponded) return res.json({ available: false, alreadyDone: true });

        res.json({ available: true, survey });
    } catch (error) {
        console.error('❌ Erro ao buscar pesquisa ativa:', error);
        res.status(500).json({ error: 'Erro ao carregar pesquisa.' });
    }
};

/**
 * Submete as respostas do aluno e concede o prêmio em PC$
 */
exports.submitResponse = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { surveyId, answers } = req.body;

        if (!surveyId || !answers) {
            throw new Error('Dados da pesquisa incompletos.');
        }

        const survey = await Survey.findById(surveyId).session(session);
        if (!survey || !survey.isActive) {
            throw new Error('Esta pesquisa não está mais ativa.');
        }

        // Verifica se já respondeu (Segurança extra)
        const existing = await SurveyResponse.findOne({ userId, surveyId }).session(session);
        if (existing) {
            throw new Error('Você já participou desta pesquisa!');
        }

        // Salva a resposta
        await SurveyResponse.create([{
            userId,
            surveyId,
            answers
        }], { session });

        // Concede a recompensa
        const reward = survey.rewardAmount || 100;
        await User.findByIdAndUpdate(userId, {
            $inc: { saldoPc: reward }
        }, { session });

        // Registra transação
        const admin = await User.findOne({ role: 'admin' });
        await Transaction.create([{
            remetente: admin ? admin._id : userId,
            destinatario: userId,
            valorBruto: reward,
            valorLiquido: reward,
            tipo: 'QUEST_REWARD',
            descricao: `Prêmio: Pesquisa Científica - ${survey.title}`
        }], { session });

        await session.commitTransaction();
        res.json({ message: `Sucesso! Recompensa de ${reward} PC$ creditada.`, reward });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Erro ao submeter pesquisa:', error.message);
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// --- ADMIN ---

/**
 * Lista todas as pesquisas com contagem de respostas
 */
exports.listSurveys = async (req, res) => {
    try {
        const surveys = await Survey.aggregate([
            {
                $lookup: {
                    from: 'surveyresponses',
                    localField: '_id',
                    foreignField: 'surveyId',
                    as: 'responses'
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    isActive: 1,
                    rewardAmount: 1,
                    category: 1,
                    createdAt: 1,
                    responsesCount: { $size: "$responses" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json(surveys);
    } catch (error) {
        console.error('❌ Erro ao listar pesquisas:', error);
        res.status(500).json({ error: 'Erro ao listar pesquisas.' });
    }
};

/**
 * Cria uma nova pesquisa (Seed de perguntas pode ser feito aqui via admin)
 */
exports.createSurvey = async (req, res) => {
    try {
        const { title, description, questions, rewardAmount, category } = req.body;
        
        // Opcional: Desativar pesquisas anteriores DA MESMA CATEGORIA (Opcional, mas por enquanto desativa global)
        await Survey.updateMany({ isActive: true }, { isActive: false });

        const newSurvey = await Survey.create({
            title: title.trim(),
            description: description?.trim(),
            category: category || 'general',
            questions: questions
                .filter(q => q.text && q.text.trim()) // Remove vazias
                .map((q, idx) => ({
                    ...q,
                    text: q.text.trim(),
                    id: q.id || `q_${Date.now()}_${idx}`
                })),
            rewardAmount: rewardAmount || 100,
            createdBy: req.user.id,
            isActive: true
        });

        res.status(201).json(newSurvey);
    } catch (error) {
        console.error('❌ Erro ao criar pesquisa:', error);
        res.status(500).json({ error: 'Erro ao criar pesquisa.' });
    }
};

/**
 * Ativa/Desativa uma pesquisa
 */
exports.toggleSurveyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const survey = await Survey.findById(id);
        if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada.' });

        // Se estiver ativando, desativa todas as outras primeiro
        if (!survey.isActive) {
            await Survey.updateMany({ _id: { $ne: id } }, { isActive: false });
        }

        survey.isActive = !survey.isActive;
        await survey.save();

        res.json({ message: `Pesquisa ${survey.isActive ? 'ativada' : 'desativada'} com sucesso!`, isActive: survey.isActive });
    } catch (error) {
        console.error('❌ Erro ao alternar status da pesquisa:', error);
        res.status(500).json({ error: 'Erro ao alterar status.' });
    }
};

/**
 * Retorna estatísticas detalhadas das respostas para o Dashboard Cíentífico
 */
exports.getSurveyAnalytics = async (req, res) => {
    try {
        const { surveyId } = req.params;
        const survey = await Survey.findById(surveyId);
        if (!survey) return res.status(404).json({ error: 'Pesquisa não encontrada.' });

        const responses = await SurveyResponse.find({ surveyId });
        const total = responses.length;

        if (total === 0) return res.json({ total: 0, stats: [] });

        // Processa cada pergunta para gerar estatísticas
        const stats = survey.questions.map(q => {
            const result = { qid: q.id, text: q.text, type: q.type, data: [] };

            if (q.type === 'multiple_choice' || q.type === 'boolean') {
                const counts = {};
                responses.forEach(r => {
                    const ans = r.answers.get(q.id);
                    if (ans) counts[ans] = (counts[ans] || 0) + 1;
                });
                result.data = Object.entries(counts).map(([name, value]) => ({ name, value }));
            } else if (q.type === 'rating') {
                const sum = responses.reduce((acc, r) => acc + (Number(r.answers.get(q.id)) || 0), 0);
                result.average = (sum / total).toFixed(2);
                
                const distribution = {};
                responses.forEach(r => {
                    const ans = r.answers.get(q.id);
                    if (ans) distribution[ans] = (distribution[ans] || 0) + 1;
                });
                result.data = Object.entries(distribution).map(([name, value]) => ({ name: `${name} Estrelas`, value }));
            }
            // Questões de texto são retornadas como lista bruta no detalhe se necessário
            return result;
        });

        res.json({ total, stats });
    } catch (error) {
        console.error('❌ Erro no analytics da pesquisa:', error);
        res.status(500).json({ error: 'Erro ao processar dados da pesquisa.' });
    }
};
