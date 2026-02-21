const mongoose = require('mongoose');
const Roulette = require('../models/Roulette');
const User = require('../models/User');
const StoreItem = require('../models/StoreItem');
const Classroom = require('../models/Classroom');
const Log = require('../models/Log');

// Helper para peso de raridade (usado no sorteio com buff de sorte)
const getRarityWeight = (rarity) => {
    if (!rarity) return 1;
    const r = rarity.toUpperCase();
    if (['SOBERANO', 'MITOLÓGICO', 'LENDÁRIO'].includes(r)) return 5;
    if (['ÉPICO', 'SUPREMO'].includes(r)) return 4;
    return 1;
};

// HELPER: Busca item no inventário para pagar o giro
const findInventoryItem = (inventory, type) => {
    if (type === 'ROLETADA') {
        return inventory.find(i =>
            i.skillCode === 'ROLETADA' ||
            (i.category === 'RANK_SKILL' && (i.name || '').toUpperCase().includes('ROLETADA')) ||
            ((i.name || '').toUpperCase().includes('ROLETADA GRÁTIS'))
        );
    }
    if (type === 'SORTUDO') {
        return inventory.find(i =>
            i.skillCode === 'SORTUDO' ||
            ((i.name || '').toUpperCase().includes('SORTUDO') && (i.category === 'RANK_SKILL' || i.category === 'PERMANENTE'))
        );
    }
    return null;
};

module.exports = {
    // SALVAR ROLETA (Agora salva a validade dos itens vinda do Front)
    async saveRoulette(req, res) {
        try {
            const { id, title, type, cost, items, active, validDays } = req.body;

            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + (validDays || 90));

            const sanitizedItems = items.map(i => ({
                name: i.name,
                image: i.image,
                type: i.type,
                value: Number(i.value),
                probability: Number(i.probability),
                rarity: i.rarity,
                isHouseItem: i.isHouseItem || false,
                prizeId: i.prizeId || null,
                validadeDias: Number(i.validadeDias) || 0 // 🔥 Salva a validade no banco
            }));

            const payload = { title, type, cost: Number(cost), items: sanitizedItems, active, validUntil };

            if (id) await Roulette.findByIdAndUpdate(id, payload);
            else await Roulette.create(payload);

            res.json({ message: 'Salvo com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao salvar.' });
        }
    },

    // LISTAR TODAS
    async listAll(req, res) {
        try {
            const roulettes = await Roulette.find().sort({ createdAt: -1 });
            res.json(roulettes);
        } catch (e) {
            res.status(500).json({ error: 'Erro ao listar.' });
        }
    },

    // DELETAR
    async delete(req, res) {
        try {
            await Roulette.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deletado com sucesso' });
        } catch (e) {
            res.status(500).json({ error: 'Erro ao deletar.' });
        }
    },

   // STATUS DO JOGADOR (Para exibir moedas/fichas no frontend)
    async getStatus(req, res) {
        try {
            const user = await User.findById(req.user._id);
            const activeRoulettes = await Roulette.find({ active: true, validUntil: { $gte: new Date() } });

            // Busca Cargas de Skill (Os originais do painel Admin)
            const skillRoletada = findInventoryItem(user.inventory, 'ROLETADA');
            const cargasRoletada = skillRoletada ? (skillRoletada.usesLeft || 0) : 0;

            const skillSortudo = findInventoryItem(user.inventory, 'SORTUDO');
            const sortudoCargas = skillSortudo ? (skillSortudo.usesLeft || 0) : 0;

            // 🔥 A NOVA CONTAGEM BLINDADA DE ITENS DA MOCHILA (Comprados ou Ganhos)
            const sortudoItens = user.inventory.filter(i => {
                const name = (i.name || i.nome || '').toLowerCase();
                return name.includes('sortudo') && i.category !== 'RANK_SKILL';
            }).reduce((acc, cur) => acc + (cur.quantity || cur.quantidade || 1), 0);

            const tickets = user.inventory.filter(i => {
                const name = (i.name || i.nome || '').toLowerCase();
                return name.includes('ficha') || name.includes('ticket');
            }).reduce((acc, cur) => acc + (cur.quantity || cur.quantidade || 1), 0);

            res.json({
                hasRank: !!user.maxPcAchieved,
                activeRoulettes,
                skills: { 
                    roletada: cargasRoletada, 
                    tickets: tickets, 
                    sortudoCargas: sortudoCargas, 
                    sortudoItens: sortudoItens, 
                    sorteio: 0 
                }
            });
        } catch (error) { 
            console.error("Erro Status:", error);
            res.status(500).json({ error: 'Erro ao buscar status.' }); 
        }
    },

    // 🎲 GIRAR (A Lógica Principal)
    async spin(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { rouletteId, paymentMethod, useLuckyBuff, luckySource} = req.body;
            const user = await User.findById(req.user._id).session(session);
            const roulette = await Roulette.findById(rouletteId).session(session);


            if (!roulette || !roulette.active) throw new Error('Roleta indisponível ou expirada.');

            // 1. COBRANÇA
            if (paymentMethod === 'PC') {
                if (user.saldoPc < roulette.cost) throw new Error('Saldo insuficiente.');
                user.saldoPc -= roulette.cost;
            } else if (paymentMethod === 'SKILL_ROLETADA') {
                const skill = findInventoryItem(user.inventory, 'ROLETADA');
                if (!skill || skill.usesLeft <= 0) throw new Error('Sem cargas de Rank.');
                skill.usesLeft -= 1;
            } else if (paymentMethod === 'ITEM') {
                // Implementação futura para item consumível específico
            }

            // 2. SORTEIO (Lógica de Sortudo: Gira X vezes e pega o melhor)
            let rolls = useLuckyBuff ? 2 : 1;
            let bestPrize = null;
            let bestWeight = -1;

            // Se usar sortudo, desconta a carga ou o item!
            if (useLuckyBuff) {
                let buffApplied = false;

                // Se a fonte for a SKILL
                if (luckySource === 'SKILL' || !luckySource) {
                    const luckySkill = findInventoryItem(user.inventory, 'SORTUDO');
                    if (luckySkill && luckySkill.usesLeft > 0) {
                        luckySkill.usesLeft -= 1;
                        buffApplied = true;
                    }
                }
                // Se a fonte for o ITEM DA MOCHILA
                else if (luckySource === 'ITEM') {
                    // Busca qualquer item consumível que tenha 'sortudo' no nome
                    const luckyItemIndex = user.inventory.findIndex(i => {
                        const name = (i.name || i.nome || '').toLowerCase();
                        return name.includes('sortudo') && i.category !== 'RANK_SKILL';
                    });

                    if (luckyItemIndex !== -1) {
                        // Desconta a quantidade
                        if (user.inventory[luckyItemIndex].quantity > 1) {
                            user.inventory[luckyItemIndex].quantity -= 1;
                        } else {
                            user.inventory.splice(luckyItemIndex, 1);
                        }
                        buffApplied = true;
                    }
                }

                // Se não conseguiu aplicar nenhum buff, desativa o rolo duplo
                if (!buffApplied) {
                    rolls = 1;
                    console.log("Tentativa de uso do buff Sortudo falhou por falta de item/carga.");
                }
            }

            for (let i = 0; i < rolls; i++) {
                const random = Math.random() * 100;
                let currentChance = 0;
                let currentPrize = null;
                for (const item of roulette.items) {
                    currentChance += item.probability;
                    if (random <= currentChance) { currentPrize = item; break; }
                }
                if (!currentPrize) currentPrize = roulette.items[roulette.items.length - 1]; // Fallback

                // Peso para decidir qual é "melhor"
                const weight = getRarityWeight(currentPrize.rarity) + (currentPrize.value || 0);
                if (weight > bestWeight) { bestWeight = weight; bestPrize = currentPrize; }
            }

            // 3. ENTREGA DO PRÊMIO
            if (bestPrize.type === 'PC') {
                user.saldoPc += bestPrize.value;
            } else {
                let finalItem = {
                    itemId: bestPrize.prizeId,
                    name: bestPrize.name,
                    image: bestPrize.image,
                    rarity: bestPrize.rarity,
                    isHouseItem: bestPrize.isHouseItem,
                    validadeDias: bestPrize.validadeDias || 0
                };

                // Se tiver link com loja, atualiza dados visuais e herda validade se necessário
                if (bestPrize.prizeId) {
                    const dbItem = await StoreItem.findById(bestPrize.prizeId).session(session);
                    if (dbItem) {
                        finalItem.name = dbItem.nome;
                        finalItem.image = dbItem.imagem;
                        finalItem.isHouseItem = dbItem.isHouseItem; // Respeita a flag da loja
                        // Se a roleta não definiu validade específica, usa a do item da loja
                        if (!finalItem.validadeDias) finalItem.validadeDias = dbItem.validadeDias;
                    }
                }

                // 🔥 CÁLCULO DE DATA DE EXPIRAÇÃO
                let expiresAt = null;
                if (finalItem.validadeDias > 0) {
                    const hoje = new Date();
                    expiresAt = new Date(hoje.getTime() + (finalItem.validadeDias * 24 * 60 * 60 * 1000));
                }

                if (finalItem.isHouseItem) {
                    // --- CAMINHO DA SALA ---
                    // [SEGURANÇA]: Se for item de sala e validade for 0/null, força 14 dias
                    if (!expiresAt) {
                        console.log("⚠️ Roleta: Item de sala sem validade. Forçando 14 dias.");
                        expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 14);
                    }

                    if (user.turma) {
                        const classroom = await Classroom.findOne({ serie: { $regex: new RegExp(`^${user.turma.trim()}$`, 'i') } }).session(session);
                        if (classroom) {
                            classroom.roomInventory.push({
                                itemId: finalItem.itemId,
                                name: finalItem.name,
                                image: finalItem.image,
                                rarity: finalItem.rarity,
                                category: 'ROULETTE',
                                origin: 'ROULETTE',
                                acquiredBy: user._id, // Essencial para aparecer "Seu Item"
                                quantity: 1,
                                acquiredAt: new Date(),
                                expiresAt: expiresAt // ✅ Data Salva
                            });
                            await classroom.save({ session });
                        }
                    }
                } else {
                    // --- CAMINHO DO USUÁRIO ---
                    user.inventory.push({
                        itemId: finalItem.itemId,
                        name: finalItem.name,
                        image: finalItem.image,
                        rarity: finalItem.rarity,
                        category: 'ROULETTE',
                        origin: 'ROULETTE',
                        quantity: 1,
                        acquiredAt: new Date(),
                        expiresAt: expiresAt // ✅ Data Salva
                    });
                }
            }

            user.markModified('inventory');
            await user.save({ session });

            await Log.create([{
                user: user._id,
                action: 'ROULETTE_SPIN',
                details: `Ganhou ${bestPrize.name}`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ success: true, prize: bestPrize, isDoubleSpin: rolls > 1 });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro Spin:", error);
            res.status(400).json({ error: error.message });
        } finally { session.endSession(); }
    }
};