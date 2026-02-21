const Classroom = require('../models/Classroom');
const HouseAction = require('../models/HouseAction');
const User = require('../models/User');
const Log = require('../models/Log');
const Punishment = require('../models/Punishment');
const SystemConfig = require('../models/SystemConfig');

module.exports = {
    // 🎒 [GET] /api/house/inventory/:turma
    async getHouseInventory(req, res) {
        try {
            const { turma } = req.params;
            const turmaClean = turma.trim();

            const classroom = await Classroom.findOne({ 
                serie: { $regex: new RegExp(`^${turmaClean}$`, 'i') } 
            }).populate('roomInventory.acquiredBy', 'nome');

            if (!classroom) return res.status(404).json({ error: 'Sala não encontrada.' });

            const now = new Date();
            const activeInventory = classroom.roomInventory.filter(item => {
                if (!item.expiresAt) return true; 
                return new Date(item.expiresAt) > now;
            });

            res.json(activeInventory);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar inventário.' });
        }
    },

    // 📊 [GET] /api/house/leaderboard
    async getLeaderboard(req, res) {
        try {
            const houses = await Classroom.find().sort({ pontuacaoAtual: -1 });
            res.json(houses);
        } catch (error) {
            res.status(500).json({ error: 'Erro ranking.' });
        }
    },

    // ⚙️ [GET] /api/house/config
    async getSystemStatus(req, res) {
        try {
            const config = await SystemConfig.findOne({ key: 'general' });
            if (!config) return res.json({ houseCupVisible: true, becoDiagonalOpen: true });
            res.json({
                houseCupVisible: config.houseCupVisible,
                becoDiagonalOpen: config.becoDiagonalOpen
            });
        } catch (error) {
            res.status(500).json({ error: 'Erro status.' });
        }
    },

    // 📊 [GET] /api/house/stats
    async getStats(req, res) {
        try {
            const [casasCount, alunosCount] = await Promise.all([
                Classroom.countDocuments(),
                User.countDocuments({ role: { $ne: 'admin' } })
            ]);
            res.json({ casas: casasCount, alunos: alunosCount, itens: 150, pontos: '∞' });
        } catch (error) {
            res.json({ casas: 12, alunos: 0, itens: 0, pontos: '∞' });
        }
    },

    // 📜 [GET] /api/house/history/global
    async getGlobalHistory(req, res) {
        try {
            const history = await HouseAction.find()
                .sort({ data: -1 }).limit(50).populate('autor', 'nome');
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Erro crônicas.' });
        }
    },

    // 🔥 📜 [GET] /api/house/:turma/history (HÍBRIDO: AÇÕES + PUNIÇÕES) 🔥
    async getHouseHistory(req, res) {
        try {
            const { turma } = req.params;
            
            // 1. Busca os bônus/ações normais
            const actions = await HouseAction.find({ turma })
                .sort({ data: -1 })
                .limit(30)
                .populate('autor', 'nome')
                .lean(); // lean() permite manipular o objeto livremente
            
            // 2. Busca as punições da turma (Tribunal)
            const punishments = await Punishment.find({ house: turma })
                .sort({ appliedAt: -1 })
                .limit(30)
                .populate('appliedBy', 'nome')
                .lean();

            // 3. Busca Punições/Decretos Globais (que afetam TODAS as turmas, mas n tem 'house' especifico)
            const globalPunishments = await Punishment.find({ house: 'TODAS' })
                .sort({ appliedAt: -1 })
                .limit(10)
                .populate('appliedBy', 'nome')
                .lean();

            // 4. Mapeia e Normaliza os dados para o Front-end ler como uma coisa só
            const normalizedActions = actions.map(a => ({
                _id: a._id.toString(),
                tipo: a.tipo || (a.valor > 0 ? 'GANHO' : 'PERDA'),
                valor: a.valor,
                motivo: a.motivo,
                autor: { nome: a.autor?.nome || 'Admin' },
                data: a.data
            }));

            const normalizedPunishments = [...punishments, ...globalPunishments].map(p => ({
                _id: p._id.toString(),
                tipo: p.type, // 'PUNIÇÃO', 'DECRETO', 'AVISO'
                valor: p.pointsDeducted > 0 ? -p.pointsDeducted : 0, // Transforma 100 em -100
                motivo: p.reason,
                autor: { nome: p.appliedBy?.nome || 'Tribunal' },
                data: p.appliedAt // Iguala o nome do campo de data
            }));

            // 5. Junta tudo e ordena do mais recente pro mais antigo
            const fullHistory = [...normalizedActions, ...normalizedPunishments]
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .slice(0, 50); // Limita aos 50 últimos para não explodir a memória

            res.json(fullHistory);
        } catch (error) {
            console.error("Erro no GetHouseHistory:", error);
            res.status(500).json({ error: 'Erro ao carregar histórico.' });
        }
    },

    // 👮 [POST] /api/house/points
    async managePoints(req, res) {
        try {
            const { turma, valor, motivo, tipo } = req.body;
            await HouseAction.create({
                turma, valor: Number(valor), motivo, tipo, autor: req.user._id
            });
            await Classroom.findOneAndUpdate(
                { serie: turma },
                { $inc: { pontuacaoAtual: Number(valor) } }
            );
            res.json({ message: 'OK' });
        } catch (error) {
            res.status(500).json({ error: 'Erro pontos.' });
        }
    },

    // 📋 [GET] /api/house/punitions
    async listPunishments(req, res) {
        try {
            const punishments = await Punishment.find()
                .populate('appliedBy', 'nome')
                .populate('targetAluno', 'nome matricula')
                .populate('classroomId', 'nome serie cor')
                .sort({ appliedAt: -1 }).limit(50);

            const formatted = punishments.map(p => ({
                _id: p._id, type: p.type, reason: p.reason,
                pointsDeducted: p.pointsDeducted, appliedAt: p.appliedAt,
                appliedBy: p.appliedBy, targetAluno: p.targetAluno,
                house: { nome: p.classroomId?.nome || 'Escola Inteira', serie: p.house } 
            }));
            res.json(formatted);
        } catch (error) {
            res.status(500).json({ error: 'Erro punições.' });
        }
    },

    // ⚖️ [POST] /api/house/punish
    async applyPunishment(req, res) {
        try {
            const { type, reason, points, houseSerie, studentId } = req.body;
            
            // 🔥 NOVO: LÓGICA DE APLICAR PARA A ESCOLA INTEIRA 🔥
            if (houseSerie === 'TODAS') {
                const classrooms = await Classroom.find();
                
                // Cria uma promessa para cada turma para salvar tudo em paralelo
                const promises = classrooms.map(async (classroom) => {
                    if (Number(points) > 0) {
                        classroom.pontuacaoAtual -= Number(points);
                        await classroom.save();
                    }
                    return Punishment.create({
                        type, reason, pointsDeducted: Number(points),
                        house: classroom.serie, classroomId: classroom._id,
                        targetAluno: null, appliedBy: req.user._id
                    });
                });

                await Promise.all(promises);
                return res.json({ message: 'Decreto aplicado a toda a escola!' });
            }

            // LÓGICA ORIGINAL: UMA ÚNICA TURMA
            const classroom = await Classroom.findOne({ serie: houseSerie });
            if (!classroom) return res.status(404).json({ error: 'Turma não encontrada.' });

            if (Number(points) > 0) {
                classroom.pontuacaoAtual -= Number(points);
                await classroom.save();
            }

            await Punishment.create({
                type, reason, pointsDeducted: Number(points),
                house: houseSerie, classroomId: classroom._id,
                targetAluno: studentId || null, appliedBy: req.user._id
            });

            res.json({ message: 'Punido com sucesso!' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao punir.' });
        }
    }
};