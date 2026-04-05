const RankBenefit = require('../models/RankBenefit');

module.exports = {
    // Listar todos os benefícios ordenados por PC mínimo (do menor pro maior)
    async index(req, res) {
        try {
            const benefits = await RankBenefit.find().sort({ minPc: 1 });
            return res.json(benefits);
        } catch (error) {
            console.error("Erro ao buscar benefícios:", error);
            return res.status(500).json({ error: 'Erro interno ao buscar benefícios.' });
        }
    }
};