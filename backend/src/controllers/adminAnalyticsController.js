const AIInteraction = require('../models/AIInteraction');
const Grade = require('../models/Grade');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');

const adminAnalyticsController = {
    /**
     * GET /api/admin/analytics
     * Retorna dados consolidados para o Dashboard Jovem Cientista
     */
    async getDashboardData(req, res) {
        // ... (mantém lógica anterior)
        try {
            const interactionsByDay = await AIInteraction.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        total: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", total: 1, _id: 0 } }
            ]);

            const performanceByMode = await AIInteraction.aggregate([
                {
                    $group: {
                        _id: "$modo",
                        avgN1: { $avg: "$snapshotNotas.n1_media" },
                        avgN2: { $avg: "$snapshotNotas.n2_media" },
                        avgRedacao: { $avg: "$snapshotNotas.redacao_media" },
                        avgEnem: { $avg: "$snapshotNotas.simulado_enem_score" }
                    }
                },
                { $project: { modo: "$_id", avgN1: 1, avgN2: 1, avgRedacao: 1, avgEnem: 1, _id: 0 } }
            ]);

            const distributionByMode = await AIInteraction.aggregate([
                {
                    $group: {
                        _id: "$modo",
                        count: { $sum: 1 }
                    }
                },
                { $project: { name: "$_id", value: "$count", _id: 0 } }
            ]);

            const distributionByRating = await AIInteraction.aggregate([
                { $match: { avaliacaoAluno: { $ne: null } } },
                {
                    $group: {
                        _id: "$avaliacaoAluno",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { name: { $concat: [{ $toString: "$_id" }, " Estrelas"] }, value: "$count", _id: 0 } }
            ]);

            res.json({
                interactionsByDay,
                performanceByMode,
                distributionByMode,
                distributionByRating
            });
        } catch (error) {
            console.error('❌ Erro ao buscar dados de analytics:', error);
            res.status(500).json({ error: 'Erro ao processar dados do dashboard científico.' });
        }
    },

    /**
     * GET /api/admin/analytics/export
     * Exporta consolidado para Artigo Científico (IA vs Notas)
     */
    async exportScientificData(req, res) {
        try {
            // Pegamos todos os alunos (role: student)
            const students = await User.find({ role: 'student' }).select('nome matricula turma xp');

            const report = await Promise.all(students.map(async (s) => {
                // Notas
                const grades = await Grade.find({ alunoId: s._id });
                const regularGrades = grades.filter(g => g.tipo === 'REGULAR');
                const redacaoGrades = grades.filter(g => g.tipo === 'REDACAO');

                // Médias
                const avgRegular = regularGrades.length > 0 
                    ? regularGrades.reduce((acc, g) => acc + (g.n1 + g.n2)/2, 0) / regularGrades.length 
                    : 0;
                const avgRedacao = redacaoGrades.length > 0
                    ? redacaoGrades.reduce((acc, g) => acc + (g.n1 + g.n2)/2, 0) / redacaoGrades.length
                    : 0;

                // Engajamento IA
                const aiInteractions = await AIInteraction.countDocuments({ user: s._id });
                
                // Tempo de Estudo (Ativo)
                const sessions = await ChatSession.find({ user: s._id });
                const totalMinutes = sessions.reduce((acc, sess) => {
                    if (sess.endTime) {
                        return acc + (new Date(sess.endTime) - new Date(sess.startTime)) / 60000;
                    }
                    return acc;
                }, 0);

                return {
                    matricula: s.matricula,
                    aluno: s.nome,
                    turma: s.turma,
                    xpTotal: s.xp,
                    mediaRegular: avgRegular.toFixed(2),
                    mediaRedacao: avgRedacao.toFixed(2),
                    totalInteracoesIA: aiInteractions,
                    minutosEstudoAtivo: Math.round(totalMinutes)
                };
            }));

            res.status(200).json(report);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao exportar dados científicos.' });
        }
    }
};

module.exports = adminAnalyticsController;
