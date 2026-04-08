const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GilEmpresa = require('../models/GilEmpresa');
const Disciplina = require('../models/Disciplina');
const Rank = require('../models/Rank');

const adminEconomyController = {
    // --- DASHBOARD ANALYTICS ---
    async getEconomyStats(req, res) {
        try {
            const monetaryMass = await User.aggregate([{ $group: { _id: null, total: { $sum: "$saldoPc" } } }]);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const transactionVolume = await Transaction.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: "$valorBruto" }, count: { $sum: 1 } } }
            ]);
            const topRich = await User.find({ role: 'student' }).sort({ saldoPc: -1 }).limit(10).select('nome matricula turma saldoPc');
            const startupStats = await GilEmpresa.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
            const volumeByType = await Transaction.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: "$tipo", total: { $sum: "$valorBruto" }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]);

            res.json({
                monetaryMass: monetaryMass[0]?.total || 0,
                transactionVolume: transactionVolume[0]?.total || 0,
                transactionCount: transactionVolume[0]?.count || 0,
                topRich,
                startupStats,
                volumeByType
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar stats.' });
        }
    },

    // --- CRUD DISCIPLINAS ---
    async getDisciplinas(req, res) {
        try {
            const disciplinas = await Disciplina.find().sort({ ano: 1, curso: 1, nome: 1 });
            res.json(disciplinas);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
        }
    },

    async createDisciplina(req, res) {
        try {
            // ✅ CORREÇÃO: Filtrar campos para evitar Mass Assignment
            const { nome, professor, ano, curso, precoN1, precoN2, ativa } = req.body;
            const disciplina = await Disciplina.create({
                nome, professor, ano, curso, precoN1, precoN2, ativa
            });
            res.status(201).json(disciplina);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao criar disciplina.' });
        }
    },

    async updateDisciplina(req, res) {
        try {
            // ✅ CORREÇÃO: Filtrar campos para evitar Mass Assignment
            const { nome, professor, ano, curso, precoN1, precoN2, ativa } = req.body;
            const disciplina = await Disciplina.findByIdAndUpdate(
                req.params.id, 
                { nome, professor, ano, curso, precoN1, precoN2, ativa }, 
                { new: true, runValidators: true }
            );
            if (!disciplina) return res.status(404).json({ error: 'Disciplina não encontrada.' });
            res.json(disciplina);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao atualizar disciplina.' });
        }
    },

    async deleteDisciplina(req, res) {
        try {
            await Disciplina.findByIdAndDelete(req.params.id);
            res.json({ message: 'Disciplina removida.' });
        } catch (error) {
            res.status(400).json({ error: 'Erro ao remover disciplina.' });
        }
    },

    // --- CRUD RANKS ---
    async getRanks(req, res) {
        try {
            let ranks = await Rank.find().sort({ order: 1 });
            if (ranks.length === 0) {
                const { RANKS } = require('../config/gameRules');
                ranks = await Rank.insertMany(RANKS.map((r, i) => ({
                    rankId: r.id,
                    name: r.name,
                    min: r.min,
                    color: r.color,
                    border: r.border,
                    order: i
                })));
            }
            res.json(ranks);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar ranks.' });
        }
    },

    async updateRank(req, res) {
        try {
            const { min, name } = req.body;
            const rankId = req.params.id;

            // ✅ CORREÇÃO: Validação de ordem lógica dos Ranks
            const currentRank = await Rank.findById(rankId);
            if (!currentRank) return res.status(404).json({ error: 'Rank não encontrado.' });

            // Buscar ranks vizinhos para validar threshold
            const prevRank = await Rank.findOne({ order: currentRank.order - 1 });
            const nextRank = await Rank.findOne({ order: currentRank.order + 1 });

            if (prevRank && min <= prevRank.min) {
                return res.status(400).json({ error: `O valor mínimo deve ser maior que o do rank anterior (${prevRank.name}: ${prevRank.min} PC$).` });
            }
            if (nextRank && min >= nextRank.min) {
                return res.status(400).json({ error: `O valor mínimo deve ser menor que o do próximo rank (${nextRank.name}: ${nextRank.min} PC$).` });
            }

            const rank = await Rank.findByIdAndUpdate(rankId, { min, name }, { new: true });
            res.json(rank);
        } catch (error) {
            res.status(400).json({ error: 'Erro ao atualizar rank.' });
        }
    }
};

module.exports = adminEconomyController;
