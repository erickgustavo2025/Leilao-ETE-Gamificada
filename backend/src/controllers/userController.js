const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SystemConfig = require('../models/SystemConfig');
const Log = require('../models/Log');
const skillService = require('../services/skillService');
const Classroom = require('../models/Classroom');
const SKILLS_CATALOG = require('../config/skills');
const bcrypt = require('bcryptjs');

// --- FUNÇÃO AUXILIAR: CRIA A REGEX CAMALEÃO 🦎 ---
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

// Mapeamento de Cargos Especiais (Emojis)
const SPECIAL_ROLES = {
    'monitor_disciplina': '🤓',
    'monitor_escola': '🏫',
    'armada_dumbledore': '🧙',
    'monitor_biblioteca': '📚',
    'monitor_quadra': '⚽',
    'banda': '🎼',
    'representante': '🫡',
    'colaborador': '🎮',
    'estudante_honorario': '😎'
};

const BUFF_PC_CAP = 500;

// ============================================================
// ✅ HELPER — Calcula multiplicador de um aluno
// Ordem: TRIPLICADOR > DUPLICADOR > BASE (1x)
// Bênção de Merlin: +0.5 sobre qualquer multiplicador
// ============================================================
const getMultiplier = (user) => {
    const now = new Date();

    // Limpa buffs expirados antes de calcular (defesa em profundidade)
    const activeBuffs = (user.activeBuffs || []).filter(b =>
        !b.expiresAt || new Date(b.expiresAt) > now
    );

    const hasTriple = activeBuffs.some(b => b.effect === 'TRIPLICADOR');
    const hasDouble = !hasTriple && activeBuffs.some(b => b.effect === 'DUPLICADOR');

    let multiplier = 1;
    if (hasTriple) multiplier = 3;
    else if (hasDouble) multiplier = 2;

    // A Bênção de Merlin soma +0.5 sobre qualquer multiplicador ativo
    const hasMerlin = user.cargos && user.cargos.includes('bencao_de_merlin');
    if (hasMerlin) multiplier += 0.5;

    return multiplier;
};


module.exports = {
    // 1. LISTAR TURMAS
    async getClasses(req, res) {
        try {
            const classes = await User.distinct('turma');
            const cleanClasses = classes.filter(c => c).sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true })
            );
            res.json(cleanClasses);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar turmas' });
        }
    },

    // 2. BUSCAR ALUNOS POR TURMA
    async getStudentsByClass(req, res) {
        try {
            const { turma } = req.query;
            let query = { role: { $in: ['student', 'monitor'] } };

            if (turma) {
                query.turma = { $regex: createFlexibleRegex(turma) };
            }

            const students = await User.find(query)
                .select('nome matricula saldoPc turma inventory maxPcAchieved cargos role isBlocked avatar')
                .sort({ nome: 1 });

            res.json(students);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar alunos' });
        }
    },

    async getMyInventory(req, res) {
        try {
            const user = await User.findById(req.user.id)
                .populate('inventory.itemId');

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }

            // B. Processa o inventário PESSOAL
            const inventoryProcessed = user.inventory.map(slot => {
                let itemData = slot.toObject();

                // CASO 1: É Item de Loja
                if (slot.itemId && slot.itemId._id) {
                    return {
                        ...itemData,
                        name: slot.itemId.nome,
                        description: slot.itemId.descricao,
                        image: slot.itemId.imagem,
                        rarity: slot.itemId.raridade || 'COMUM',
                        preco: slot.itemId.preco,
                        basePrice: slot.itemId.preco,
                        isHouseItem: slot.itemId.isHouseItem || false,
                        category: slot.itemId.category || slot.category || 'CONSUMIVEL',
                        isSkill: slot.itemId.isSkill || false,
                        buffEffect: slot.itemId.buffEffect || null,
                        canSell: true,
                        origin: 'STORE'
                    };
                }

                // CASO 2: É Skill/Config
                if (slot.skillCode && SKILLS_CATALOG[slot.skillCode]) {
                    const config = SKILLS_CATALOG[slot.skillCode];
                    return {
                        ...itemData,
                        name: config.name,
                        description: config.desc,
                        image: config.image || '/assets/default_skill.png',
                        rarity: slot.rarity || 'COMUM',
                        preco: 0,
                        basePrice: 0,
                        isHouseItem: false,
                        category: 'RANK_SKILL',
                        isSkill: true,
                        buffEffect: null,
                        canSell: false,
                        origin: 'SKILL'
                    };
                }

                // CASO 3: Fallback
                return { ...itemData, canSell: false, preco: 0, basePrice: 0, isHouseItem: false, buffEffect: null };
            });

            // C. Busca itens na SALA DE AULA
            let classroomItems = [];
            if (user.turma) {
                const classroom = await Classroom.findOne({ serie: user.turma })
                    .populate('roomInventory.itemId');

                if (classroom && classroom.roomInventory) {
                    const myRoomItems = classroom.roomInventory.filter(item =>
                        item.acquiredBy && item.acquiredBy.toString() === req.user.id
                    );

                    classroomItems = myRoomItems.map(slot => {
                        const baseItem = slot.itemId || {};
                        return {
                            _id: slot._id,
                            itemId: baseItem._id,
                            name: baseItem.nome || slot.name || 'Item da Sala',
                            image: baseItem.imagem || slot.image || '/assets/house_item.png',
                            description: baseItem.descricao || slot.description,
                            rarity: baseItem.raridade || 'COMUM',
                            preco: baseItem.preco || 0,
                            basePrice: baseItem.preco || 0,
                            isHouseItem: true,
                            category: baseItem.category || 'CONSUMIVEL',
                            isSkill: false,
                            buffEffect: baseItem.buffEffect || null,
                            origin: 'HOUSE_CUP',
                            canSell: true
                        };
                    });
                }
            }

            const finalInventory = [...inventoryProcessed, ...classroomItems];
            res.json(finalInventory);

        } catch (error) {
            console.error("Erro crítico no getMyInventory:", error);
            res.status(500).json({ error: 'Erro ao carregar mochila.' });
        }
    },

    // 4. PAINEL DO MONITOR
    async getMonitorClass(req, res) {
        try {
            const monitor = await User.findById(req.user._id);
            if (!monitor || !['monitor', 'admin', 'dev'].includes(monitor.role)) {
                return res.status(403).json({ error: 'Acesso restrito.' });
            }
            const turmaRegex = createFlexibleRegex(monitor.turma);
            const students = await User.find({
                turma: { $regex: turmaRegex },
                _id: { $ne: monitor._id }
            })
                .select('nome matricula saldoPc turma isBlocked avatar')
                .sort({ nome: 1 });

            res.json({ turma: monitor.turma, students });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar turma do monitor' });
        }
    },

    async bulkUpdatePoints(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { studentIds, amount, action, description } = req.body;
            const baseValue = Number(amount);
            const author = req.user;

            // ── Validações básicas de entrada ──
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ error: 'Nenhum aluno selecionado.' });
            }
            if (!baseValue || baseValue <= 0) {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ error: 'Valor inválido.' });
            }
            if (!['add', 'remove'].includes(action)) {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ error: 'Ação inválida.' });
            }

            const users = await User.find({ _id: { $in: studentIds } }).session(session);

            if (action === 'add') {
                // --- MODO ADIÇÃO (COM BÔNUS E SKILLS) ---
                for (const user of users) {
                    const multiplier = getMultiplier(user);
                    const rawValue = Math.floor(baseValue * multiplier);

                    // 🔒 Aplica o teto de BUFF_PC_CAP apenas quando há buff ativo
                    const capped = multiplier > 1 && rawValue > BUFF_PC_CAP;
                    const finalValue = capped ? BUFF_PC_CAP : rawValue;

                    // Monta a tag de bônus pro log
                    let bonusTag = '';
                    if (multiplier > 1) {
                        bonusTag = capped
                            ? ` [Bônus ${multiplier}x 🔥 → Cap: ${BUFF_PC_CAP} PC$]`
                            : ` [Bônus ${multiplier}x 🔥]`;
                    }

                    user.saldoPc += finalValue;

                    // ✅ FIX: Atualiza rank histórico e sincroniza skills com markModified
                    if (user.saldoPc > (user.maxPcAchieved || 0)) {
                        user.maxPcAchieved = user.saldoPc;
                        if (skillService && skillService.syncRankSkills) {
                            const hasNewSkills = await skillService.syncRankSkills(user);
                            if (hasNewSkills) {
                                user.markModified('inventory');
                                user.markModified('activeBuffs');
                            }
                        }
                    }

                    await user.save({ session });

                    if (Log) {
                        await Log.create([{
                            user: author._id,
                            target: user._id,
                            action: 'MANUAL_POINT_UPDATE',
                            details: `Adicionou ${finalValue} PC$${bonusTag}. (Base: ${baseValue}). Motivo: ${description || 'N/A'}`,
                            ip: req.ip
                        }], { session });
                    }
                }

            } else {
                // --- MODO REMOÇÃO (MULTA — sem multiplicador, sem cap) ---
                await User.updateMany(
                    { _id: { $in: studentIds } },
                    { $inc: { saldoPc: -baseValue } },
                    { session }
                );

                if (Log) {
                    const target = studentIds.length === 1 ? studentIds[0] : null;
                    await Log.create([{
                        user: author._id,
                        target: target,
                        action: 'MANUAL_POINT_UPDATE',
                        details: `Removeu ${baseValue} PC$. Motivo: ${description || 'N/A'} [${studentIds.length} alunos]`,
                        ip: req.ip
                    }], { session });
                }
            }

            await session.commitTransaction();
            session.endSession();

            res.json({ message: 'Pontos atualizados com sucesso!' });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Erro bulkUpdatePoints:', error);
            res.status(500).json({ error: 'Erro ao atualizar pontos' });
        }
    },

    // 6. LISTAR TODOS (Admin)
    async index(req, res) {
        try {
            const users = await User.find().select('-senha').sort({ nome: 1 });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar' });
        }
    },

    // 7. PROMOVER MONITOR
    async toggleMonitor(req, res) {
        try {
            const { userId } = req.body;
            const user = await User.findById(userId);

            if (!user) return res.status(404).json({ error: 'Aluno não encontrado' });

            const newRole = user.role === 'student' ? 'monitor' : 'student';
            user.role = newRole;

            if (newRole === 'monitor') {
                if (!user.cargos.includes('colaborador')) user.cargos.push('colaborador');
            } else {
                user.cargos = user.cargos.filter(c => c !== 'colaborador');
            }

            await user.save();

            if (Log) {
                await Log.create({
                    user: req.user._id,
                    target: user._id,
                    action: newRole === 'monitor' ? 'PROMOTE' : 'DEMOTE',
                    details: `Cargo alterado para ${newRole}`,
                    ip: req.ip
                });
            }
            res.json({ message: `Cargo alterado para ${newRole}`, user });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao promover' });
        }
    },

    // 8. BLOQUEAR/DESBLOQUEAR
    async toggleBlock(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const id = req.body.studentId || req.body.userId;
            const { reason } = req.body;

            if (!id) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: 'ID não fornecido.' });
            }

            const user = await User.findById(id).session(session);
            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }

            if (['admin', 'dev'].includes(user.role)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ error: 'Não é possível bloquear administradores.' });
            }

            user.isBlocked = !user.isBlocked;
            await user.save({ session });

            if (Log) {
                await Log.create([{
                    user: req.user._id,
                    target: user._id,
                    action: user.isBlocked ? 'BLOCK' : 'UNBLOCK',
                    details: reason || `Admin alterou status para: ${user.isBlocked ? 'BLOQUEADO' : 'ATIVO'}`,
                    ip: req.ip
                }], { session });
            }

            await session.commitTransaction();
            session.endSession();

            return res.json({
                message: `Usuário ${user.isBlocked ? 'BLOQUEADO' : 'DESBLOQUEADO'} com sucesso.`,
                isBlocked: user.isBlocked
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Erro no toggleBlock:", error);
            return res.status(500).json({ error: 'Erro ao alterar status.' });
        }
    },

    // 9. ATUALIZAR PERFIL
    async updateStudentProfile(req, res) {
        try {
            const { nome, turma } = req.body;
            const id = req.body.userId || req.body.id || req.params.id;

            if (!id) return res.status(400).json({ error: 'ID do usuário não fornecido.' });

            // 🛡️ PROTEÇÃO DE HIERARQUIA: Não permite alterar Admin/Dev por aqui
            const targetUser = await User.findById(id);
            if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });
            
            if (['admin', 'dev'].includes(targetUser.role) && req.user.role !== 'dev') {
                return res.status(403).json({ error: 'Acesso Negado: Não é possível alterar perfis da Staff por esta rota.' });
            }

            // Sanitização e Destinação Estrita
            const updateData = {};
            if (nome) updateData.nome = nome.trim().toUpperCase();
            if (turma) updateData.turma = turma.trim().toUpperCase();

            const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

            if (Log) {
                await Log.create({
                    user: req.user._id,
                    target: user._id,
                    action: 'UPDATE_PROFILE',
                    details: `Perfil editado: ${user.nome} - ${user.turma}`,
                    ip: req.ip
                });
            }
            res.json({ message: 'Perfil atualizado com segurança', user });
        } catch (error) {
            console.error('Erro no updateStudentProfile:', error);
            res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    },

    // 10. ADMIN LOGS
    async getAdminLogs(req, res) {
        try {
            const importantActions = [
                'BLOCK', 'UNBLOCK', 'PROMOTE', 'DEMOTE', 'UPDATE_PROFILE', 'SECURITY_IMPERSONATE',
                'MANUAL_POINT_UPDATE', 'BID_PLACED', 'AUCTION_WIN', 'COMPRA_LOJA',
                'TICKET_CREATED', 'TICKET_CANCELLED', 'TICKET_VALIDATED', 'ROLE_UPDATE',
                'BUFF_ACTIVATED'
            ];

            const logs = await Log.find({ action: { $in: importantActions } })
                .populate('user', 'nome role turma')
                .populate('target', 'nome turma')
                .sort({ createdAt: -1 })
                .limit(100);

            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar logs' });
        }
    },

    // 11. ATUALIZAR AVATAR
    async updateAvatar(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
            }

            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            const avatarPath = `/uploads/${req.file.filename}`;
            user.avatar = avatarPath;
            await user.save();

            if (Log) {
                await Log.create({
                    user: req.user._id,
                    action: 'AVATAR_UPDATED',
                    details: `Avatar atualizado: ${avatarPath}`,
                    ip: req.ip
                });
            }

            res.json({ message: 'Avatar atualizado!', avatar: avatarPath });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar avatar.' });
        }
    },

    // 12. UPDATE SPECIAL ROLES (Sincronização Bulk + Lógica de Monitor)
    async toggleSpecialRole(req, res) {
        try {
            const userId = req.params.id;
            const { cargosEspeciais } = req.body; // Pega a lista enviada pelo Modal

            if (!userId || !Array.isArray(cargosEspeciais)) {
                return res.status(400).json({ error: 'Dados inválidos ou lista de cargos ausente.' });
            }

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Aluno não encontrado.' });

            // 🚀 LÓGICA DO COLABORADOR -> MONITOR
            // Se 'colaborador' está na nova lista, ele vira monitor. Se não, volta a ser student.
            if (cargosEspeciais.includes('colaborador')) {
                user.role = 'monitor';
            } else if (user.role === 'monitor') {
                // Se ele era monitor mas tiraram o cargo de colaborador, ele volta a ser aluno normal
                user.role = 'student';
            }

            // Sobrescreve a lista de cargos com a nova seleção do Admin
            user.cargos = cargosEspeciais;

            await user.save();

            if (Log) {
                await Log.create({
                    user: req.user._id,
                    target: user._id,
                    action: 'ROLE_UPDATE',
                    details: `Sincronizou cargos: [${cargosEspeciais.join(', ')}]. Role definido como: ${user.role}`,
                    ip: req.ip
                });
            }

            res.json({ message: 'Cargos e permissões atualizados!', cargos: user.cargos, role: user.role });

        } catch (error) {
            console.error("Erro ao sincronizar cargos:", error);
            res.status(500).json({ error: 'Erro interno ao atualizar cargos.' });
        }
    },

    async getUserInventoryPublic(req, res) {
        try {
            const { userId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'ID de usuário inválido' });
            }

            const user = await User.findById(userId).populate('inventory.itemId');

            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

            // 🛡️ [IDOR/Privacy] Filtra estritamente o que é público
            const publicInventory = user.inventory.map(slot => {
                const originalItem = slot.itemId;
                // Ignora itens de sistema e consome apenas dados visuais
                return {
                    name: originalItem?.nome || slot.name,
                    imagem: originalItem?.imagem || slot.imagem,
                    raridade: originalItem?.raridade || slot.raridade,
                    isSkill: originalItem?.isSkill || slot.isSkill || slot.category === 'RANK_SKILL' || false,
                    category: originalItem?.category || slot.category
                };
            }).filter(i => 
                i.category !== 'TICKET' && 
                i.category !== 'RANK_SKILL' // Rank skills são privadas ao perfil
            );

            res.json(publicInventory || []);
        } catch (error) {
            console.error("Erro no getUserInventoryPublic:", error);
            res.status(500).json({ error: 'Erro ao buscar inventário público.' });
        }
    },

    async redeemVipCode(req, res) {
        try {
            const { code } = req.body;
            const userId = req.user._id;

            const config = await SystemConfig.findOne({ key: 'general' }) || { vipCode: 'VIP-ETE-2026' };
            const officialCode = config.vipCode || 'VIP-ETE-2026';

            if (code !== officialCode) {
                return res.status(400).json({ error: 'Código inválido ou expirado.' });
            }

            const user = await User.findById(userId);
            if (user.isVip) {
                return res.status(400).json({ error: 'Você já possui status VIP!' });
            }

            user.isVip = true;
            await user.save();

            await Log.create({
                user: userId,
                action: 'VIP_REDEEM',
                details: `Ativou VIP com código: ${code}`,
                ip: req.ip
            });

            return res.json({ success: true, message: 'Status VIP ativado com sucesso! Bem-vindo à elite.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao validar código.' });
        }
    },

    async findByMatricula(req, res) {
        try {
            const { matricula } = req.params;
            const user = await User.findOne({ matricula }).select('nome matricula turma avatar');
            if (!user) return res.status(404).json({ error: 'Não encontrado' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar' });
        }
    },

    async getMonitorLogs(req, res) {
        try {
            const logs = await Log.find({
                user: req.user._id,
                action: 'MANUAL_POINT_UPDATE'
            })
                .populate('target', 'nome matricula turma')
                .sort({ createdAt: -1 })
                .limit(50);

            res.json(logs);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar histórico.' });
        }
    },

    async createManualUser(req, res) {
        try {
            const { nome, matricula, dataNascimento, turma, role } = req.body;

            const userExists = await User.findOne({ matricula });
            if (userExists) {
                return res.status(400).json({ message: 'Matrícula já cadastrada!' });
            }

            const rawPassword = dataNascimento.replace(/\D/g, '');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            const newUser = await User.create({
                nome: nome.toUpperCase(),
                matricula,
                dataNascimento,
                turma,
                role: role || 'student',
                senha: hashedPassword,
                isFirstAccess: true,
                saldoPc: 0,
                xp: 0,
                financialLimits: { receivedThisYear: 0, lastResetYear: 2026 },
                inventory: [],
                activeBuffs: [],
                cargos: []
            });

            if (skillService) {
                await skillService.syncRankSkills(newUser);
                await newUser.save();
            }

            // ✅ SEGURANÇA: Remove campos sensíveis antes de retornar
            const userResponse = newUser.toObject();
            delete userResponse.senha;
            delete userResponse.dataNascimento;

            res.status(201).json({
                message: 'Usuário criado com sucesso!',
                user: userResponse,
                initialPassword: rawPassword // Retorna apenas uma vez para o Admin anotar
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao criar usuário' });
        }
    },
    async acceptPrivacy(req, res) {
        try {
            // Detecta se o usuário é Admin/Dev ou Aluno
            const isStaff = ['admin', 'dev'].includes(req.user.role);
            const Model = isStaff ? Admin : User;

            const user = await Model.findById(req.user.id);
            if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

            user.privacyAccepted = true;
            user.privacyAcceptedAt = new Date();
            user.privacyVersion = '1.0';
            
            await user.save();

            res.json({ 
                success: true, 
                message: `Política de Privacidade aceita com sucesso para ${isStaff ? 'Staff' : 'Aluno'}!`,
                privacyAccepted: true 
            });
        } catch (error) {
            console.error("Erro ao aceitar privacidade:", error);
            res.status(500).json({ error: "Erro interno ao registrar aceite." });
        }
    },

};
