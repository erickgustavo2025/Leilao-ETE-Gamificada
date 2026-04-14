const EngagementMetric = require('../models/EngagementMetric');
const User = require('../models/User');

const engagementController = {
    /**
     * Incrementa o contador de visitas passivas (abrir o site)
     * Limitado via frontend por localStorage para evitar flood
     */
    async recordVisit(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Tenta encontrar ou criar o registro de hoje
            // Usamos $inc do MongoDB para ser atômico (Thread safe)
            await EngagementMetric.findOneAndUpdate(
                { date: today },
                { $inc: { passiveVisits: 1 } },
                { upsert: true, new: true }
            );

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('❌ Erro ao registrar visita:', error);
            res.status(500).json({ error: 'Erro interno' });
        }
    },

    /**
     * Incrementa o contador de logins ativos
     * Chamada internamente pelos controladores de autenticação
     */
    async recordLogin() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await EngagementMetric.findOneAndUpdate(
                { date: today },
                { $inc: { activeLogins: 1 } },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('❌ Erro ao registrar login nas métricas:', error);
        }
    },

    /**
     * Retorna os dados para os gráficos do Professor/Admin
     * Query de últimos 30 dias por padrão
     */
    async getEngagementTrends(req, res) {
        try {
            const days = parseInt(req.query.days) || 14;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const trends = await EngagementMetric.find({
                date: { $gte: startDate }
            }).sort({ date: 1 });

            res.json(trends);
        } catch (error) {
            console.error('❌ Erro ao buscar tendências:', error);
            res.status(500).json({ error: 'Erro ao processar dados científicos.' });
        }
    },

    /**
     * Atualiza o pico de usuários live
     */
    async updateLivePeak(currentLiveSize) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const metric = await EngagementMetric.findOne({ date: today });
            if (!metric || currentLiveSize > (metric.livePeak || 0)) {
                await EngagementMetric.findOneAndUpdate(
                    { date: today },
                    { $set: { livePeak: currentLiveSize } },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar pico live:', error);
        }
    }
};

module.exports = engagementController;
