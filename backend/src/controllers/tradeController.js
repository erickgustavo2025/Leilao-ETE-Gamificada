// ARQUIVO: backend/src/controllers/tradeController.js
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const StoreItem = require('../models/StoreItem'); 
const Item = require('../models/Item');
const User = require('../models/User');
const Log = require('../models/Log');
const Classroom = require('../models/Classroom');
const NotificationController = require('./notificationController');

const FAIRNESS_THRESHOLD = 0.20;

module.exports = {
    // 1. CRIAR PROPOSTA
    async createTrade(req, res) {
        try {
            const { targetId, offerInitiator, offerTarget } = req.body;
            const initiatorId = req.user._id;

            // 🛡️ RESTRIÇÃO DE BADGE PARA TRADE (Fase 4)
            const BADGE_TRADE = 'PODE_FAZER_TRADE';
            if (!(req.user.cargos || []).includes(BADGE_TRADE) && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Complete a Missão de Trade para negociar itens.',
                    badgeNecessaria: BADGE_TRADE
                });
            }

            if (targetId === initiatorId.toString()) return res.status(400).json({ error: "Não pode trocar consigo mesmo." });

            const initiator = await User.findById(initiatorId);
            const target = await User.findById(targetId);
            if (!target) return res.status(404).json({ error: "Destinatário não encontrado." });

            const checkForSkills = (items) => items && items.some(i => String(i.category).toUpperCase() === 'RANK_SKILL' || i.isSkill);
            if (checkForSkills(offerInitiator.items) || checkForSkills(offerTarget.items)) {
                return res.status(400).json({ error: "Habilidades não podem ser trocadas!" });
            }

            const totalInit = (offerInitiator.pc || 0) + (offerInitiator.items || []).reduce((acc, i) => acc + (i.basePrice || 0), 0);
            const totalTarget = (offerTarget.pc || 0) + (offerTarget.items || []).reduce((acc, i) => acc + (i.basePrice || 0), 0);

            const maxVal = Math.max(totalInit, totalTarget);
            const minVal = Math.min(totalInit, totalTarget);
            let ratio = maxVal === 0 ? 1 : minVal / maxVal;
            if (minVal === 0 && maxVal > 0) ratio = 0;

            if (ratio < (1 - FAIRNESS_THRESHOLD)) {
                return res.status(400).json({ error: "Troca Injusta!", details: `Diferença de valor muito alta.` });
            }

            const trade = await Trade.create({
                initiator: initiatorId,
                target: targetId,
                offerInitiator,
                offerTarget,
                fairnessRatio: ratio,
                status: 'PENDING'
            });

            await NotificationController.create(targetId, 'TRADE', `${initiator.nome} quer trocar com você!`, { tradeId: trade._id });
            res.status(201).json(trade);
        } catch (error) {
            res.status(500).json({ error: "Erro ao criar troca." });
        }
    },

    // 2. LISTAR
    async getMyTrades(req, res) {
        try {
            const trades = await Trade.find({ $or: [{ initiator: req.user._id }, { target: req.user._id }], status: 'PENDING' })
                .populate('initiator', 'nome matricula turma')
                .populate('target', 'nome matricula turma')
                .sort({ createdAt: -1 });
            res.json(trades);
        } catch (error) { res.status(500).json({ error: "Erro." }); }
    },

    // 3. ACEITAR TROCA (ATÔMICA)
    async acceptTrade(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { tradeId } = req.body;
            const userId = req.user._id;

            const trade = await Trade.findById(tradeId).session(session);
            if (!trade || trade.status !== 'PENDING') throw new Error("Troca inválida ou finalizada.");
            if (trade.target.toString() !== userId.toString()) throw new Error("Apenas o destinatário pode aceitar.");

            const initiator = await User.findById(trade.initiator).session(session);
            const target = await User.findById(trade.target).session(session);

            // 🛡️ RESTRIÇÃO DE BADGE PARA QUEM ACEITA (Fase 4)
            const BADGE_TRADE = 'PODE_FAZER_TRADE';
            if (!(target.cargos || []).includes(BADGE_TRADE) && target.role !== 'admin') {
                throw new Error("O destinatário não tem permissão para fazer trades ainda.");
            }

            // FUNÇÃO MESTRA: Remover de um lado e Adicionar no outro ATÔMICAMENTE
            const processItems = async (giver, receiver, itemsToGive) => {
                for (const item of itemsToGive) {
                    let itemRemoved = false;

                    // 1. TENTA REMOVER DO GIVER (Pessoal atômico)
                    let pullPersonal = await User.updateOne(
                        { _id: giver._id, 'inventory._id': item.inventoryId, 'inventory.quantity': 1 },
                        { $pull: { inventory: { _id: item.inventoryId } } },
                        { session }
                    );
                    if (pullPersonal.matchedCount > 0) {
                        itemRemoved = true;
                    } else {
                        let decPersonal = await User.updateOne(
                            { _id: giver._id, 'inventory._id': item.inventoryId, 'inventory.quantity': { $gt: 1 } },
                            { $inc: { 'inventory.$.quantity': -1 } },
                            { session }
                        );
                        if (decPersonal.matchedCount > 0) itemRemoved = true;
                    }

                    // 2. TENTA REMOVER DO BECO DIAGONAL ATÔMICO
                    if (!itemRemoved) {
                        const giverClassroom = await Classroom.findOne({ serie: giver.turma }).session(session);
                        if (giverClassroom) {
                            let pullRoom = await Classroom.updateOne(
                                {
                                    _id: giverClassroom._id,
                                    'roomInventory._id': item.inventoryId,
                                    $or: [{ 'roomInventory.quantidade': 1 }, { 'roomInventory.quantity': 1 }],
                                    $or: [{ 'roomInventory.acquiredBy': giver._id }, { 'roomInventory.adquiridoPor': giver._id }]
                                },
                                { $pull: { roomInventory: { _id: item.inventoryId } } },
                                { session }
                            );
                            if (pullRoom.matchedCount > 0) {
                                itemRemoved = true;
                            } else {
                                let decRoom = await Classroom.updateOne(
                                    {
                                        _id: giverClassroom._id,
                                        'roomInventory._id': item.inventoryId,
                                        $or: [{ 'roomInventory.quantidade': { $gt: 1 } }, { 'roomInventory.quantity': { $gt: 1 } }],
                                        $or: [{ 'roomInventory.acquiredBy': giver._id }, { 'roomInventory.adquiridoPor': giver._id }]
                                    },
                                    { $inc: { 'roomInventory.$.quantidade': -1, 'roomInventory.$.quantity': -1 } },
                                    { session }
                                );
                                if (decRoom.matchedCount > 0) itemRemoved = true;
                            }
                        }
                    }

                    if (!itemRemoved) throw new Error(`${giver.nome} não possui mais o item ${item.name}. (A troca foi cancelada)`);

                    // 3. ADICIONA NO RECEIVER
                    let realItem = await StoreItem.findById(item.itemId).session(session) || await Item.findById(item.itemId).session(session);
                    let finalExpiresAt = item.expiresAt;
                    if (!finalExpiresAt && realItem && realItem.validadeDias) {
                        finalExpiresAt = new Date();
                        finalExpiresAt.setDate(finalExpiresAt.getDate() + realItem.validadeDias);
                    }

                    if (item.isHouseItem) {
                        const receiverClassroom = await Classroom.findOne({ serie: receiver.turma }).session(session);
                        if (receiverClassroom) {
                            const newRoomSlot = {
                                itemId: item.itemId,
                                name: item.name || realItem?.nome || 'Item da Casa',
                                image: item.image || realItem?.imagem || '',
                                description: item.descricao || realItem?.descricao || 'Sem descrição',
                                rarity: item.rarity || realItem?.raridade || 'Comum',
                                quantity: 1,
                                quantidade: 1,
                                category: item.category || 'CONSUMIVEL',
                                acquiredBy: receiver._id,
                                adquiridoPor: receiver._id,
                                origin: 'TRADE',
                                acquiredAt: new Date()
                            };
                            if (finalExpiresAt) newRoomSlot.expiresAt = finalExpiresAt;

                            await Classroom.updateOne(
                                { _id: receiverClassroom._id },
                                { $push: { roomInventory: newRoomSlot } },
                                { session }
                            );
                        }
                    } else {
                        const newPersonalSlot = {
                            itemId: item.itemId,
                            name: item.name || realItem?.nome,
                            descricao: item.descricao || realItem?.descricao,
                            imagem: item.image || realItem?.imagem,
                            raridade: item.rarity || realItem?.raridade || 'Comum',
                            basePrice: item.basePrice || realItem?.preco || 0,
                            category: item.category || 'CONSUMIVEL',
                            quantity: 1,
                            origin: 'trade',
                            acquiredAt: new Date()
                        };
                        if (finalExpiresAt) newPersonalSlot.expiresAt = finalExpiresAt;

                        await User.updateOne(
                            { _id: receiver._id },
                            { $push: { inventory: newPersonalSlot } },
                            { session }
                        );
                    }
                }
            };

            // Processa as transferências de itens
            await processItems(initiator, target, trade.offerInitiator.items || []);
            await processItems(target, initiator, trade.offerTarget.items || []);

            // Processa Finanças Atômicas
            if ((trade.offerInitiator.pc || 0) > 0) {
                const initDebit = await User.updateOne(
                    { _id: trade.initiator, saldoPc: { $gte: trade.offerInitiator.pc } },
                    { $inc: { saldoPc: -trade.offerInitiator.pc } },
                    { session }
                );
                if (initDebit.matchedCount === 0) throw new Error("Aviso: O iniciador não possui mais o PC$ oferecido.");
                
                await User.updateOne({ _id: trade.target }, { $inc: { saldoPc: trade.offerInitiator.pc } }, { session });
            }

            if ((trade.offerTarget.pc || 0) > 0) {
                const trgDebit = await User.updateOne(
                    { _id: trade.target, saldoPc: { $gte: trade.offerTarget.pc } },
                    { $inc: { saldoPc: -trade.offerTarget.pc } },
                    { session }
                );
                if (trgDebit.matchedCount === 0) throw new Error("Aviso: Você não possui mais o PC$ oferecido.");
                
                await User.updateOne({ _id: trade.initiator }, { $inc: { saldoPc: trade.offerTarget.pc } }, { session });
            }

            trade.status = 'COMPLETED';
            await trade.save({ session });

            await session.commitTransaction();
            res.json({ message: "Troca realizada com sucesso!" });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro no acceptTrade:", error);
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    },

    // 4. CANCELAR / RECUSAR (Apenas muda o status, itens nunca saíram)
    async cancelTrade(req, res) {
        try {
            const { id } = req.params;
            const trade = await Trade.findById(id);
            if (!trade || trade.status !== 'PENDING') return res.status(404).json({ error: "Troca inválida." });

            if (trade.initiator.toString() === req.user._id.toString()) {
                trade.status = 'CANCELLED';
            } else if (trade.target.toString() === req.user._id.toString()) {
                trade.status = 'REJECTED';
            } else {
                return res.status(403).json({ error: "Sem permissão." });
            }

            await trade.save();
            res.json({ message: "Troca cancelada/rejeitada." });
        } catch (e) {
            res.status(500).json({ error: "Erro ao cancelar." });
        }
    }
};