const Ticket = require('../models/Ticket');
const Log = require('../models/Log');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const mongoose = require('mongoose');

module.exports = {
    // 🔍 1. VALIDAR TICKET (Scanner)
    async validateTicket(req, res) {
        try {
            const { hash } = req.body;
            const validatorId = req.user.id;

            const ticket = await Ticket.findOne({ hash: hash.toUpperCase() })
                .populate('user', 'nome matricula');

            if (!ticket) {
                return res.status(404).json({ message: "Ticket inválido ou não encontrado." });
            }

            if (ticket.status !== 'PENDENTE') {
                const dataUso = ticket.dataUso ? new Date(ticket.dataUso).toLocaleString() : 'Data desconhecida';
                return res.status(400).json({ message: `Ticket já utilizado em ${dataUso}` });
            }

            // Atualiza status
            ticket.status = 'USADO';
            ticket.validadoPor = validatorId;
            ticket.dataUso = new Date();
            await ticket.save();

            // Log
            await Log.create({
                user: validatorId,
                target: ticket.user._id,
                action: 'TICKET_VALIDATED',
                details: `Validou item "${ticket.itemNome}" do aluno ${ticket.user.nome}`,
                ip: req.ip
            });

            return res.json({ 
                message: "Validado com sucesso!", 
                ticket: {
                    itemNome: ticket.itemNome,
                    user: ticket.user,
                    dataUso: ticket.dataUso
                }
            });

        } catch (error) {
            console.error("Erro validateTicket:", error);
            return res.status(500).json({ message: "Erro interno na validação." });
        }
    },

    // 📋 2. LISTAR MEUS TICKETS
    async getMyTickets(req, res) {
        try {
            const tickets = await Ticket.find({ 
                user: req.user.id,
                tipo: { $ne: 'room_item' } // Filtra se não for item de sala
            }).sort({ createdAt: -1 });
            res.json(tickets);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar tickets." });
        }
    },

    // 🏫 3. LISTAR TICKETS DA SALA
    async getRoomTickets(req, res) {
        try {
            const userTurma = req.user.turma;
            const turmaRegex = new RegExp(`^${userTurma.trim()}$`, 'i');

            const tickets = await Ticket.find({ 
                tipo: 'room_item',
                classroomOrigin: { $regex: turmaRegex },
              
            }).populate('user', 'nome').sort({ createdAt: -1 });

            res.json(tickets);
        } catch (error) {
            res.status(500).json({ message: "Erro ao buscar tickets da sala." });
        }
    },

    // ❌ 4. CANCELAR TICKET (Com devolução Perfeita)
    async cancelTicket(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const ticket = await Ticket.findOne({ _id: id, user: userId }).session(session);
            if (!ticket || ticket.status !== 'PENDENTE') throw new Error("Ticket não encontrado ou já usado.");

            // =================================================
            // CASO A: DEVOLUÇÃO PARA A SALA
            // =================================================
            if (ticket.tipo === 'room_item' || ticket.classroomOrigin) {
                const turmaBusca = ticket.classroomOrigin;
                const classroom = await Classroom.findOne({ serie: { $regex: new RegExp(`^${turmaBusca}$`, 'i') } }).session(session);
                
                if (!classroom) throw new Error("Sala não encontrada para devolução.");

                // Tenta achar slot existente para empilhar
                const existingSlot = classroom.roomInventory.find(i => 
                    (i.itemId && ticket.itemId && i.itemId.toString() === ticket.itemId.toString()) ||
                    (i.name === ticket.itemNome)
                );

                if (existingSlot) {
                    existingSlot.quantity += 1;
                } else {
                    classroom.roomInventory.push({
                        itemId: ticket.itemId,
                        name: ticket.itemNome,
                        image: ticket.itemImagem,
                        description: ticket.itemDescricao,
                        rarity: ticket.itemRaridade,
                        quantity: 1,
                        
                        // 🔥🔥 AQUI ESTAVA FALTANDO! AGORA VAI COM VALIDADE E DONO! 🔥🔥
                        expiresAt: ticket.itemExpiresAt, // Restaura a validade original
                        acquiredBy: ticket.user,         // Devolve a posse para quem criou o ticket
                        
                        origin: 'TICKET_CANCELADO',
                        acquiredAt: new Date()
                    });
                }
                await classroom.save({ session });

            // =================================================
            // CASO B: DEVOLUÇÃO PESSOAL (Skill ou Item)
            // =================================================
            } else {
                const user = await User.findById(userId).session(session);
                
                const existingIndex = user.inventory.findIndex(i => {
                    const iId = i.itemId ? (i.itemId._id || i.itemId).toString() : null;
                    const tId = ticket.itemId ? ticket.itemId.toString() : null;
                    return (iId && tId && iId === tId) || (i.name === ticket.itemNome);
                });

                if (existingIndex > -1) {
                    const item = user.inventory[existingIndex];
                    if (item.category === 'RANK_SKILL' || ticket.tipo === 'rank_skill') {
                         item.usesLeft = (item.usesLeft || 0) + 1; 
                    } else {
                         item.quantity += 1;
                    }
                } else {
                    const isSkill = ticket.tipo === 'rank_skill';
                    user.inventory.push({
                        itemId: ticket.itemId,
                        name: ticket.itemNome,
                        descricao: ticket.itemDescricao,
                        image: ticket.itemImagem,
                        imagem: ticket.itemImagem, 
                        rarity: ticket.itemRaridade,
                        raridade: ticket.itemRaridade, 
                        
                        expiresAt: ticket.itemExpiresAt, // Restaura validade pessoal
                        
                        category: isSkill ? 'RANK_SKILL' : 'CONSUMIVEL',
                        usesLeft: isSkill ? 1 : undefined,
                        
                        quantity: 1,
                        acquiredAt: new Date(),
                        origin: 'TICKET_CANCELADO'
                    });
                }
                
                user.markModified('inventory');
                await user.save({ session });
            }

            await Ticket.deleteOne({ _id: id }).session(session);
            
            await session.commitTransaction();
            res.json({ message: "Ticket cancelado e item devolvido!" });

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro cancelTicket:", error);
            res.status(400).json({ message: error.message || "Erro ao cancelar." });
        } finally {
            session.endSession();
        }
    }
};