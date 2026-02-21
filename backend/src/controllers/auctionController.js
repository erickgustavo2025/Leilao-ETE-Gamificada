const mongoose = require('mongoose');
const Item = require('../models/Item');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Log = require('../models/Log');
const Classroom = require('../models/Classroom');
const StoreItem = require('../models/StoreItem'); // 🔥 NOVO: Para puxar dados originais

// ==================================================================================
// 🔒 HELPER: FECHAR LEILÃO E ENTREGAR ITEM
// ==================================================================================
exports.executeAuctionClosure = async (itemId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const item = await Item.findById(itemId).session(session);

        if (!item || item.status !== 'ativo') {
            await session.abortTransaction();
            session.endSession();
            return { success: false, message: 'Item já fechado ou não encontrado.' };
        }

        let message = 'Leilão fechado sem lances.';

        if (item.maiorLance && item.maiorLance.user) {
            item.ganhador = item.maiorLance.user;
            item.status = 'entregue'; 

            const winner = await User.findById(item.ganhador).session(session);

            if (winner) {
                // Cálculo de Validade BLINDADO
                const diasValidade = (item.validadeDias && item.validadeDias > 0) ? item.validadeDias : 0;
                let expiresAt = null;
                if (diasValidade > 0) {
                    expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + diasValidade);
                }

                if (item.isHouseItem) {
                    if (winner.turma) {
                        const turmaRegex = new RegExp(`^${winner.turma.trim()}$`, 'i');
                        const classroom = await Classroom.findOne({ serie: { $regex: turmaRegex } }).session(session);

                        if (classroom) {
                            if(!classroom.roomInventory) classroom.roomInventory = [];
                            classroom.roomInventory.push({
                                itemId: item._id, 
                                name: item.titulo,
                                nome: item.titulo,
                                description: item.descricao,
                                descricao: item.descricao,
                                image: item.imagemUrl,
                                imagem: item.imagemUrl,
                                category: 'LEILAO',
                                origin: 'PREMIO',
                                acquiredBy: winner._id,
                                adquiridoPor: winner._id,
                                quantity: 1,
                                quantidade: 1,
                                acquiredAt: new Date(),
                                expiresAt: expiresAt
                            });
                            await classroom.save({ session });
                            message = `Item de Sala entregue para a turma ${winner.turma}`;
                        } else {
                            winner.saldoPc += item.maiorLance.valor;
                            message = `Erro: Sala não encontrada. Valor estornado.`;
                        }
                    } else {
                        winner.saldoPc += item.maiorLance.valor;
                        message = `Aluno sem turma. Valor estornado.`;
                    }
                } 
                else {
                    winner.inventory.push({
                        itemId: item._id,
                        name: item.titulo,
                        descricao: item.descricao,
                        image: item.imagemUrl,
                        imagem: item.imagemUrl,
                        rarity: 'LEILÃO',
                        raridade: 'LEILÃO',
                        category: 'CONSUMIVEL', 
                        quantity: 1,
                        acquiredAt: new Date(),
                        expiresAt: expiresAt,
                        origin: 'LEILAO'
                    });
                    message = `Item entregue para: ${winner.nome}`;
                }

                await winner.save({ session });

                if (Log) {
                    await Log.create([{
                        user: item.ganhador,
                        action: 'AUCTION_WIN',
                        details: `Venceu: ${item.titulo}. Valor: ${item.maiorLance.valor}. Destino: ${item.isHouseItem ? 'SALA' : 'PESSOAL'}`,
                        ip: 'SYSTEM'
                    }], { session });
                }
            }
        } else {
            item.status = 'finalizado';
        }

        await item.save({ session });
        await session.commitTransaction();
        session.endSession();
        
        if (global.io) {
            const closedItem = await Item.findById(itemId).populate('maiorLance.user', 'nome matricula');
            global.io.emit('auction_update', closedItem);
        }

        return { success: true, message };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, error: error.message };
    }
};

// ==================================================================================
// 🟢 ROTAS PÚBLICAS/ALUNO
// ==================================================================================

exports.getItems = async (req, res) => {
    try {
        const items = await Item.find().populate('maiorLance.user', 'nome matricula');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar itens.' });
    }
};

exports.placeBid = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        // 🔥 BLINDAGEM DO NaN: Aceita 'valor' ou 'bidValue' e força virar Numero
        const rawValue = req.body.valor || req.body.bidValue;
        const bidValue = Number(rawValue);

        if (isNaN(bidValue) || bidValue <= 0) throw new Error('Valor de lance inválido.');

        const { useItemId } = req.body;
        const userId = req.user._id;

        const item = await Item.findById(id).session(session);
        const user = await User.findById(userId).session(session);

        if (!item || item.status !== 'ativo') throw new Error('Leilão encerrado.');
        if (new Date() > new Date(item.dataFim)) throw new Error('Tempo esgotado!');

        if (item.seriesPermitidas && item.seriesPermitidas.length > 0) {
            const userAno = user.turma.match(/\d+/)?.[0];
            if (!userAno || !item.seriesPermitidas.includes(userAno)) {
                throw new Error(`Restrito ao(s) ${item.seriesPermitidas.join('º, ')}º ano(s).`);
            }
        }

        const lanceAtual = item.maiorLance?.valor || item.lanceMinimo;
        if (bidValue <= lanceAtual) {
            throw new Error(`O lance deve ser maior que ${lanceAtual} PC$.`);
        }

        let discountMultiplier = 1; 
        let skillNameUsed = null;
        let slotIndex = -1;

        if (useItemId) {
            slotIndex = user.inventory.findIndex(slot => slot._id.toString() === useItemId);
            
            if (slotIndex === -1) throw new Error("Item de desconto não encontrado.");
            
            const slot = user.inventory[slotIndex];
            const nameLower = (slot.name || slot.nome || '').toLowerCase();

            if (slot.category === 'RANK_SKILL' && slot.usesLeft <= 0) {
                throw new Error("Sem usos restantes para esta Skill.");
            }
            if (slot.category !== 'RANK_SKILL' && slot.quantity <= 0) {
                throw new Error("Item esgotado.");
            }

            if (nameLower.includes('aprimorado') || nameLower.includes('75%')) {
                discountMultiplier = 0.25; 
                skillNameUsed = "Arrematador Aprimorado (75%)";
            } else if (nameLower.includes('arrematador') || nameLower.includes('50%')) {
                discountMultiplier = 0.50; 
                skillNameUsed = "Arrematador (50%)";
            } else {
                throw new Error("Este item não serve para leilão.");
            }
        }

        const realCost = Math.ceil(bidValue * discountMultiplier);

        if (user.saldoPc < realCost) {
            throw new Error(`Saldo insuficiente. Necessário: ${realCost} PC$ (com desconto).`);
        }

        if (item.maiorLance && item.maiorLance.user) {
            const prevWinner = await User.findById(item.maiorLance.user).session(session);
            if (prevWinner) {
                prevWinner.saldoPc += item.maiorLance.valor; 
                await prevWinner.save({ session });
            }
        }

        user.saldoPc -= realCost;

        if (slotIndex > -1) {
            const slot = user.inventory[slotIndex];
            if (slot.category === 'RANK_SKILL') {
                slot.usesLeft -= 1;
            } else {
                if (slot.quantity > 1) {
                    slot.quantity -= 1;
                } else {
                    user.inventory.splice(slotIndex, 1);
                }
            }
            user.markModified('inventory');
        }

        await user.save({ session });

        item.maiorLance = {
            user: userId,
            valor: bidValue, 
            data: new Date()
        };
        item.markModified('maiorLance'); 
        await item.save({ session });

        await Bid.create([{
            item: id,
            user: userId,
            valor: bidValue,
            data: new Date()
        }], { session });

        if (Log) {
            const logDetail = skillNameUsed 
                ? `Lance de ${bidValue} (Pago: ${realCost} com ${skillNameUsed}) em ${item.titulo}`
                : `Lance de ${bidValue} em ${item.titulo}`;
            await Log.create([{ user: userId, action: 'BID_PLACED', details: logDetail, ip: req.ip }], { session });
        }

        await session.commitTransaction();
        session.endSession();

        if (global.io) {
            const updatedItem = await Item.findById(id).populate('maiorLance.user', 'nome matricula');
            global.io.emit('auction_update', updatedItem);
        }

        res.json({ message: 'Lance aceito!', novoSaldo: user.saldoPc, descontoAplicado: !!skillNameUsed });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error.message });
    }
};

exports.getStudentHistory = async (req, res) => {
    try {
        const history = await Bid.find({ user: req.user._id }).populate('item', 'titulo status imagemUrl').sort({ data: -1 });
        res.json(history);
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao buscar histórico.' }); 
    }
};

// ==================================================================================
// 🔴 ROTAS ADMIN (CRUD)
// ==================================================================================

exports.createItem = async (req, res) => {
    try {
        const { titulo, descricao, lanceMinimo, dataFim, seriesPermitidas, rankMinimo, validadeDias, isHouseItem, originalItemId } = req.body;
        
        let seriesArray = [];
        try { seriesArray = JSON.parse(seriesPermitidas || '[]'); } catch (e) { seriesArray = []; }
        
        // Se mandou um ID original de BD, buscamos a foto dele caso n tenha upado foto nova
        let finalImageUrl = req.file ? `/uploads/${req.file.filename}` : '';
        
        if(!finalImageUrl && originalItemId) {
            const refItem = await StoreItem.findById(originalItemId);
            if(refItem) finalImageUrl = refItem.imagem;
        }

        if (!finalImageUrl) return res.status(400).json({ message: 'Imagem obrigatória.' });

        const item = await Item.create({
            titulo, 
            descricao, 
            lanceMinimo: Number(lanceMinimo),
            dataFim: new Date(dataFim),
            imagemUrl: finalImageUrl,
            seriesPermitidas: seriesArray,
            rankMinimo: rankMinimo || '',
            maiorLance: { valor: Number(lanceMinimo), user: null },
            validadeDias: Number(validadeDias) || 0,
            isHouseItem: isHouseItem === 'true' || isHouseItem === true // 🔥 BLINDADO
        });

        if (global.io) global.io.emit('auction_update', item);
        res.status(201).json(item);
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao criar item', error: error.message }); 
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, lanceMinimo, dataFim, seriesPermitidas, rankMinimo, isHouseItem, validadeDias } = req.body;

        const item = await Item.findById(id);
        if (!item) return res.status(404).json({ message: 'Item não encontrado.' });

        if (item.maiorLance && item.maiorLance.user) {
            item.titulo = titulo || item.titulo;
            item.descricao = descricao || item.descricao;
        } else {
            if (lanceMinimo) {
                item.lanceMinimo = Number(lanceMinimo);
                item.maiorLance.valor = Number(lanceMinimo);
            }
        }

        if (dataFim) item.dataFim = new Date(dataFim);
        if (seriesPermitidas) { try { item.seriesPermitidas = JSON.parse(seriesPermitidas); } catch (e) { } }
        if (rankMinimo !== undefined) item.rankMinimo = rankMinimo;
        if (validadeDias !== undefined) item.validadeDias = Number(validadeDias);
        
        // 🔥 BLINDADO A ATUALIZAÇÃO DA FLAG DE CASA
        if (isHouseItem !== undefined) {
            item.isHouseItem = isHouseItem === 'true' || isHouseItem === true;
        }
        
        if (req.file) item.imagemUrl = `/uploads/${req.file.filename}`;

        await item.save();

        if (global.io) {
            const updatedItem = await Item.findById(id).populate('maiorLance.user', 'nome matricula');
            global.io.emit('auction_update', updatedItem);
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao editar item', error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        if(global.io) global.io.emit('auction_delete', req.params.id);
        res.json({ message: 'Item removido' });
    } catch (e) { 
        res.status(500).json({ error: 'Erro ao deletar' }); 
    }
};

exports.closeItem = async (req, res) => {
    const result = await exports.executeAuctionClosure(req.params.id);
    if (result.success) res.json({ message: 'Fechado manualmente com sucesso.' });
    else res.status(400).json(result);
};

// Histórico Global (Hall da Fama - Todos os leilões encerrados)
exports.getGlobalHistory = async (req, res) => {
    try {
        const history = await Item.find({ 
            status: { $in: ['finalizado', 'entregue'] } 
        })
        .populate('maiorLance.user', 'nome matricula')
        .populate('ganhador', 'nome matricula')
        .sort({ dataFim: -1 })
        .limit(20);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar hall da fama.' });
    }
};