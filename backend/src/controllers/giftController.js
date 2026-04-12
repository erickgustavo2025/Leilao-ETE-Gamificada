const mongoose = require('mongoose');
const GiftBox = require('../models/GiftBox');
const User = require('../models/User');
const StoreItem = require('../models/StoreItem');
const Classroom = require('../models/Classroom');
const Log = require('../models/Log');
const { normalizeInventoryItem } = require('../utils/itemHelper');

module.exports = {
    // 🎁 CRIAR PRESENTE
    async createGift(req, res) {
        try {
            let { turmasPermitidas } = req.body;
            if (typeof turmasPermitidas === 'string') turmasPermitidas = [turmasPermitidas];

            const gift = await GiftBox.create({ ...req.body, turmasPermitidas });

            await Log.create({
                user: req.user._id,
                action: 'GIFT_CREATE',
                details: `Criou: ${gift.titulo} (PC: ${gift.recompensaPc})`,
                ip: req.ip
            });
            res.status(201).json(gift);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao criar presente.' });
        }
    },

    // 📋 LISTAR MEUS PRESENTES
    async getMyGifts(req, res) {
        try {
            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

            const userRankPoints = user.maxPcAchieved || 0;
            const now = new Date();

            // ✅ FIX: Duplo $or causava o segundo sobrescrever o primeiro no MongoDB.
            // Solução: usar $and para combinar os dois filtros corretamente.
            const gifts = await GiftBox.find({
                active: true,
                $and: [
                    {
                        $or: [
                            { turmasPermitidas: 'TODAS' },
                            { turmasPermitidas: user.turma }
                        ]
                    },
                    {
                        $or: [
                            { dataExpiracao: { $exists: false } },
                            { dataExpiracao: null },
                            { dataExpiracao: { $gt: now } }
                        ]
                    }
                ]
            }).populate('recompensaItens.item', 'nome imagem rarity isHouseItem');

            const processedGifts = gifts.map(gift => {
                const claims = gift.claims || [];
                const myClaimsCount = claims.filter(c => c.user.toString() === user._id.toString()).length;

                let myLimit = gift.limitePorUsuario;
                if (gift.permitirBonusVip && user.isVip) {
                    myLimit += 1;
                }

                let canClaim = true;
                if (gift.dataExpiracao && new Date(gift.dataExpiracao) < now) canClaim = false;
                if (myClaimsCount >= myLimit) canClaim = false;

                const RANK_POINTS = { 'Iniciante': 0, 'Bronze': 1000, 'Prata': 2000, 'Ouro': 5000, 'Diamante': 10000 };
                if (userRankPoints < (RANK_POINTS[gift.rankMinimo] || 0)) canClaim = false;

                return {
                    ...gift.toObject(),
                    claims: undefined,
                    myClaimsCount,
                    myLimit,
                    canClaim,
                    vipBonusAvailable: gift.permitirBonusVip && !user.isVip && myClaimsCount >= gift.limitePorUsuario
                };
            });

            res.json(processedGifts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar presentes.' });
        }
    },

    // 🔓 RESGATAR PRESENTE
    async claimGift(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const userId = req.user._id;

            const user = await User.findById(userId).session(session);
            const gift = await GiftBox.findById(id).populate('recompensaItens.item').session(session);

            if (!gift || !gift.active) throw new Error('Presente indisponível.');

            const myClaims = gift.claims.filter(c => c.user.toString() === userId.toString()).length;
            let limite = gift.limitePorUsuario;
            if (gift.permitirBonusVip && user.isVip) limite += 1;

            if (myClaims >= limite) throw new Error('Limite de resgates atingido.');
            if (gift.dataExpiracao && new Date() > new Date(gift.dataExpiracao)) throw new Error('Presente expirado.');

            // Valida Turma (server-side — esse sempre foi correto)
            if (
                gift.turmasPermitidas.length > 0 &&
                !gift.turmasPermitidas.includes('TODAS') &&
                !gift.turmasPermitidas.includes(user.turma)
            ) {
                throw new Error('Presente não é para sua turma.');
            }

            let newCoins = user.saldoPc;
            if (gift.recompensaPc > 0) {
                user.saldoPc += gift.recompensaPc;
                newCoins = user.saldoPc;
            }

            const itemsAddedInfo = [];

            if (gift.recompensaItens && gift.recompensaItens.length > 0) {
                let classroom = null;
                const hasRoomItems = gift.recompensaItens.some(r => r.item && r.item.isHouseItem);

                if (hasRoomItems) {
                    const turmaRegex = new RegExp(`^${user.turma.trim()}$`, 'i');
                    classroom = await Classroom.findOne({ serie: { $regex: turmaRegex } }).session(session);
                    if (!classroom) throw new Error('Sua sala não foi encontrada para entregar os itens.');
                }

                for (const reward of gift.recompensaItens) {
                    const storeItem = reward.item;
                    if (!storeItem) continue;

                    let expiresAt = null;
                    if (reward.validadeValor && reward.validadeValor > 0) {
                        const agora = new Date().getTime();
                        let msParaAdicionar = 0;
                        const unidade = reward.unidadeValidade || 'DIAS';

                        switch (unidade) {
                            case 'MINUTOS':
                                msParaAdicionar = reward.validadeValor * 60 * 1000;
                                break;
                            case 'HORAS':
                                msParaAdicionar = reward.validadeValor * 60 * 60 * 1000;
                                break;
                            case 'DIAS':
                            default:
                                msParaAdicionar = reward.validadeValor * 24 * 60 * 60 * 1000;
                                break;
                        }
                        expiresAt = new Date(agora + msParaAdicionar);
                    } else if (storeItem.isHouseItem) {
                        const agora = new Date();
                        expiresAt = new Date(agora.setDate(agora.getDate() + 14));
                        console.log(`⚠️ Gift: Item de sala sem validade definida. Forçando 14 dias para ${storeItem.nome}.`);
                    }

                    for (let i = 0; i < reward.quantidade; i++) {
                    const normalizedItem = normalizeInventoryItem(storeItem, {
                        origin: 'PRESENTE',
                        acquiredBy: user._id,
                        expiresAt: expiresAt,
                        quantity: 1,
                        category: storeItem.isHouseItem ? 'PRESENTE' : 'CONSUMIVEL'
                    });

                    if (storeItem.isHouseItem) {
                        if (classroom) {
                            classroom.roomInventory.push(normalizedItem);
                            itemsAddedInfo.push(`${storeItem.nome} (Sala)`);
                        }
                    } else {
                        user.inventory.push(normalizedItem);
                        itemsAddedInfo.push(storeItem.nome);
                    }
                    }
                }

                if (classroom) await classroom.save({ session });
            }

            gift.claims.push({ user: userId, data: new Date() });
            user.markModified('inventory');

            await gift.save({ session });
            await user.save({ session });

            await Log.create([{
                user: userId,
                action: 'GIFT_CLAIM',
                details: `Resgatou ${gift.titulo} (${itemsAddedInfo.join(', ')})`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();

            return res.json({
                success: true,
                message: 'Presente resgatado!',
                newCoins,
                itemsCount: itemsAddedInfo.length
            });

        } catch (error) {
            await session.abortTransaction();
            console.error("🔥 ERRO FATAL NO RESGATE:", error);
            return res.status(400).json({ error: error.message || 'Erro interno ao resgatar presente.' });
        } finally {
            session.endSession();
        }
    },
};
