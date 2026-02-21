// ARQUIVO: backend/src/controllers/classroomController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Helper para match de turmas
const createFlexibleRegex = (text) => {
    if (!text) return null;
    const clean = text.replace(/[º°ª]/g, '');
    let pattern = clean.split('').map(char => {
        if (/\d/.test(char)) return `${char}\\s*[º°ªoO]?\\s*`;
        if (/\s/.test(char)) return '\\s*';
        return char;
    }).join('');
    return new RegExp(`^${pattern}$`, 'i');
};

module.exports = {
    // LISTAR TODAS (Ranking)
    async index(req, res) {
        try {
            const classrooms = await Classroom.find();
            
            const pontosAgrupados = await User.aggregate([
                { $match: { role: { $in: ['student', 'monitor'] } } },
                { $group: { 
                    _id: "$turma", 
                    totalPc: { $sum: "$saldoPc" },
                    count: { $sum: 1 }
                }}
            ]);

            const classroomsComPontos = classrooms.map(sala => {
                const regex = createFlexibleRegex(sala.serie);
                const stats = pontosAgrupados.find(p => p._id && regex.test(p._id));
                return {
                    ...sala.toObject(),
                    pontuacao: stats?.totalPc || 0,
                    alunosCount: stats?.count || 0
                };
            });

            classroomsComPontos.sort((a, b) => b.pontuacao - a.pontuacao);
            res.json(classroomsComPontos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar salas.' });
        }
    },

    // CRIAR SALA
    async store(req, res) {
        const { nome, serie, cor, descricao } = req.body; 
        let logo = '/assets/etegamificada.png';
        if (req.file) logo = `/uploads/${req.file.filename}`;

        try {
            const classroom = await Classroom.create({
                nome, serie, cor, pontuacao: 0, descricao, logo
            });
            return res.status(201).json(classroom);
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao criar sala. Verifique a SÉRIE.' });
        }
    },

    // ATUALIZAR SALA
    async update(req, res) {
        const { id } = req.params;
        const { nome, serie, cor, descricao, imagem, logo } = req.body;

        try {
            const classroom = await Classroom.findById(id);
            if (!classroom) return res.status(404).json({ error: 'Sala não encontrada.' });

            if (req.file) {
                classroom.logo = `/uploads/${req.file.filename}`;
            }
            
            if (imagem) classroom.logo = imagem; 
            if (logo) classroom.logo = logo;

            if (nome) classroom.nome = nome;
            if (serie) classroom.serie = serie;
            if (cor) classroom.cor = cor;
            if (descricao) classroom.descricao = descricao;

            await classroom.save();
            return res.json(classroom);
        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: 'Erro ao atualizar sala.' });
        }
    },
    
    // DELETAR SALA
    async delete(req, res) {
        try {
            await Classroom.findByIdAndDelete(req.params.id);
            return res.json({ message: 'Sala removida com sucesso!' });
        } catch (error) {
            return res.status(400).json({ error: 'Erro ao deletar sala.' });
        }
    },

    // 🎒 PEGAR INVENTÁRIO DA SALA (CORRIGIDO AGORA VAI!)
    async getClassroomInventory(req, res) {
        try {
            const { id } = req.params;
            const turmaAlvo = decodeURIComponent(id).trim().toUpperCase();

            const classroom = await Classroom.findOne({ 
                serie: { $regex: new RegExp(`^${turmaAlvo}$`, 'i') } 
            })
            .populate({
                path: 'roomInventory.itemId',
                model: 'StoreItem',
                select: 'nome imagem descricao raridade lojaTematica'
            })
            .populate({
                path: 'roomInventory.acquiredBy',
                model: 'User',
                select: 'nome matricula' 
            });

            if (!classroom) {
                return res.status(404).json({ error: 'Sala não encontrada.' });
            }

            const inventory = classroom.roomInventory.map(slot => {
                // Se populou o StoreItem, mescla os dados
                if (slot.itemId && typeof slot.itemId === 'object') {
                    return {
                        _id: slot._id,
                        quantity: slot.quantity,
                        origin: slot.origin,
                        acquiredAt: slot.acquiredAt,
                        expiresAt: slot.expiresAt, // 🔥 AQUI ESTÁ A SALVAÇÃO!
                        acquiredBy: slot.acquiredBy,
                        
                        // Dados visuais vindos do StoreItem (prioridade)
                        name: slot.itemId.nome,
                        image: slot.itemId.imagem,
                        description: slot.itemId.descricao,
                        raridade: slot.itemId.raridade,
                        category: slot.itemId.lojaTematica
                    };
                }
                // Se não populou (item deletado da loja), manda o slot cru
                return {
                    _id: slot._id,
                    quantity: slot.quantity,
                    origin: slot.origin,
                    acquiredAt: slot.acquiredAt,
                    expiresAt: slot.expiresAt, // 🔥 AQUI TAMBÉM!
                    acquiredBy: slot.acquiredBy,
                    name: slot.name,
                    image: slot.image,
                    description: slot.description,
                    category: slot.category
                };
            });
           
            res.json(inventory);

        } catch (error) {
            console.error("💀 Erro ao processar baú:", error);
            res.status(500).json({ error: 'Erro interno ao abrir o baú.' });
        }
    },

    async listAllSimple(req, res) {
        try {
            const classrooms = await Classroom.find().select('nome serie imagem logo cor');
            const simpleClasses = classrooms.map(c => ({
                _id: c._id,
                serie: c.serie,
                nome: c.nome,
                imagem: c.imagem || c.logo
            })).sort((a, b) => a.serie.localeCompare(b.serie, undefined, { numeric: true }));

            res.json(simpleClasses);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar salas para admin.' });
        }
    },
};