const mongoose = require('mongoose');
const User = require('../models/User');
const Log = require('../models/Log');
const SystemConfig = require('../models/SystemConfig');
const jwt = require('jsonwebtoken');

module.exports = {
    // 📊 ESTATÍSTICAS TÉCNICAS
    async getSystemStats(req, res) {
        try {
            const config = await SystemConfig.findOne();
            
            // Retorna o status detalhado
            const maintenanceState = {
                student: config ? config.maintenanceMode : false,
                global: config ? config.lockdownMode : false
            };

            const usersCount = await User.countDocuments();
            
            const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
            const errorsToday = await Log.countDocuments({
                createdAt: { $gte: oneDayAgo },
                action: { $regex: /ERROR|FAIL|DENIED|ATTACK|BRUTE/i }
            });

            const economyStats = await User.aggregate([
                { $group: { _id: null, totalPc: { $sum: "$saldoPc" } } }
            ]);
            
            return res.json({
                status: mongoose.connection.readyState === 1 ? 'ONLINE' : 'OFFLINE',
                usersCount,
                errorsToday,
                totalMoney: economyStats[0] ? economyStats[0].totalPc : 0,
                maintenance: maintenanceState // Envia o objeto com os dois estados
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar stats' });
        }
    },

    // 📜 LOGS COMPLETOS
    async getSystemLogs(req, res) {
        try {
            const { search } = req.query;
            let filter = {};

            if (search) {
                filter = {
                    $or: [
                        { action: { $regex: search, $options: 'i' } },
                        { details: { $regex: search, $options: 'i' } },
                        { ip: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const logs = await Log.find(filter)
                .sort({ createdAt: -1 })
                .limit(100)
                .populate('user', 'nome role');

            return res.json(logs);
        } catch (error) {
            return res.status(500).json({ error: 'Erro nos logs' });
        }
    },

    // 🔒 TOGGLE MANUTENÇÃO (Agora lida com Student E Global)
    async toggleMaintenance(req, res) {
        try {
            const { type, status } = req.body; // type: 'student' | 'global'
            
            let updateData = {};
            if (type === 'student') {
                updateData = { maintenanceMode: status };
            } else if (type === 'global') {
                updateData = { lockdownMode: status };
            } else {
                return res.status(400).json({ error: 'Tipo de manutenção inválido' });
            }

            const config = await SystemConfig.findOneAndUpdate(
                {}, 
                updateData, 
                { upsert: true, new: true }
            );

            await Log.create({
                user: req.user._id,
                action: 'SYSTEM_MAINTENANCE',
                details: `Alterou [${type.toUpperCase()}] para ${status ? 'ON' : 'OFF'}`,
                ip: req.ip
            });

            return res.json({ 
                message: 'Configuração atualizada', 
                maintenance: {
                    student: config.maintenanceMode,
                    global: config.lockdownMode
                }
            });

        } catch (error) {
            return res.status(500).json({ error: 'Erro na manutenção' });
        }
    },


    // 🕵️ IMPERSONATE
    async impersonateUser(req, res) {
        try {
            // Apenas admin pode impersonar (dev será habilitado futuramente)
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Apenas administradores podem impersonar usuários.' });
            }

            const { userId } = req.body;
            const user = await User.findById(userId);

            if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

            // Admin não pode impersonar admin ou dev — apenas student e monitor
            if (!['student', 'monitor'].includes(user.role)) {
                return res.status(403).json({ error: `Não é possível impersonar um usuário com role "${user.role}".` });
            }

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Log ANTES de enviar a resposta para garantir que é registrado mesmo se o cliente cair
            await Log.create({
                user: req.user._id,
                action: 'SECURITY_IMPERSONATE',
                details: `Acessou a conta de: ${user.nome} (${user.matricula})`,
                ip: req.ip
            });

            res.json({
                token,
                user: {
                    id: user._id,
                    nome: user.nome,
                    matricula: user.matricula,
                    role: user.role,
                    saldoPc: user.saldoPc,
                    turma: user.turma
                }
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro no impersonate' });
        }
    }

};
