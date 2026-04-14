const Professor = require('../models/Professor');
const ExamLock = require('../models/ExamLock');
const engagementController = require('./engagementController');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
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
    // 🔑 LOGIN DO PROFESSOR (Usuário e Senha)
    async login(req, res) {
        try {
            const { usuario, senha } = req.body;

            if (!usuario || !senha) {
                return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
            }

            // Busca o professor (usuário é camelcase/contínuo conforme discutido)
            const professor = await Professor.findOne({ 
                usuario: usuario.toLowerCase().trim() 
            }).select('+senha');

            if (!professor) {
                await logSystem(null, 'PROFESSOR_LOGIN_FAIL', `Usuário não encontrado: ${usuario}`, req);
                return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
            }

            if (!professor.ativo) {
                return res.status(403).json({ message: 'Acesso suspenso. Entre em contato com o administrador.' });
            }

            // Compara a senha ( Admin define no cadastro )
            const isMatch = await bcrypt.compare(senha, professor.senha);
            if (!isMatch) {
                await logSystem(professor._id, 'PROFESSOR_LOGIN_ERROR', `Senha incorreta para: ${usuario}`, req);
                return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
            }

            // Remove a senha do objeto de retorno
            professor.senha = undefined;

            const token = generateToken(professor._id, professor.role);

            await logSystem(professor._id, 'PROFESSOR_LOGIN_SUCCESS', `Professor ${professor.nome} logou.`, req);

            res.json({
                token,
                user: {
                    _id: professor._id,
                    nome: professor.nome,
                    usuario: professor.usuario,
                    role: professor.role,
                    disciplinas: professor.disciplinas,
                    isProfessor: true
                }
            });

            // 🔬 [PJC] Registrar presença ativa
            await engagementController.recordLogin();

        } catch (error) {
            console.error("Erro no login do professor:", error);
            res.status(500).json({ message: 'Erro interno no servidor.' });
        }
    },

    // 👤 OBTER MEUS DADOS (Sincronização de Dashboard)
    async getMe(req, res) {
        try {
            const professor = await Professor.findById(req.user.id);
            if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

            res.json({
                _id: professor._id,
                nome: professor.nome,
                usuario: professor.usuario,
                role: professor.role,
                disciplinas: professor.disciplinas,
                isProfessor: true
            });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar perfil.' });
        }
    },

    // 🔒 TOGGLE EXAM LOCK (Bloqueio de Turma)
    async toggleExamLock(req, res) {
        try {
            const { turmaId, disciplinaId, durationMinutes = 60 } = req.body;
            const professorId = req.user.id;

            // 🛡️ [C3] VALIDAÇÃO DE PROPRIEDADE: O professor possui essa turma?
            const professor = await Professor.findById(professorId);
            const possuiTurma = professor.disciplinas.some(d => d.turmas.includes(turmaId));

            if (!possuiTurma && professor.role !== 'dev' && professor.role !== 'admin') {
                await logSystem(professorId, 'SECURITY_VIOLATION', `Tentou travar turma não vinculada: ${turmaId}`, req);
                return res.status(403).json({ message: 'Acesso Negado: Esta turma não está vinculada ao seu perfil.' });
            }
            const existingLock = await ExamLock.findOne({ 
                turmaId, 
                status: 'ativo' 
            });

            if (existingLock) {
                // Se existe, nós o desativamos (Unlock)
                existingLock.status = 'concluido';
                await existingLock.save();

                await logSystem(professorId, 'EXAM_UNLOCK', `Desbloqueou a turma ${turmaId}`, req);
                return res.json({ message: `Turma ${turmaId} desbloqueada com sucesso!`, status: 'liberado' });
            }

            // 2. Se não existe, criamos um novo (Lock)
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

            const newLock = await ExamLock.create({
                turmaId,
                professorId,
                disciplinaId: disciplinaId || null,
                startTime,
                endTime,
                status: 'ativo',
                mensagem: 'AVALIAÇÃO EM ANDAMENTO: O acesso à plataforma está restrito para sua turma até o fim do horário da prova.'
            });

            await logSystem(professorId, 'EXAM_LOCK', `Bloqueou a turma ${turmaId} por ${durationMinutes}min`, req);
            
            res.json({ 
                message: `Turma ${turmaId} BLOQUEADA para avaliação!`, 
                lock: newLock,
                status: 'bloqueado'
            });

        } catch (error) {
            console.error("Erro no toggleExamLock:", error);
            res.status(500).json({ message: 'Erro ao processar trava de segurança.' });
        }
    },

    // 🎓 [B1] LISTAR ALUNOS CONTEXTUAIS (Privacidade & Eficiência)
    async getStudents(req, res) {
        try {
            const professor = await Professor.findById(req.user.id);
            if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

            // Coleta todas as turmas vinculadas ao professor
            const todasTurmas = [];
            professor.disciplinas.forEach(d => {
                d.turmas.forEach(t => {
                    if (!todasTurmas.includes(t)) todasTurmas.push(t);
                });
            });

            if (todasTurmas.length === 0) return res.json([]);

            // Busca apenas os alunos que pertencem a essas turmas
            const User = require('../models/User');
            const students = await User.find({
                turma: { $in: todasTurmas },
                role: 'student'
            }).select('nome matricula saldoPc turma xp inventory avatar isBlocked')
              .sort({ nome: 1 });

            res.json(students);
        } catch (error) {
            console.error("Erro ao buscar alunos contextuais:", error);
            res.status(500).json({ message: 'Erro ao buscar lista de alunos.' });
        }
    }
};
