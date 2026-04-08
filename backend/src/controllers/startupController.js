const GilEmpresa = require('../models/GilEmpresa');
const mongoose = require('mongoose');

/**
 * Cria uma nova Startup (IPO) - Aberto para alunos
 */
exports.createStartup = async (req, res) => {
    try {
        const { nome, tag, descricao, valuationInicial, totalAcoes } = req.body;
        const fundador = req.user._id;

        if (!nome || !tag || !valuationInicial || !totalAcoes) {
            return res.status(400).json({ error: 'Nome, Ticker, Valuation e Total de Ações são obrigatórios.' });
        }

        const existing = await GilEmpresa.findOne({ tag: tag.toUpperCase() });
        if (existing) {
            return res.status(400).json({ error: 'Este Ticker (Tag) já está em uso por outra empresa.' });
        }

        const startup = await GilEmpresa.create({
            nome,
            tag: tag.toUpperCase(),
            descricao,
            fundador,
            valuationInicial,
            totalAcoes,
            valorPorAcao: valuationInicial / totalAcoes,
            minHoldWeeks: req.body.minHoldWeeks || 2,
            status: 'INCUBACAO'
        });

        res.status(201).json({
            message: 'Startup enviada para incubação! Aguarde aprovação do professor.',
            startup
        });

    } catch (error) {
        console.error('❌ Erro ao criar startup:', error);
        res.status(500).json({ error: 'Erro interno ao criar startup.' });
    }
};

/**
 * Aprova uma Startup para listagem (Admin Only - SHARK TANK)
 */
exports.approveStartup = async (req, res) => {
    try {
        const { id } = req.params;
        const { newValuation, performanceInicial } = req.body;

        const startup = await GilEmpresa.findById(id);
        if (!startup) {
            return res.status(404).json({ error: 'Startup não encontrada.' });
        }

        if (startup.status !== 'INCUBACAO') {
            return res.status(400).json({ error: 'Esta empresa não está em fase de incubação.' });
        }

        // Se o admin editou o valuation, recalcula o preço da ação
        if (newValuation && newValuation > 0) {
            startup.valuationInicial = newValuation;
        }

        startup.performanceAcademica = performanceInicial || 100;
        startup.status = 'LISTADA';
        startup.acoesDisponiveis = startup.totalAcoes;
        startup.valorPorAcao = startup.valuationInicial / startup.totalAcoes;

        await startup.save();

        res.json({ message: 'Startup aprovada e listada na Bolsa!', startup });

    } catch (error) {
        console.error('❌ Erro ao aprovar startup:', error);
        res.status(500).json({ error: 'Erro interno ao aprovar startup.' });
    }
};

/**
 * Rejeita uma Startup (Admin Only)
 */
exports.rejectStartup = async (req, res) => {
    try {
        const { id } = req.params;

        const startup = await GilEmpresa.findById(id);
        if (!startup) {
            return res.status(404).json({ error: 'Startup não encontrada.' });
        }

        startup.status = 'REJEITADA';
        await startup.save();

        res.json({ message: 'Startup rejeitada com sucesso.' });
    } catch (error) {
        console.error('❌ Erro ao rejeitar startup:', error);
        res.status(500).json({ error: 'Erro interno ao rejeitar startup.' });
    }
};

/**
 * Atualiza a performance acadêmica de uma startup listada (Gestão Contínua)
 */
exports.updatePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const { novaNota, motivo } = req.body;

        if (novaNota === undefined || novaNota < 0 || novaNota > 100) {
            return res.status(400).json({ error: 'Nota inválida (0-100).' });
        }

        const startup = await GilEmpresa.findById(id);
        if (!startup) {
            return res.status(404).json({ error: 'Startup não encontrada.' });
        }

        // Calcula o impacto no valor da ação
        // Se a nota subir, o valor sobe proporcionalmente. 
        // Ex: De 80 pra 90 é um aumento de 12.5% no valor da ação.
        const oldPerformance = startup.performanceAcademica || 50; // default 50 se for zero
        const ratio = novaNota / oldPerformance;
        
        // Atualiza valor da ação e performance
        startup.valorPorAcao = Math.max(0.1, startup.valorPorAcao * ratio); // Mínimo de 0.1 PC$ pra não quebrar
        startup.performanceAcademica = novaNota;

        // 👇 FIX: Se a lista de histórico não existir, cria uma vazia primeiro!
        if (!startup.historicoPerformance) {
            startup.historicoPerformance = [];
        }

        startup.historicoPerformance.push({
            nota: novaNota,
            motivo: motivo || 'Atualização de desempenho acadêmico (ROI)',
            priceAtTime: startup.valorPorAcao
        });

        await startup.save();

        res.json({ 
            message: 'Performance e Valor de Mercado atualizados!', 
            startup,
            newPrice: startup.valorPorAcao 
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar performance:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar performance.' });
    }
};

/**
 * Lista todas as startups
 */
exports.listStartups = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : { status: { $ne: 'REJEITADA' } };

        const startups = await GilEmpresa.find(query)
            .populate('fundador', 'nome turma')
            .sort({ createdAt: -1 });

        res.json(startups);
    } catch (error) {
        console.error('❌ Erro ao listar startups:', error);
        res.status(500).json({ error: 'Erro interno ao listar startups.' });
    }
};
