const mongoose = require('mongoose');
const StoreItem = require('../models/StoreItem');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Log = require('../models/Log');

module.exports = {
    // 🛒 LISTAR ITENS LOJA PADRÃO
    async listItems(req, res) {
        try {
            const isAdmin = req.user.role === 'admin';
            const filter = {};

            if (!isAdmin) {
                filter.ativo = true;
                filter.estoque = { $gt: 0 };
                filter.$or = [
                    { cargoExclusivo: 'Todos' },
                    { cargoExclusivo: { $exists: false } },
                    { cargoExclusivo: req.user.role }
                ];
            }

            const items = await StoreItem.find(filter).sort({ preco: 1 });
            return res.json(items);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar itens.' });
        }
    },

    // 💰 COMPRAR ITEM LOJA PADRÃO
    async buyItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const itemId = id || req.params.itemId;
            const userId = req.user._id;

            const item = await StoreItem.findById(itemId).session(session);
            const user = await User.findById(userId).session(session);

            if (!item) throw new Error('Item não encontrado.');
            if (!item.ativo) throw new Error('Item indisponível.');
            if (item.estoque <= 0) throw new Error('Estoque esgotado.');
            if (user.saldoPc < item.preco) throw new Error('Saldo insuficiente.');

            user.saldoPc -= item.preco;
            item.estoque -= 1;

            if (item.isHouseItem) {
                if (!user.turma) throw new Error('Você precisa ter uma turma.');
                const turmaRegex = new RegExp(`^${user.turma.trim()}$`, 'i');
                const classroom = await Classroom.findOne({ serie: { $regex: turmaRegex } }).session(session);

                if (!classroom) throw new Error('Sua sala não foi encontrada.');

                const validadePadrao = 14;
                const diasValidade = (item.validadeDias && item.validadeDias > 0) ? item.validadeDias : validadePadrao;

                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + diasValidade);

                classroom.roomInventory.push({
                    itemId: item._id,
                    name: item.nome,
                    description: item.descricao,
                    image: item.imagem,
                    category: 'DECORACAO',
                    origin: 'COMPRA_INDIVIDUAL',
                    acquiredBy: user._id,
                    quantity: 1,
                    acquiredAt: new Date(),
                    expiresAt: expiresAt
                });

                await classroom.save({ session });
            } else {
                let expiresAt = null;
                if (item.validadeDias > 0) {
                    const hoje = new Date();
                    expiresAt = new Date(hoje.setDate(hoje.getDate() + item.validadeDias));
                }
                user.inventory.push({
                    itemId: item._id,
                    name: item.nome,
                    descricao: item.descricao,
                    image: item.imagem,
                    rarity: item.raridade,
                    category: item.validadeDias > 0 ? 'CONSUMIVEL' : 'PERMANENTE',
                    basePrice: item.preco,
                    quantity: 1,
                    acquiredAt: new Date(),
                    origin: 'store',
                    expiresAt: expiresAt
                });
                user.markModified('inventory');
            }

            await user.save({ session });
            await item.save({ session });

            await Log.create([{
                user: userId,
                action: 'COMPRA_LOJA',
                details: `Comprou ${item.nome} (-${item.preco} PC$) [${item.isHouseItem ? 'PARA SALA' : 'PESSOAL'}]`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: `Sucesso! ${item.nome} adquirido.`, novoSaldo: user.saldoPc });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro na compra:", error);
            res.status(400).json({ error: error.message || 'Falha na compra.' });
        } finally {
            session.endSession();
        }
    },

    // --- ÁREA ADMIN (CRUD) ---
    async createItem(req, res) {
        try {
            // 🔥 CORREÇÃO BRUTA: lojaTematica INSERIDA NA DESESTRUTURAÇÃO E NO CREATE!
            const { nome, descricao, preco, estoque, raridade, cargoExclusivo, validadeDias, isHouseItem, lojaTematica } = req.body;

            let imagem = '/assets/store.png';
            if (req.file) imagem = `/uploads/${req.file.filename}`;

            let validadeFinal = validadeDias !== undefined ? Number(validadeDias) : 0;

            const newItem = await StoreItem.create({
                nome, descricao,
                preco: Number(preco),
                estoque: Number(estoque),
                raridade, cargoExclusivo, imagem,
                validadeDias: validadeFinal,
                isHouseItem: isHouseItem === 'true' || isHouseItem === true,
                lojaTematica: lojaTematica || 'NENHUMA' 
            });

            return res.status(201).json(newItem);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar item.' });
        }
    },

    async updateItem(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const updates = { ...req.body };

            if (req.file) updates.imagem = `/uploads/${req.file.filename}`;
            if (updates.preco) updates.preco = Number(updates.preco);
            if (updates.estoque) updates.estoque = Number(updates.estoque);
            if (updates.validadeDias) updates.validadeDias = Number(updates.validadeDias);
            if (updates.isHouseItem !== undefined) updates.isHouseItem = updates.isHouseItem === 'true' || updates.isHouseItem === true;

            const updatedItem = await StoreItem.findByIdAndUpdate(id, updates, { new: true, session });

            if (!updatedItem) {
                await session.abortTransaction();
                return res.status(404).json({ error: 'Item não encontrado.' });
            }

            if (req.file || updates.nome || updates.descricao || updates.raridade) {
                await User.updateMany(
                    { "inventory.itemId": id },
                    {
                        $set: {
                            "inventory.$[elem].image": updatedItem.imagem,
                            "inventory.$[elem].name": updatedItem.nome,
                            "inventory.$[elem].descricao": updatedItem.descricao,
                            "inventory.$[elem].rarity": updatedItem.raridade
                        }
                    },
                    { arrayFilters: [{ "elem.itemId": id }], session }
                );
            }

            await session.commitTransaction();
            res.json(updatedItem);

        } catch (error) {
            await session.abortTransaction();
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar.' });
        } finally {
            session.endSession();
        }
    },

    async deleteItem(req, res) {
        try {
            await StoreItem.findByIdAndDelete(req.params.id);
            return res.json({ message: 'Item removido.' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao deletar.' });
        }
    }
};