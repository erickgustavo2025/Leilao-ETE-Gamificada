const mongoose = require('mongoose');
const PriceCache = require('../models/PriceCache');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GilEmpresa = require('../models/GilEmpresa');

/**
 * Retorna as cotações atuais do PriceCache com filtros opcionais
 */
exports.getCotacoes = async (req, res) => {
    try {
        const { assetType, symbols } = req.query;
        const query = {};

        if (assetType) {
            query.assetType = assetType.toUpperCase();
        }

        if (symbols) {
            const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
            query.symbol = { $in: symbolList };
        }

        const cotacoes = await PriceCache.find(query).sort({ symbol: 1 });

        res.json(cotacoes);
    } catch (error) {
        console.error('❌ Erro ao buscar cotações:', error);
        res.status(500).json({ error: 'Erro interno ao buscar cotações.' });
    }
};

/**
 * Compra um ativo (Ação Real, Cripto ou Startup) usando saldo PC$
 * Operação 100% Atômica MongoDB com Recálculo de Preço Médio
 */
exports.buyAsset = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { symbol, quantity } = req.body;
        const userId = req.user._id;
        const assetSymbol = symbol.toUpperCase();

        let assetPrice = 0;
        let assetType = '';
        let startup = null;

        // 1. Determinar preço e tipo
        const realAsset = await PriceCache.findOne({ symbol: assetSymbol }).session(session);
        
        if (realAsset) {
            assetPrice = realAsset.regularMarketPrice;
            assetType = realAsset.assetType;
        } else {
            startup = await GilEmpresa.findOne({ tag: assetSymbol, status: 'LISTADA' }).session(session);
            if (!startup) {
                throw new Error('Ativo não encontrado ou não está listado para negociação.');
            }
            
            // 🛡️ BLOQUEIO DE INSIDER TRADING (MÉDIO)
            if (startup.fundador.toString() === userId.toString()) {
                throw new Error('Fundadores não podem negociar ações da própria empresa.');
            }

            // 🔴 TRAVA DE ESTOQUE ATÔMICA (CRÍTICO) será feita no updateOne da empresa abaixo
            assetPrice = startup.valorPorAcao;
            assetType = 'STARTUP';
        }

        const totalCost = assetPrice * quantity;
        const brokerageFee = 1; 
        const finalCost = totalCost + brokerageFee;

        // 2. Buscar dados atuais do investimento para o Cálculo do Preço Médio (MÉDIO)
        const user = await User.findById(userId).session(session);
        if (user.saldoPc < finalCost) {
            throw new Error('Saldo insuficiente para completar a operação.');
        }

        const existingInvestment = user.investments.find(inv => inv.symbol === assetSymbol);
        
        if (existingInvestment) {
            // 🟡 RECALCULAR PREÇO MÉDIO (MÉDIO)
            const oldQuantity = existingInvestment.quantity;
            const oldAvgPrice = existingInvestment.averagePrice;
            const newTotalQuantity = oldQuantity + quantity;
            const newAvgPrice = ((oldQuantity * oldAvgPrice) + (quantity * assetPrice)) / newTotalQuantity;

            const updateResult = await User.updateOne(
                { _id: userId, 'investments.symbol': assetSymbol, saldoPc: { $gte: finalCost } },
                { 
                    $inc: { 
                        saldoPc: -finalCost,
                        'investments.$.quantity': quantity 
                    },
                    $set: { 
                        'investments.$.averagePrice': Number(newAvgPrice.toFixed(4)),
                        'investments.$.updatedAt': new Date() 
                    }
                },
                { session }
            );

            if (updateResult.matchedCount === 0) throw new Error('Erro ao atualizar investimento existente.');
        } else {
            // Novo investimento
            const updateResult = await User.updateOne(
                { _id: userId, saldoPc: { $gte: finalCost } },
                { 
                    $inc: { saldoPc: -finalCost },
                    $push: { 
                        investments: {
                            symbol: assetSymbol,
                            quantity,
                            averagePrice: assetPrice,
                            assetType: assetType,
                            updatedAt: new Date()
                        }
                    }
                },
                { session }
            );

            if (updateResult.matchedCount === 0) throw new Error('Erro ao criar novo investimento.');
        }

        // 3. Lógica Market Maker para Startups (🔴 RACE CONDITION FIX)
        if (assetType === 'STARTUP' && startup) {
            const priceImpact = 1 + (0.001 * quantity); 
            const newPrice = Number((startup.valorPorAcao * priceImpact).toFixed(2));

            // 🔴 ATUALIZAÇÃO ATÔMICA COM TRAVA DE ESTOQUE (CRÍTICO)
            const startupUpdate = await GilEmpresa.updateOne(
                { _id: startup._id, acoesDisponiveis: { $gte: quantity } },
                { 
                    $inc: { acoesDisponiveis: -quantity },
                    $set: { valorPorAcao: newPrice }
                },
                { session }
            );

            if (startupUpdate.matchedCount === 0) {
                throw new Error('Ações esgotadas ou insuficientes para esta operação.');
            }
        }

        // 4. Registrar Transação
        const systemUser = await User.findOne({ role: 'admin' }).session(session);
        await Transaction.create([{
            remetente: userId,
            destinatario: systemUser ? systemUser._id : userId,
            valorBruto: finalCost,
            taxa: brokerageFee,
            valorLiquido: totalCost,
            tipo: 'INVESTMENT_BUY',
            assetSymbol: assetSymbol,
            assetType: assetType,
            quantity,
            priceAtTime: assetPrice
        }], { session });

        await session.commitTransaction();
        res.json({ message: 'Compra realizada com sucesso!' });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Erro na compra de ativo:', error.message);
        res.status(400).json({ error: error.message || 'Erro ao processar compra.' });
    } finally {
        session.endSession();
    }
};

/**
 * Vende um ativo e recebe PC$ (Operação Atômica MongoDB)
 */
exports.sellAsset = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { symbol, quantity } = req.body;
        const userId = req.user._id;
        const assetSymbol = symbol.toUpperCase();

        let assetPrice = 0;
        let assetType = '';
        let startup = null;

        // 1. Buscar preço atual para venda
        const realAsset = await PriceCache.findOne({ symbol: assetSymbol }).session(session);
        if (realAsset) {
            assetPrice = realAsset.regularMarketPrice;
            assetType = realAsset.assetType;
        } else {
            startup = await GilEmpresa.findOne({ tag: assetSymbol, status: 'LISTADA' }).session(session);
            if (!startup) {
                throw new Error('Ativo não encontrado ou não está disponível para venda.');
            }
            
            // 🛡️ BLOQUEIO DE INSIDER TRADING (MÉDIO)
            if (startup.fundador.toString() === userId.toString()) {
                throw new Error('Fundadores não podem negociar ações da própria empresa.');
            }

            assetPrice = startup.valorPorAcao;
            assetType = 'STARTUP';
        }

        const totalGain = assetPrice * quantity;
        const brokerageFee = 1; 
        const finalGain = totalGain - brokerageFee;

        // 2. Operação Atômica: Decrementar quantidade e incrementar saldo
        const updateResult = await User.updateOne(
            { 
                _id: userId, 
                'investments.symbol': assetSymbol,
                'investments.quantity': { $gte: quantity }
            },
            { 
                $inc: { 
                    saldoPc: finalGain,
                    'investments.$.quantity': -quantity 
                }
            },
            { session }
        );

        if (updateResult.matchedCount === 0) {
            throw new Error('Você não possui quantidade suficiente deste ativo para vender.');
        }

        // 3. Limpeza: Remover investimento se a quantidade zerou
        await User.updateOne(
            { _id: userId },
            { $pull: { investments: { symbol: assetSymbol, quantity: 0 } } },
            { session }
        );

        // 4. Lógica Market Maker para Startups (Oferta e Demanda)
        if (assetType === 'STARTUP' && startup) {
            const priceImpact = 1 - (0.001 * quantity);
            let newPrice = Number((startup.valorPorAcao * priceImpact).toFixed(2));
            if (newPrice < 0.01) newPrice = 0.01;

            await GilEmpresa.updateOne(
                { _id: startup._id },
                { 
                    $inc: { acoesDisponiveis: quantity },
                    $set: { valorPorAcao: newPrice }
                },
                { session }
            );
        }

        // 5. Registrar Transação
        const systemUser = await User.findOne({ role: 'admin' }).session(session);
        await Transaction.create([{
            remetente: systemUser ? systemUser._id : userId,
            destinatario: userId,
            valorBruto: totalGain,
            taxa: brokerageFee,
            valorLiquido: finalGain,
            tipo: 'INVESTMENT_SELL',
            assetSymbol: assetSymbol,
            assetType: assetType,
            quantity,
            priceAtTime: assetPrice
        }], { session });

        await session.commitTransaction();
        res.json({ message: 'Venda realizada com sucesso!' });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Erro na venda de ativo:', error.message);
        res.status(400).json({ error: error.message || 'Erro ao processar venda.' });
    } finally {
        session.endSession();
    }
};
