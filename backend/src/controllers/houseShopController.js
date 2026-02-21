const mongoose = require('mongoose');
const StoreItem = require('../models/StoreItem');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Log = require('../models/Log');

module.exports = {
    // 🛒 LISTAR ITENS BECO
    async getBecoItems(req, res) {
        try {
            const items = await StoreItem.find({ isHouseItem: true, ativo: true });
            const groupedItems = items.reduce((acc, item) => {
                const category = item.lojaTematica || 'OUTROS';
                if (!acc[category]) acc[category] = [];
                acc[category].push(item);
                return acc;
            }, {});
            const defaultCategories = ['VASSOURAS', 'VARINHAS', 'POCOES', 'MAROTO', 'MINISTERIO', 'MAGIC_BOOK'];
            defaultCategories.forEach(cat => { if (!groupedItems[cat]) groupedItems[cat] = []; });
            return res.json(groupedItems);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao abrir as portas do Beco Diagonal.' });
        }
    },

    // 💰 COMPRA COLETIVA BECO (Com regra de validade 14 dias blindada)
    async buyCollective(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { items } = req.body;
            const representante = req.user;

            if (!representante.cargos.includes('representante') && !representante.cargos.includes('vice_representante') && representante.role !== 'admin') {
                throw new Error('Apenas Representantes podem fazer compras coletivas.');
            }

            let totalCost = 0;
            const finalItems = [];

            for (const i of items) {
                const storeItem = await StoreItem.findById(i.itemId).session(session);
                if (!storeItem || storeItem.estoque < i.quantity) throw new Error(`Item ${storeItem?.nome || 'Desconhecido'} sem estoque.`);

                totalCost += storeItem.preco * i.quantity;
                storeItem.estoque -= i.quantity;
                await storeItem.save({ session });

                const validadePadrao = 14;
                const diasValidade = (storeItem.validadeDias && storeItem.validadeDias > 0) ? storeItem.validadeDias : validadePadrao;
                
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + diasValidade);

                finalItems.push({
                    itemId: storeItem._id,
                    name: storeItem.nome,
                    image: storeItem.imagem,
                    description: storeItem.descricao,
                    category: storeItem.lojaTematica,
                    quantity: i.quantity,
                    origin: 'COMPRA_COLETIVA',
                    acquiredBy: representante._id,
                    acquiredAt: new Date(),
                    expiresAt: expiresAt
                });
            }

            const students = await User.find({ turma: representante.turma, isBlocked: false }).session(session);
            if (students.length === 0) throw new Error('Nenhum aluno ativo na turma.');

            const costPerStudent = Math.ceil(totalCost / students.length);
            if (costPerStudent > 0) {
                await User.updateMany(
                    { turma: representante.turma, isBlocked: false, role: { $in: ['student', 'monitor'] }, cargos: { $ne: 'armada_dumbledore' } },
                    { $inc: { saldoPc: -costPerStudent } },
                    { session }
                );
            }
            
            const turmaClean = representante.turma.trim();
            const classroom = await Classroom.findOne({ serie: { $regex: new RegExp(`^${turmaClean}$`, 'i') } }).session(session);
            if (!classroom) throw new Error('Sala não encontrada.');

            classroom.roomInventory.push(...finalItems);
            await classroom.save({ session });

            await Log.create([{
                user: representante._id,
                action: 'BECO_COMPRA',
                details: `Comprou ${finalItems.length} itens. Rateio: ${costPerStudent}/aluno.`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: `Compra realizada! Cada aluno pagou ${costPerStudent} PC$.` });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    },

    // 👤 COMPRA INDIVIDUAL BECO (Com regra de validade 14 dias blindada)
    async buyIndividual(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { itemId } = req.body;
            const buyer = await User.findById(req.user._id).session(session);
            const storeItem = await StoreItem.findById(itemId).session(session);

            if (!storeItem) throw new Error('Item não encontrado.');
            if (buyer.saldoPc < storeItem.preco) throw new Error('Saldo insuficiente.');

            buyer.saldoPc -= storeItem.preco;
            await buyer.save({ session });

            const turmaClean = buyer.turma.trim();
            const classroom = await Classroom.findOne({ serie: { $regex: new RegExp(`^${turmaClean}$`, 'i') } }).session(session);

            if (!classroom) throw new Error(`Sala "${buyer.turma}" não encontrada.`);

            const validadePadrao = 14;
            const diasValidade = (storeItem.validadeDias && storeItem.validadeDias > 0) ? storeItem.validadeDias : validadePadrao;
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + diasValidade);

            classroom.roomInventory.push({
                itemId: storeItem._id,
                name: storeItem.nome,
                image: storeItem.imagem,
                description: storeItem.descricao,
                category: storeItem.lojaTematica,
                quantity: 1,
                origin: 'COMPRA_INDIVIDUAL',
                acquiredBy: buyer._id,
                acquiredAt: new Date(),
                expiresAt: expiresAt
            });

            await classroom.save({ session });

            await Log.create([{
                user: buyer._id,
                action: 'BECO_COMPRA_INDIVIDUAL',
                details: `Comprou ${storeItem.nome} para a sala ${buyer.turma}`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: 'Compra realizada!' });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    }
};