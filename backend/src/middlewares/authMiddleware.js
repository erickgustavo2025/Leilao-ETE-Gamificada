const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Professor = require('../models/Professor');
const ExamLock = require('../models/ExamLock');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Busca em Admin, Professor ou Aluno
            let user = await Admin.findById(decoded.id).select('-senha');
            if (!user) {
                user = await Professor.findById(decoded.id).select('-senha');
            }
            if (!user) {
                user = await User.findById(decoded.id).select('-senha');
            }

            if (!user) return res.status(401).json({ message: 'Usuário não encontrado' });

            // 🚫 VERIFICAÇÃO DE EXAM LOCK (Apenas para Alunos)
            if (user.role === 'student') {
                const now = new Date();
                const lock = await ExamLock.findOne({
                    turmaId: user.turma,
                    status: 'ativo',
                    startTime: { $lte: now },
                    endTime: { $gte: now }
                });

                if (lock) {
                    return res.status(403).json({
                        error: 'EXAM_LOCK',
                        message: lock.mensagem,
                        endTime: lock.endTime
                    });
                }
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido' });
        }
    } else {
        res.status(401).json({ message: 'Sem token de autorização' });
    }
};

// Permite Admin OU Dev
exports.admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'dev')) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso restrito a administradores' });
    }
};

// Permite APENAS Dev
exports.devOnly = (req, res, next) => {
    if (req.user && req.user.role === 'dev') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso restrito a desenvolvedores' });
    }
};

exports.monitor = (req, res, next) => {
    if (req.user && ['admin', 'dev', 'monitor'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso restrito a Monitores e Staff.' });
    }
};

exports.professor = (req, res, next) => {
    if (req.user && (req.user.role === 'professor' || req.user.role === 'admin' || req.user.role === 'dev')) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso restrito a Professores e Staff.' });
    }
};