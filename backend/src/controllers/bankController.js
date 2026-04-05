// backend/src/controllers/bankController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Log = require('../models/Log');

const TAXA_JUROS = 0.15; // 15%

// Helper para verificar se é VIP Card (Ignora Emojis e Case)
const isVipCard = (name) => {
    if (!name) return false;
    return name.toLowerCase().includes('vip card');
};

module.exports = {
    // 📊 STATUS BANCÁRIO
    async getBankInfo(req, res) {
        try {
            const user = await User.findById(req.user.id);
            const activeLoan = await Loan.findOne({ 
                user: req.user.id, 
                status: { $in: ['PENDENTE', 'ATRASADO'] } 
            });

            // 1. Skill de Rank (Busca item que contém "VIP Card" e é RANK_SKILL)
            const rankVip = user.inventory.find(i => 
                isVipCard(i.name) && i.category === 'RANK_SKILL'
            );

            // 2. Itens Físicos (Busca item que contém "VIP Card" e NÃO é RANK_SKILL)
            const inventoryVipCount = user.inventory.reduce((acc, item) => {
                if (isVipCard(item.name) && item.category !== 'RANK_SKILL') {
                    return acc + (item.quantity || 1);
                }
                return acc;
            }, 0);

            // Lógica de Limite
            const hasVip = !!rankVip || inventoryVipCount > 0;
            let creditLimit = 0;
            if (hasVip) {
                creditLimit = Math.floor(user.saldoPc / 3);
            }

            const availableLimit = activeLoan ? 0 : creditLimit;

            res.json({
                saldo: user.saldoPc,
                creditLimit,
                availableLimit,
                activeLoan,
                taxa: TAXA_JUROS,
                vipStatus: {
                    hasRankVip: !!rankVip,
                    rankUses: rankVip ? rankVip.usesLeft : 0,
                    rankMax: rankVip ? rankVip.usesMax : 0,
                    hasInventoryVip: inventoryVipCount > 0,
                    inventoryCount: inventoryVipCount,
                    hasVip // Flag geral para o Front liberar a tela
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar dados bancários' });
        }
    },

    // 💸 PEGAR EMPRÉSTIMO
    async takeLoan(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { amount, vipSource } = req.body;
            const userId = req.user.id;
            const valorSolicitado = Math.abs(parseInt(amount));

            if (!['RANK', 'ITEM'].includes(vipSource)) {
                throw new Error("Selecione qual VIP Card deseja utilizar.");
            }

            const user = await User.findById(userId).session(session);

            // --- LÓGICA DE CONSUMO FLEXÍVEL ---
            let consumedSource = '';

            if (vipSource === 'RANK') {
                const rankVipIndex = user.inventory.findIndex(i => 
                    isVipCard(i.name) && i.category === 'RANK_SKILL'
                );
                
                if (rankVipIndex === -1 || user.inventory[rankVipIndex].usesLeft <= 0) {
                    throw new Error("Sem cargas na Habilidade de Rank (VIP Card).");
                }
                
                user.inventory[rankVipIndex].usesLeft -= 1;
                consumedSource = 'Habilidade de Rank';
            } 
            else if (vipSource === 'ITEM') {
                const itemVipIndex = user.inventory.findIndex(i => 
                    isVipCard(i.name) && i.category !== 'RANK_SKILL'
                );

                if (itemVipIndex === -1) {
                    throw new Error("Você não tem cartões VIP físicos na mochila.");
                }

                const item = user.inventory[itemVipIndex];
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    user.inventory.splice(itemVipIndex, 1);
                }
                consumedSource = 'Item da Mochila';
            }

            // Verifica Dívida Ativa
            const existingLoan = await Loan.findOne({ user: userId, status: { $in: ['PENDENTE', 'ATRASADO'] } }).session(session);
            if (existingLoan) throw new Error("Pague seu empréstimo ativo primeiro.");

            // Calcula Limite
            const creditLimit = Math.floor(user.saldoPc / 3);
            if (valorSolicitado > creditLimit) throw new Error(`Valor excede seu limite (${creditLimit} PC$).`);
            if (valorSolicitado < 100) throw new Error("Mínimo de 100 PC$.");

            // Cria Dívida
            const valorComJuros = Math.floor(valorSolicitado * (1 + TAXA_JUROS));
            const vencimento = new Date();
            vencimento.setDate(vencimento.getDate() + 7);

            const loan = await Loan.create([{
                user: userId,
                valorOriginal: valorSolicitado,
                valorDevido: valorComJuros,
                dataVencimento: vencimento,
                status: 'PENDENTE'
            }], { session });

            // Deposita
            user.saldoPc += valorSolicitado;
            
            // Atualiza Max Rank se necessário
            if (user.saldoPc > user.maxPcAchieved) {
                user.maxPcAchieved = user.saldoPc;
            }

            user.markModified('inventory');
            await user.save({ session });

            await Log.create([{
                user: userId,
                action: 'BANK_LOAN_TAKEN',
                details: `Pegou ${valorSolicitado} PC$. Fonte: ${consumedSource}`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: "Empréstimo aprovado!", novoSaldo: user.saldoPc });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    },

    // ... payLoan (Mantenha o código existente do payLoan) ...
    async payLoan(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user.id;
            const user = await User.findById(userId).session(session);
            const loan = await Loan.findOne({ user: userId, status: { $in: ['PENDENTE', 'ATRASADO'] } }).session(session);

            if (!loan) throw new Error("Sem dívidas ativas.");
            if (user.saldoPc < loan.valorDevido) throw new Error("Saldo insuficiente.");

            user.saldoPc -= loan.valorDevido;
            loan.status = 'PAGO';
            loan.dataPagamento = new Date();

            await user.save({ session });
            await loan.save({ session });
            
            await Log.create([{ user: userId, action: 'BANK_LOAN_PAID', details: `Pagou ${loan.valorDevido} PC$.`, ip: req.ip }], { session });

            await session.commitTransaction();
            res.json({ message: "Dívida quitada!", novoSaldo: user.saldoPc });
        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};