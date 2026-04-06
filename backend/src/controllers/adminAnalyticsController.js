const AIInteraction = require('../models/AIInteraction');

const adminAnalyticsController = {
    /**
     * GET /api/admin/analytics
     * Retorna dados consolidados para o Dashboard Jovem Cientista
     */
    async getDashboardData(req, res) {
        try {
            // 1. Interações por dia (Gráfico de Linha)
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

            // 2. Média de notas por modo (Gráfico de Barras)
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

            // 3. Distribuição por modo (Gráfico de Pizza 1)
            const distributionByMode = await AIInteraction.aggregate([
                {
                    $group: {
                        _id: "$modo",
                        count: { $sum: 1 }
                    }
                },
                { $project: { name: "$_id", value: "$count", _id: 0 } }
            ]);

            // 4. Distribuição de avaliações (Gráfico de Pizza 2)
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
    }
};

module.exports = adminAnalyticsController;
