// ARQUIVO: backend/src/controllers/houseHistoryController.js
const HouseHistory = require('../models/HouseHistory');

module.exports = {

    // 📜 [GET] /api/house-history — Todas as casas lendárias (público, pra timeline)
    async getAll(req, res) {
        try {
            const houses = await HouseHistory.find()
                .sort({ vitorias: -1, anoEntrada: 1 })
                .lean();
            res.json(houses);
        } catch (error) {
            console.error('Erro getAll HouseHistory:', error);
            res.status(500).json({ error: 'Erro ao buscar Hall da Fama.' });
        }
    },

    // 🔒 [POST] /api/house-history — Admin cria uma nova entrada
    async create(req, res) {
        try {
            const { nome, anoEntrada, anoSaida, vitorias, imagemUrl, ordem } = req.body;

            if (!nome || !anoEntrada || !anoSaida) {
                return res.status(400).json({ error: 'nome, anoEntrada e anoSaida são obrigatórios.' });
            }

            const house = await HouseHistory.create({
                nome: nome.toUpperCase().trim(),
                anoEntrada: Number(anoEntrada),
                anoSaida: Number(anoSaida),
                anosAtivos: `${anoEntrada} - ${anoSaida}`,
                vitorias: Number(vitorias) || 0,
                imagemUrl: imagemUrl || '/uploads/house_item.png',
                ordem: Number(ordem) || 0
            });

            res.status(201).json(house);
        } catch (error) {
            console.error('Erro create HouseHistory:', error);
            res.status(500).json({ error: 'Erro ao criar casa.' });
        }
    },

    // 🔒 [PUT] /api/house-history/:id — Admin edita (add vitória, muda nome, etc.)
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nome, anoEntrada, anoSaida, vitorias, imagemUrl, ordem } = req.body;

            const updateData = {};
            if (nome !== undefined) {
                updateData.nome = nome.toUpperCase().trim();
            }
            if (anoEntrada !== undefined) updateData.anoEntrada = Number(anoEntrada);
            if (anoSaida !== undefined) updateData.anoSaida = Number(anoSaida);
            if (vitorias !== undefined) updateData.vitorias = Number(vitorias);
            if (imagemUrl !== undefined) updateData.imagemUrl = imagemUrl;
            if (ordem !== undefined) updateData.ordem = Number(ordem);

            // Reconstrói anosAtivos se os anos foram mudados
            if (anoEntrada !== undefined || anoSaida !== undefined) {
                const current = await HouseHistory.findById(id).lean();
                if (!current) return res.status(404).json({ error: 'Casa não encontrada.' });
                const entrada = anoEntrada ?? current.anoEntrada;
                const saida = anoSaida ?? current.anoSaida;
                updateData.anosAtivos = `${entrada} - ${saida}`;
            }

            const updated = await HouseHistory.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updated) return res.status(404).json({ error: 'Casa não encontrada.' });

            res.json(updated);
        } catch (error) {
            console.error('Erro update HouseHistory:', error);
            res.status(500).json({ error: 'Erro ao atualizar casa.' });
        }
    },

    // 🔒 [DELETE] /api/house-history/:id — Admin remove
    async remove(req, res) {
        try {
            const { id } = req.params;
            const deleted = await HouseHistory.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ error: 'Casa não encontrada.' });
            res.json({ message: 'Casa removida do Hall da Fama.' });
        } catch (error) {
            console.error('Erro remove HouseHistory:', error);
            res.status(500).json({ error: 'Erro ao remover.' });
        }
    }
};