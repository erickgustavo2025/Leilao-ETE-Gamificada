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

    // 3. ACEITAR TROCA (REFEITO DO ZERO)
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

            // Validação de Saldos (PC$)
            if (initiator.saldoPc < (trade.offerInitiator.pc || 0)) throw new Error("O iniciador não tem saldo suficiente.");
            if (target.saldoPc < (trade.offerTarget.pc || 0)) throw new Error("Você não tem saldo suficiente.");

            // FUNÇÃO MESTRA: Remover de um lado e Adicionar no outro
            const processItems = async (giver, receiver, itemsToGive) => {
                for (const item of itemsToGive) {

                    // 1. TENTA REMOVER DO GIVER
                    let itemRemoved = false;

                    // Tenta na mochila pessoal
                    const personalIdx = giver.inventory.findIndex(i => i._id.toString() === item.inventoryId);
                    if (personalIdx !== -1) {
                        if (giver.inventory[personalIdx].quantity > 1) {
                            giver.inventory[personalIdx].quantity -= 1;
                        } else {
                            giver.inventory.splice(personalIdx, 1);
                        }
                        itemRemoved = true;
                    }
                    // Tenta no Beco Diagonal (Sala)
                    else {
                        const giverClassroom = await Classroom.findOne({ serie: giver.turma }).session(session);
                        if (giverClassroom && giverClassroom.roomInventory) {
                            const roomIdx = giverClassroom.roomInventory.findIndex(i =>
                                i._id.toString() === item.inventoryId &&
                                (i.acquiredBy?.toString() === giver._id.toString() || i.adquiridoPor?.toString() === giver._id.toString())
                            );
                            if (roomIdx !== -1) {
                                if (giverClassroom.roomInventory[roomIdx].quantidade > 1) {
                                    giverClassroom.roomInventory[roomIdx].quantidade -= 1;
                                } else {
                                    giverClassroom.roomInventory.splice(roomIdx, 1);
                                }
                                await giverClassroom.save({ session });
                                itemRemoved = true;
                            }
                        }
                    }

                    if (!itemRemoved) throw new Error(`${giver.nome} não possui mais o item ${item.name}. (A troca foi cancelada)`);

                 // 2. ADICIONA NO RECEIVER
                    if (item.isHouseItem) {
                        // Vai para o Beco Diagonal do Recebedor!
                        const receiverClassroom = await Classroom.findOne({ serie: receiver.turma }).session(session);
                        if (receiverClassroom) {
                            if (!receiverClassroom.roomInventory) receiverClassroom.roomInventory = [];

                            // Vamos buscar a validade real direto do banco pra não depender do Frontend!
                            let realItem = await StoreItem.findById(item.itemId).session(session) || await Item.findById(item.itemId).session(session);
                            let finalExpiresAt = item.expiresAt;
                            
                            // Se o Frontend engoliu a data, a gente recalcula pelo BD!
                            if (!finalExpiresAt && realItem && realItem.validadeDias) {
                                finalExpiresAt = new Date();
                                finalExpiresAt.setDate(finalExpiresAt.getDate() + realItem.validadeDias);
                            }

                            // 🔥 CRIA UM OBJETO LIMPO COM NOMES EXATOS DO SCHEMA DA SALA (INGLÊS)
                            const newRoomSlot = {
                                itemId: item.itemId,
                                name: item.name || realItem?.nome || 'Item da Casa',
                                image: item.image || realItem?.imagem || '',
                                description: item.descricao || realItem?.descricao || 'Sem descrição', // Em INGLÊS pro Schema!
                                rarity: item.rarity || realItem?.raridade || 'Comum',
                                quantity: 1,
                                category: item.category || 'CONSUMIVEL',
                                acquiredBy: receiver._id,
                                origin: 'TRADE',
                                acquiredAt: new Date()
                            };

                            if (finalExpiresAt) newRoomSlot.expiresAt = finalExpiresAt;

                            receiverClassroom.roomInventory.push(newRoomSlot);
                            await receiverClassroom.save({ session });
                        }
                    } else {
                        // Vai para a Mochila Pessoal do Recebedor!
                        let realItem = await StoreItem.findById(item.itemId).session(session) || await Item.findById(item.itemId).session(session);
                        let finalExpiresAt = item.expiresAt;
                        
                        if (!finalExpiresAt && realItem && realItem.validadeDias) {
                            finalExpiresAt = new Date();
                            finalExpiresAt.setDate(finalExpiresAt.getDate() + realItem.validadeDias);
                        }

                        const newPersonalSlot = {
                            itemId: item.itemId,
                            name: item.name || realItem?.nome,
                            descricao: item.descricao || realItem?.descricao, // Em PORTUGUÊS pro Schema Pessoal!
                            imagem: item.image || realItem?.imagem,
                            raridade: item.rarity || realItem?.raridade || 'Comum',
                            basePrice: item.basePrice || realItem?.preco || 0,
                            category: item.category || 'CONSUMIVEL',
                            quantity: 1,
                            origin: 'trade',
                            acquiredAt: new Date()
                        };

                        if (finalExpiresAt) newPersonalSlot.expiresAt = finalExpiresAt;

                        receiver.inventory.push(newPersonalSlot);
                    }
                }
            };

            // Processa as transferências de itens
            await processItems(initiator, target, trade.offerInitiator.items);
            await processItems(target, initiator, trade.offerTarget.items);

            // Processa Finanças
            const pcToInitiator = trade.offerTarget.pc || 0;
            const pcToTarget = trade.offerInitiator.pc || 0;

            initiator.saldoPc = initiator.saldoPc - pcToTarget + pcToInitiator;
            target.saldoPc = target.saldoPc - pcToInitiator + pcToTarget;

            trade.status = 'COMPLETED';
            initiator.markModified('inventory');
            target.markModified('inventory');

            await initiator.save({ session });
            await target.save({ session });
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