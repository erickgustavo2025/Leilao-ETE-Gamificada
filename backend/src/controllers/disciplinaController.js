const Disciplina = require('../models/Disciplina');

exports.getEmenta = async (req, res) => {
    try {
        const { disciplinaId } = req.query;
        const disciplina = await Disciplina.findById(disciplinaId);
        
        if (!disciplina) return res.status(404).json({ message: 'Disciplina não encontrada.' });
        
        res.json({ ementa: disciplina.ementa || '' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar ementa.' });
    }
};

exports.updateEmenta = async (req, res) => {
    try {
        const { disciplinaId, ementa } = req.body;
        
        // Verifica se o professor é o dono da disciplina
        const disciplina = await Disciplina.findById(disciplinaId);
        if (!disciplina) return res.status(404).json({ message: 'Disciplina não encontrada.' });
        
        // No esquema atual, disciplina tem o campo professorId
        if (disciplina.professorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Acesso negado. Você não é o orientador desta disciplina.' });
        }

        disciplina.ementa = ementa;
        await disciplina.save();

        res.json({ message: 'Ementa atualizada com sucesso!', ementa: disciplina.ementa });
    } catch (error) {
        console.error('Update Ementa Error:', error);
        res.status(500).json({ message: 'Erro ao salvar ementa.' });
    }
};
