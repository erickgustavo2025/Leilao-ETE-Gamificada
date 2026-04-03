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

    // 💰 COMPRA COLETIVA BECO (Refatorada: Método do Maior Resto + Transactions + bulkWrite)
    async buyCollective(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { items } = req.body;
            const representante = req.user;

            // 🛡️ TRAVA 1: Permissão de Representante
            if (!representante.cargos.includes('representante') && !representante.cargos.includes('vice_representante') && representante.role !== 'admin') {
                throw new Error('Apenas Representantes podem fazer compras coletivas.');
            }

            let totalCost = 0;
            const finalItems = [];

            // 1. Processamento dos Itens e Estoque
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
                    origin: 'PREMIO', // ⚠️ REGRA DE OURO: origin DEVE ser 'PREMIO'
                    acquiredBy: representante._id,
                    acquiredAt: new Date(),
                    expiresAt: expiresAt
                });
            }

            // 🔒 LIMITE DE 10.000 PC$ por compra coletiva
            if (totalCost > 10000) {
                throw new Error('O valor total da compra coletiva não pode ultrapassar 10.000 PC$.');
            }

            // 2. Cálculo da Vaquinha Proporcional (Método do Maior Resto)
            const students = await User.find({ 
                turma: representante.turma, 
                isBlocked: false, 
                role: { $in: ['student', 'monitor'] }, 
                cargos: { $ne: 'armada_dumbledore' } 
            }).session(session);

            if (students.length === 0) throw new Error('Nenhum aluno ativo na turma para participar.');

            const somaTotalSaldoPc = students.reduce((sum, s) => sum + s.saldoPc, 0);

            // 🛡️ TRAVA 2: Turma Pobre
            if (somaTotalSaldoPc < totalCost) {
                throw new Error(`A turma não possui saldo suficiente (${somaTotalSaldoPc} PC$) para o total de ${totalCost} PC$.`);
            }

            // Cálculo das cotas iniciais e restos
            let cotas = students.map(student => {
                const cotaExata = (student.saldoPc / somaTotalSaldoPc) * totalCost;
                const cotaInicial = Math.floor(cotaExata);
                const resto = cotaExata - cotaInicial;
                return { studentId: student._id, cotaInicial, resto, cotaFinal: cotaInicial };
            });

            // Distribuição do resíduo (Maior Resto)
            let diferencaResidual = totalCost - cotas.reduce((sum, c) => sum + c.cotaInicial, 0);
            cotas.sort((a, b) => b.resto - a.resto);
            
            for (let i = 0; i < Math.round(diferencaResidual); i++) {
                cotas[i].cotaFinal++;
            }

            // 3. Execução Atômica via bulkWrite ($gte)
            const bulkOperations = cotas.filter(c => c.cotaFinal > 0).map(cota => ({
                updateOne: {
                    filter: { _id: cota.studentId, saldoPc: { $gte: cota.cotaFinal } },
                    update: { $inc: { saldoPc: -cota.cotaFinal } }
                }
            }));

            if (bulkOperations.length > 0) {
                const bulkWriteResult = await User.bulkWrite(bulkOperations, { session });
                if (bulkWriteResult.modifiedCount !== bulkOperations.length) {
                    throw new Error('Falha na transação: Um ou mais alunos tiveram alteração de saldo durante o processo.');
                }
            }
            
            // 4. Entrega na Sala
            const turmaClean = representante.turma.trim();
            const classroom = await Classroom.findOne({ serie: { $regex: new RegExp(`^${turmaClean}$`, 'i') } }).session(session);
            if (!classroom) throw new Error('Sala não encontrada.');

            classroom.roomInventory.push(...finalItems);
            await classroom.save({ session });

            // 5. Registro de Log
            await Log.create([{
                user: representante._id,
                action: 'BECO_COMPRA_COLETIVA',
                details: `Compra coletiva de ${finalItems.length} itens. Rateio proporcional concluído (Total: ${totalCost} PC$).`,
                ip: req.ip
            }], { session });

            await session.commitTransaction();
            res.json({ message: `Compra coletiva de ${totalCost} PC$ realizada com sucesso!` });

        } catch (error) {
            await session.abortTransaction();
            res.status(400).json({ error: error.message });
        } finally {
            session.endSession();
        }
    },
    
    // 👤 COMPRA INDIVIDUAL BECO
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
                origin: 'PREMIO', // Ajustado para seguir o padrão de auditoria
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
