const Regulation = require('../models/Regulation');

const adminRegulationController = {
    // Listar todos os regulamentos
    async list(req, res) {
        try {
            const regulations = await Regulation.find().sort({ type: 1, title: 1 });
            res.json(regulations);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar regulamentos.' });
        }
    },

    // Criar novo regulamento
    async create(req, res) {
        try {
            const { type, title, content, teacherName, blockedSkills, blockedBenefits, usageLimits, isActive } = req.body;
            const regulation = await Regulation.create({
                type,
                title,
                content,
                teacherName,
                blockedSkills,
                blockedBenefits,
                usageLimits,
                isActive
            });
            res.status(201).json(regulation);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao criar regulamento.' });
        }
    },

    // Atualizar regulamento
    async update(req, res) {
        try {
            const { id } = req.params;
            const { type, title, content, teacherName, blockedSkills, blockedBenefits, usageLimits, isActive } = req.body;
            const regulation = await Regulation.findByIdAndUpdate(
                id,
                { type, title, content, teacherName, blockedSkills, blockedBenefits, usageLimits, isActive },
                { new: true, runValidators: true }
            );
            if (!regulation) return res.status(404).json({ error: 'Regulamento não encontrado.' });
            res.json(regulation);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao atualizar regulamento.' });
        }
    },

    // Deletar regulamento
    async delete(req, res) {
        try {
            const { id } = req.params;
            const regulation = await Regulation.findByIdAndDelete(id);
            if (!regulation) return res.status(404).json({ error: 'Regulamento não encontrado.' });
            res.json({ message: 'Regulamento removido com sucesso.' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar regulamento.' });
        }
    }
};

module.exports = adminRegulationController;
