const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Log = require('../models/Log');
const Classroom = require('../models/Classroom');
const StoreItem = require('../models/StoreItem');

module.exports = {
    // 🎒 1. MEU INVENTÁRIO
    async getMyInventory(req, res) {
        try {
            const user = await User.findById(req.user.id).populate('inventory.itemId'); 
            if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

            const syncedInventory = user.inventory.map(slot => {
                const originalItem = slot.itemId || {};
                return {
                    ...slot.toObject(),
                    name: originalItem.nome || slot.name,
                    image: originalItem.imagem || originalItem.image || slot.image,
                    rarity: originalItem.raridade || slot.rarity || 'Comum',
                    basePrice: originalItem.preco || slot.basePrice
                };
            });
            res.json(syncedInventory);
        } catch (error) {
            res.status(500).json({ message: "Erro interno." });
        }
    },

    // 🎫 2. USAR ITEM PESSOAL
    async useItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { itemId } = req.body;
            const userId = req.user.id;
            const user = await User.findById(userId).populate('inventory.itemId').session(session);

            if (!user) throw new Error("Usuário não encontrado.");

            const itemIndex = user.inventory.findIndex(slot => {
                if (!slot) return false;
                const slotId = slot._id ? slot._id.toString() : '';
                const refId = slot.itemId ? (slot.itemId._id || slot.itemId).toString() : '';
                return slotId === itemId || refId === itemId;
            });

            if (itemIndex === -1) throw new Error("Item não encontrado.");

            const slot = user.inventory[itemIndex];
            const refItem = slot.itemId || {};

            const itemData = {
                nome: refItem.nome || slot.name || "Item",
                descricao: slot.descricao || refItem.descricao || "Sem descrição",
                raridade: slot.rarity || slot.raridade || refItem.raridade || 'Comum',
                imagem: slot.image || slot.imagem || refItem.imagem || '/assets/store.png',
                expiresAt: slot.expiresAt,
                // ✅ Campos de buff vindos do StoreItem
                buffEffect: refItem.buffEffect || null,
                validadeDias: refItem.validadeDias || slot.validadeDias || 90
            };

            // ============================================================
            // ✅ RELATÓRIO: RAMO DE BUFF — Ativa aura passiva, NÃO gera ticket
            // Detecta buff por: categoria 'BUFF' no slot OU buffEffect no StoreItem
            // ============================================================
            const isBuff = slot.category === 'BUFF' || !!itemData.buffEffect;

            if (isBuff) {
                const buffEffect = itemData.buffEffect;

                if (!buffEffect) {
                    throw new Error("Este item de buff está mal configurado. Fale com o admin.");
                }

                // 1. Remove o item do inventário
                if (slot.quantity > 1) {
                    slot.quantity -= 1;
                } else {
                    user.inventory.splice(itemIndex, 1);
                }

                // 2. Calcula a data de expiração
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + itemData.validadeDias);

                // 3. Remove qualquer buff do mesmo efeito existente (regra: só 1 ativo por tipo)
                // Isso impede que o aluno acumule dois "Duplicadores" simultâneos
                user.activeBuffs = user.activeBuffs.filter(b => b.effect !== buffEffect);

                // 4. Injeta o novo buff no array
                user.activeBuffs.push({
                    effect: buffEffect,
                    name: itemData.nome,
                    image: itemData.imagem,
                    expiresAt: expiresAt,
                    source: 'LOJA'
                });

                user.markModified('inventory');
                user.markModified('activeBuffs');
                await user.save({ session });

                await Log.create([{
                    user: userId,
                    action: 'BUFF_ACTIVATED',
                    details: `Ativou buff: ${itemData.nome} (${buffEffect}) por ${itemData.validadeDias} dias. Expira em: ${expiresAt.toLocaleDateString('pt-BR')}`,
                    ip: req.ip
                }], { session });

                await session.commitTransaction();

                return res.json({
                    message: `🔥 Buff "${itemData.nome}" ativado por ${itemData.validadeDias} dias!`,
                    buffActivated: true,
                    buff: {
                        effect: buffEffect,
                        name: itemData.nome,
                        image: itemData.imagem,
                        expiresAt: expiresAt
                    }
                });
            }

            // ============================================================
            // RAMO PADRÃO — Gera Ticket (itens consumíveis, skills, etc.)
            // ============================================================

            // Consumo normal
            if (slot.category === 'RANK_SKILL') {
                if (slot.usesLeft <= 0) throw new Error("Sem cargas.");
                
                // 🛡️ TRAVA DE RIQUEZA (Wealth Check) - Fase 3
                if (slot.skillCode) {
                    const requiredRank = require('../config/gameRules').getRequiredRankForSkill(slot.skillCode);
                    if (requiredRank && user.maxPcAchieved < requiredRank.min) {
                        throw new Error(`🚫 Você possui a Badge, mas sua força financeira não é digna desta habilidade! Alcance a meta histórica de ${requiredRank.min.toLocaleString()} PC$ (${requiredRank.name}) para destrancá-la.`);
                    }
                }

                slot.usesLeft -= 1;
                slot.lastUsedAt = new Date();
            } else {
                if (slot.quantity > 1) {
                    slot.quantity -= 1;
                } else {
                    user.inventory.splice(itemIndex, 1);
                }
            }

            const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
            
            const ticket = await Ticket.create([{
                user: userId,
                itemId: slot.itemId || slot._id,
                itemNome: itemData.nome,
                itemDescricao: itemData.descricao,
                itemImagem: itemData.imagem,
                itemRaridade: itemData.raridade,
                itemExpiresAt: itemData.expiresAt,
                hash: hash,
                status: 'PENDENTE',
                tipo: slot.category === 'RANK_SKILL' ? 'rank_skill' : 'personal_item',
                dataCriacao: new Date()
            }], { session });

            user.markModified('inventory');
            await user.save({ session });

            await Log.create([{
                user: userId,
                action: 'TICKET_CREATED',
                details: `Gerou ticket: ${itemData.nome} (${hash})`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: "Ticket gerado!", ticket: ticket[0] });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message || "Erro ao usar item." });
        } finally {
            session.endSession();
        }
    },

    // 🏫 3. USAR ITEM DA SALA (Mochila da Turma)
    async useRoomItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { slotId } = req.body;
            const userId = req.user._id;
            const userTurma = req.user.turma;

            const turmaRegex = new RegExp(`^${userTurma.trim()}$`, 'i');
            const classroom = await Classroom.findOne({ serie: { $regex: turmaRegex } }).session(session);
            
            if (!classroom) throw new Error('Sua sala não foi encontrada.');

            const itemIndex = classroom.roomInventory.findIndex(i => i._id.toString() === slotId);
            if (itemIndex === -1) throw new Error('Item não encontrado na sala.');
            
            const roomItem = classroom.roomInventory[itemIndex];
            
            let itemData = { 
                nome: roomItem.name, 
                descricao: roomItem.description || "Item de Sala", 
                imagem: roomItem.image,
                raridade: roomItem.rarity || "Comum",
                expiresAt: roomItem.expiresAt
            };
            
            if (roomItem.quantity > 1) {
                roomItem.quantity -= 1;
            } else {
                classroom.roomInventory.splice(itemIndex, 1);
            }

            await classroom.save({ session });

            const hash = crypto.randomBytes(4).toString('hex').toUpperCase();

            const ticket = await Ticket.create([{
                user: userId,
                itemId: roomItem.itemId || roomItem._id, 
                itemNome: itemData.nome,
                itemDescricao: itemData.descricao,
                itemImagem: itemData.imagem,
                itemRaridade: itemData.raridade,
                itemExpiresAt: itemData.expiresAt,
                tipo: 'room_item',
                classroomOrigin: userTurma,
                hash: hash,
                status: 'PENDENTE'
            }], { session });

            await Log.create([{
                user: userId,
                action: 'USO_ITEM_SALA',
                details: `Ticket Sala: ${itemData.nome} (${hash})`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ ticket: ticket[0] });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    },

    // 🗑️ 4. DESCARTAR
    async discardItem(req, res) {
        try {
            const { slotId } = req.params;
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

            const initialLength = user.inventory.length;
            user.inventory = user.inventory.filter(slot => slot._id.toString() !== slotId);

            if (user.inventory.length === initialLength) {
                return res.status(404).json({ message: "Item não encontrado." });
            }

            await user.save();
            res.json({ message: "Item descartado.", inventory: user.inventory });
        } catch (error) {
            res.status(500).json({ message: "Erro ao descartar." });
        }
    },

    // ADMIN
    async getAllItems(req, res) {
        try {
            const items = await StoreItem.find().sort({ raridade: 1, nome: 1 });
            res.json(items);
        } catch (e) { res.status(500).json({ error: 'Erro' }); }
    },
    
    async discardRoomItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { slotId } = req.params;
            const userId = req.user._id.toString();
            const userTurma = req.user.turma;

            const turmaRegex = new RegExp(`^${userTurma.trim()}$`, 'i');
            const classroom = await Classroom.findOne({ serie: { $regex: turmaRegex } }).session(session);
            
            if (!classroom) throw new Error("Sala não encontrada.");

            const itemIndex = classroom.roomInventory.findIndex(i => i._id.toString() === slotId);
            if (itemIndex === -1) throw new Error("Item não encontrado.");

            const item = classroom.roomInventory[itemIndex];
            
            const ownerId = item.acquiredBy ? (item.acquiredBy._id || item.acquiredBy).toString() : null;
            
            if (ownerId !== userId) {
                throw new Error("Apenas o dono pode descartar este item.");
            }

            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                classroom.roomInventory.splice(itemIndex, 1);
            }

            await classroom.save({ session });

            await Log.create([{
                user: userId,
                action: 'DISCARD_ROOM_ITEM',
                details: `Descartou item de sala: ${item.name}`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: "Item jogado fora." });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ message: error.message });
        } finally {
            session.endSession();
        }
    },
    
};
