const Regulation = require('../models/Regulation');

const publicRegulationController = {
    // Listar regulamentos ativos para os alunos
    async listActive(req, res) {
        try {
            const regulations = await Regulation.find({ isActive: true }).sort({ type: 1, title: 1 });
            res.json(regulations);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar regulamentos.' });
        }
    }
};

module.exports = publicRegulationController;
