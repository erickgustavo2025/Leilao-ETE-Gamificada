const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Busca em Admin primeiro (incluindo Devs)
            let user = await Admin.findById(decoded.id).select('-senha');
            if (!user) {
                user = await User.findById(decoded.id).select('-senha');
            }

            req.user = user;
            if (!req.user) return res.status(401).json({ message: 'Usuário não encontrado' });
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