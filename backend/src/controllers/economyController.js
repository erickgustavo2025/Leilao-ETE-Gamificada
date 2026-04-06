const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Log = require('../models/Log');
const { PIX_FEE, getAnnualLimit } = require('../utils/economyRules');

// 👇 FUNÇÃO DE BUSCA TURBINADA
const isTaxItem = (item) => {
    if (!item) return false;
    
    // 1. Verifica Código da Skill (Novo Padrão)
    if (item.skillCode === 'TRANSF_CONHECIMENTO') return true;

    // 2. Verifica Nome (Legado / Item de Loja)
    if (item.name) {
        const clean = item.name.toLowerCase();
        return clean.includes('conhecimento') && (clean.includes('transf') || clean.includes('transferencia'));
    }
    return false;
};

module.exports = {
    async transferPc(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { targetMatricula, amount, password, useTaxExemption, taxExemptionType } = req.body;
            const senderId = req.user.id;
            const valor = Math.abs(parseInt(amount));

            if (!valor || valor <= 0) throw new Error('Valor inválido.');
            if (targetMatricula === req.user.matricula) throw new Error('Não pode transferir para si mesmo.');

            const sender = await User.findById(senderId).select('+senha').session(session);

            // 🛡️ RESTRIÇÃO DE BADGE PARA TRANSFERÊNCIA (Fase 4)
            const BADGE_TRANSFERENCIA = 'PODE_TRANSFERIR';
            const podeTransferir = (sender.cargos || []).includes(BADGE_TRANSFERENCIA);
            if (!podeTransferir && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Você precisa completar a Missão de Transferência para usar o PIX Escolar.',
                    badgeNecessaria: BADGE_TRANSFERENCIA
                });
            }
            const receiver = await User.findOne({ matricula: targetMatricula }).session(session);

            if (!receiver) throw new Error('Destinatário não encontrado.');
            if (!await bcrypt.compare(password, sender.senha)) throw new Error('Senha incorreta.');

            // Lógica da Taxa
            let finalTax = PIX_FEE;
            let taxItemUsed = null;

            if (useTaxExemption) {
                let itemIndex = -1;

                if (taxExemptionType === 'SKILL') {
                    itemIndex = sender.inventory.findIndex(i =>
                        isTaxItem(i) && i.category === 'RANK_SKILL' && i.usesLeft > 0
                    );
                    if (itemIndex === -1) throw new Error("Sem cargas de habilidade disponíveis.");
                } else if (taxExemptionType === 'ITEM') {
                    itemIndex = sender.inventory.findIndex(i =>
                        isTaxItem(i) && i.category !== 'RANK_SKILL' && i.quantity > 0
                    );
                    if (itemIndex === -1) throw new Error("Item consumível não encontrado.");
                } else {
                    // Fallback
                    itemIndex = sender.inventory.findIndex(i => isTaxItem(i) && i.category === 'RANK_SKILL' && i.usesLeft > 0);
                    if (itemIndex === -1) {
                        itemIndex = sender.inventory.findIndex(i => isTaxItem(i) && i.category !== 'RANK_SKILL' && i.quantity > 0);
                    }
                }

                if (itemIndex === -1) throw new Error(`Você não possui isenção disponível.`);

                const item = sender.inventory[itemIndex];

                if (item.category === 'RANK_SKILL') {
                    item.usesLeft -= 1;
                    item.lastUsedAt = new Date();
                    taxItemUsed = `Skill: ${item.name}`;
                } else {
                    if (item.quantity > 1) {
                        item.quantity -= 1;
                    } else {
                        sender.inventory.splice(itemIndex, 1);
                    }
                    taxItemUsed = `Item: ${item.name}`;
                }

                // 🔥 Importante: Avisar o Mongoose
                sender.markModified('inventory');
                finalTax = 0;
            }

            const totalCost = valor + finalTax;
            if (sender.saldoPc < totalCost) throw new Error(`Saldo insuficiente. Necessário: ${totalCost} PC$.`);

            // Valida Limite Anual
            const limit = getAnnualLimit(receiver.turma || receiver.serie);
            if (!receiver.financialLimits) receiver.financialLimits = { receivedThisYear: 0 };
            const spaceLeft = limit - receiver.financialLimits.receivedThisYear;

            if (valor > spaceLeft) throw new Error(`Destinatário atingiu o limite anual (Restam ${spaceLeft} PC$).`);

            sender.saldoPc -= totalCost;
            receiver.saldoPc += valor;
            receiver.financialLimits.receivedThisYear += valor;

            await sender.save({ session });
            await receiver.save({ session });

            await Log.create([{
                user: sender._id,
                target: receiver._id,
                action: 'PIX_SENT',
                details: `Enviou ${valor} PC$ para ${receiver.matricula}. Taxa: ${finalTax}. ${taxItemUsed ? `(${taxItemUsed})` : ''}`,
                ip: req.ip
            }], { session });

            await Log.create([{
                user: receiver._id,
                target: sender._id,
                action: 'PIX_RECEIVED',
                details: `Recebeu ${valor} PC$ de ${sender.matricula}`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: 'Transferência realizada!', novoSaldo: sender.saldoPc });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro PIX:", error);
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};