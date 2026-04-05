// backend/src/controllers/notasController.js
const User = require('../models/User');

/**
 * Atualiza as notas de um aluno (Admin Only)
 */
exports.updateNotas = async (req, res) => {
    try {
        const { userId, n1, n2, redacoes, simulados } = req.body;

        if (!userId) return res.status(400).json({ error: 'ID do aluno é obrigatório.' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });

        // Atualiza campos se fornecidos
        if (n1) user.notas.n1 = n1;
        if (n2) user.notas.n2 = n2;
        if (redacoes) user.notas.redacoes = redacoes;
        if (simulados) user.notas.simulados = simulados;
        
        user.notas.ultimaAtualizacao = new Date();

        await user.save();

        res.json({ message: 'Notas atualizadas com sucesso!', notas: user.notas });

    } catch (error) {
        console.error('❌ Erro ao atualizar notas:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar notas.' });
    }
};

/**
 * Busca as notas do próprio aluno logado
 */
exports.getMyNotas = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notas');
        res.json(user.notas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar notas.' });
    }
};
