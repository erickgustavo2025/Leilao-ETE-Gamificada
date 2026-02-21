
const User = require('../models/User');
const Admin = require('../models/Admin');
const SystemConfig = require('../models/SystemConfig');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendMail = require('../config/mail');
const { RANKS } = require('../config/gameRules');
const skillService = require('../services/skillService');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

async function logSystem(userId, action, details, req) {
    try {
        await Log.create({
            user: userId || null,
            action: action.toUpperCase(),
            details: details,
            ip: req.ip || req.connection.remoteAddress
        });
    } catch (err) {
        console.error('Falha ao salvar log:', err);
    }
}

module.exports = {

    // 🔍 1. VERIFICAR PRIMEIRO ACESSO
    async checkFirstAccess(req, res) {
        try {
            const { matricula, dataNascimento } = req.body;
            const user = await User.findOne({ matricula });

            if (!user) return res.status(404).json({ message: 'Matrícula não encontrada.' });
            if (!user.isFirstAccess) return res.status(400).json({ message: 'Conta já ativada. Faça login.' });
            if (user.dataNascimento.trim() !== dataNascimento.trim()) return res.status(400).json({ message: 'Data de nascimento incorreta.' });

            res.status(200).json({ message: 'Dados validados.', id: user._id });
        } catch (error) {
            res.status(500).json({ message: 'Erro no servidor' });
        }
    },

    // 📝 2. FINALIZAR CADASTRO
    async register(req, res) {
        try {
            const { id, email, senha, nickname } = req.body;

            const user = await User.findById(id);

            if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
            if (!user.isFirstAccess) return res.status(400).json({ message: 'Conta já registrada.' });
            if (await User.findOne({ email })) return res.status(400).json({ message: 'Email já está em uso.' });

            user.email = email;
            user.senha = senha; // Deixe a senha pura aqui! O user.save() vai transformar em Hash sozinho.
            user.isFirstAccess = false;
            if (nickname) user.nickname = nickname;
            await user.save();

            try {
                await logSystem(user._id, 'REGISTER_SUCCESS', `Ativou a conta (${user.matricula})`, req);
            } catch (logErr) {
                console.log("Erro ao gerar log, mas seguindo o baile...");
            }

            const token = generateToken(user._id, user.role);

            const safeUser = user.toObject();
            safeUser.senha = undefined;
            safeUser.inventory = safeUser.inventory || [];
            safeUser.activeBuffs = safeUser.activeBuffs || [];

            res.status(201).json({ token, user: safeUser });

        } catch (error) {
            console.error("Erro no Register:", error);
            res.status(500).json({ message: 'Erro ao registrar', error: error.message });
        }
    },

    // 🔑 3. LOGIN UNIFICADO
    async login(req, res) {
        try {
            const { matricula, senha } = req.body;

            const config = await SystemConfig.findOne();
            const maintenance = config ? config.maintenanceMode : false;
            const lockdown = config ? config.lockdownMode : false;

            // --- TENTATIVA 1: É UM ADMIN/DEV? ---
            const admin = await Admin.findOne({ matricula }).select('+senha');

            if (admin) {
                if (lockdown && admin.role !== 'dev') {
                    await logSystem(admin._id, 'LOGIN_BLOCKED', `Admin ${admin.nome} barrado pelo Lockdown`, req);
                    return res.status(503).json({ message: '⛔ SISTEMA EM LOCKDOWN GLOBAL. Acesso restrito a DEVs.' });
                }

                if (!await bcrypt.compare(senha, admin.senha)) {
                    await logSystem(admin._id, 'LOGIN_ERROR', `Senha incorreta Admin: ${matricula}`, req);
                    return res.status(401).json({ message: 'Senha incorreta.' });
                }

                admin.senha = undefined;
                const token = generateToken(admin._id, admin.role);

                await logSystem(admin._id, 'ADMIN_LOGIN', `Acesso ao painel ${admin.role}`, req);

                return res.json({
                    token,
                    user: {
                        _id: admin._id,
                        id: admin._id,
                        nome: admin.nome,
                        email: admin.email,
                        matricula: admin.matricula,
                        role: admin.role,
                        cargos: [admin.role],
                        saldoPc: 999999,
                        inventory: [],
                        activeBuffs: []
                    }
                });
            }

            // --- TENTATIVA 2: É UM ALUNO? ---
            const user = await User.findOne({ matricula }).select('+senha');

            if (!user) {
                await logSystem(null, 'LOGIN_FAIL', `Usuário não encontrado: ${matricula}`, req);
                return res.status(404).json({ message: 'Matrícula não encontrada.' });
            }

            if (user.isBlocked) {
                return res.status(403).json({ message: 'CONTA SUSPENSA. Procure a coordenação.' });
            }

            if (maintenance || lockdown) {
                await logSystem(user._id, 'LOGIN_BLOCKED', `Tentativa de login bloqueada por manutenção`, req);
                return res.status(503).json({ message: '🚧 O SISTEMA ESTÁ EM MANUTENÇÃO. TENTE MAIS TARDE.' });
            }

            if (!user.senha || user.isFirstAccess) {
                return res.status(400).json({ message: 'Conta não ativada. Vá em Primeiro Acesso.' });
            }

            if (!await bcrypt.compare(senha, user.senha)) {
                await logSystem(user._id, 'LOGIN_ERROR', `Senha incorreta Aluno: ${matricula}`, req);
                return res.status(401).json({ message: 'Senha incorreta.' });
            }

            user.senha = undefined;
            const token = generateToken(user._id, user.role);

            await logSystem(user._id, 'LOGIN_SUCCESS', `Aluno ${user.nome} logou.`, req);

            const safeUser = user.toObject();
            safeUser.inventory = safeUser.inventory || [];
            safeUser.activeBuffs = safeUser.activeBuffs || [];

            res.json({ token, user: safeUser });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro interno no login' });
        }
    },

    // 📧 4. RECUPERAÇÃO DE SENHA
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            let user = await User.findOne({ email });
            let collection = User;

            if (!user) {
                user = await Admin.findOne({ email });
                collection = Admin;
            }

            if (!user) return res.status(404).json({ message: 'Email não encontrado.' });

            const token = crypto.randomBytes(20).toString('hex');
            const now = new Date();
            now.setHours(now.getHours() + 1);

            await collection.findByIdAndUpdate(user._id, {
                '$set': { resetPasswordToken: token, resetPasswordExpires: now }
            });

            sendMail.sendPasswordReset(email, token);
            await logSystem(user._id, 'FORGOT_PASSWORD', 'Solicitou reset de senha', req);

            res.status(200).json({ message: 'Email enviado!' });
        } catch (error) {
            console.error("Erro no forgotPassword:", error);
            res.status(500).json({ message: 'Erro ao processar solicitação.' });
        }
    },

    // 5. RESET PASSWORD
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            let user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                user = await Admin.findOne({
                    resetPasswordToken: token,
                    resetPasswordExpires: { $gt: Date.now() }
                });
            }

            if (!user) return res.status(400).json({ message: 'Token inválido ou expirado.' });

            if (user.role === 'admin' || user.role === 'dev') {
                const salt = await bcrypt.genSalt(10);
                user.senha = await bcrypt.hash(newPassword, salt);
            } else {
                user.senha = newPassword;
            }

            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            await logSystem(user._id, 'PASSWORD_RESET', 'Senha redefinida com sucesso', req);
            res.status(200).json({ message: 'Senha alterada! Faça login.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao resetar senha.' });
        }
    },

    // ════════════════════════════════════════════════════════════════════
    // 👤 6. OBTER DADOS (Me) - CORRIGIDO
    // ════════════════════════════════════════════════════════════════════
    async getMe(req, res) {
        try {
            // 1. Busca usuário com populate na Loja
            const user = await User.findById(req.user.id).populate({
                path: 'inventory.itemId',
                model: 'StoreItem',
                select: 'nome name imagem image raridade rarity descricao description'
            });

            if (!user) {
                // ══════════════════════════════════════════════════════
                // NÃO É ALUNO — Busca como Admin/Dev
                // Retorna objeto COMPLETO e CONSISTENTE com o login
                // ══════════════════════════════════════════════════════
                const admin = await Admin.findById(req.user.id);
                if (admin) {
                    return res.json({
                        _id: admin._id,
                        id: admin._id,
                        nome: admin.nome,
                        email: admin.email,
                        matricula: admin.matricula,
                        role: admin.role,
                        cargos: [admin.role],
                        saldoPc: 999999,
                        isVip: true,
                        inventory: [],
                        activeBuffs: [],
                    });
                }
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            // 2. SINCRONIZA SKILLS DE RANK
            if (skillService) {
                const hasUpdates = await skillService.syncRankSkills(user);
                if (hasUpdates) await user.save();
            }

            // 3. Conversão para Objeto e Hidratação dos Itens
            const safeUser = user.toObject();

            safeUser.inventory = (safeUser.inventory || []).map(slot => {
                if (slot.itemId && typeof slot.itemId === 'object') {
                    slot.name = slot.itemId.nome || slot.itemId.name || slot.name;
                    slot.image = slot.itemId.imagem || slot.itemId.image || slot.image;
                    slot.rarity = slot.itemId.raridade || slot.itemId.rarity || slot.rarity;
                    slot.descricao = slot.itemId.descricao || slot.itemId.description || slot.descricao;
                }

                if (!slot.image && slot.imagem) slot.image = slot.imagem;
                if (!slot.rarity && slot.raridade) slot.rarity = slot.raridade;
                if (!slot.description && slot.descricao) slot.description = slot.descricao;

                return {
                    ...slot,
                    image: slot.image,
                    rarity: slot.rarity,
                    name: slot.name
                };
            });

            safeUser.activeBuffs = safeUser.activeBuffs || [];

            delete safeUser.senha;
            delete safeUser.password;

            res.json(safeUser);

        } catch (error) {
            console.error("Erro no getMe:", error);
            res.status(500).json({ message: 'Erro ao buscar perfil' });
        }
    },

    // 7. REGRAS DO SISTEMA
    async getSystemRules(req, res) {
        return res.json({
            ranks: RANKS
        });
    },

    // 🔒 8. ALTERAR SENHA (LOGADO)
    async changePassword(req, res) {
        try {
            const { senhaAtual, novaSenha } = req.body;
            const user = await User.findById(req.user.id).select('+senha');

            if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

            if (!await bcrypt.compare(senhaAtual, user.senha)) {
                await logSystem(user._id, 'PASSWORD_CHANGE_FAIL', 'Tentou alterar senha com senha atual incorreta', req);
                return res.status(401).json({ message: 'Senha atual incorreta.' });
            }
            user.senha = novaSenha;
            await user.save();

            await logSystem(user._id, 'PASSWORD_CHANGED', 'Alterou a própria senha via painel', req);
            res.json({ message: 'Senha alterada com sucesso!' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao alterar senha.' });
        }
    },

    // 📧 9. ALTERAR EMAIL (LOGADO)
    async changeEmail(req, res) {
        try {
            const { senha, novoEmail } = req.body;
            const user = await User.findById(req.user.id).select('+senha');

            if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

            if (!await bcrypt.compare(senha, user.senha)) {
                return res.status(401).json({ message: 'Senha incorreta.' });
            }

            const emailExists = await User.findOne({ email: novoEmail });
            if (emailExists) {
                return res.status(409).json({ message: 'Este email já está em uso.' });
            }

            const oldEmail = user.email;
            user.email = novoEmail;
            await user.save();

            await logSystem(user._id, 'EMAIL_CHANGED', `Alterou email de ${oldEmail} para ${novoEmail}`, req);
            res.json({ message: 'Email atualizado com sucesso!', user });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao alterar email.' });
        }
    }
};