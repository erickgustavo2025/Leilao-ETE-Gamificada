require('dotenv').config(); // GARANTE QUE A SENHA DO TOKEN SEJA LIDA
const SystemConfig = require('../models/SystemConfig');
const jwt = require('jsonwebtoken');

exports.checkMaintenance = async (req, res, next) => {
    try {
        // 1. Rotas que NUNCA bloqueiam
        const bypassRoutes = [
            '/api/auth/login',
            '/api/status',
            '/api/dev/maintenance',
            '/api/public/config',
            '/api/dev' // Libera rotas do painel God Mode
        ];

        if (bypassRoutes.some(route => req.originalUrl.includes(route))) {
            return next();
        }

        // 2. Busca configuração
        const config = await SystemConfig.findOne();
        
        // Se não tiver config ou tudo desligado, passa
        if (!config || (!config.maintenanceMode && !config.lockdownMode)) {
            return next();
        }

        // 3. Tenta validar o VIP Pass (Admin/Dev)
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Se o token for válido e for Admin ou Dev
                if (decoded.role === 'admin' || decoded.role === 'dev') {
                    // LOCKDOWN: Se for Lockdown Global, SÓ DEV passa (Admin é barrado)
                    if (config.lockdownMode && decoded.role !== 'dev') {
                        console.log(`[BLOCK] Lockdown ativo. Admin ${decoded.id} barrado.`);
                        return res.status(503).json({ message: '⛔ LOCKDOWN GLOBAL. Acesso restrito a DEVs.' });
                    }
                    
                    return next(); // Liberado!
                }
            } catch (error) {
                console.log('[MAINTENANCE] Token inválido ou erro de verificação:', error.message);
                // Não retorna erro aqui, deixa cair no bloqueio abaixo
            }
        } else {
            console.log('[MAINTENANCE] Tentativa de acesso sem token durante bloqueio.');
        }

        // 4. Bloqueio Final (Se chegou aqui, não é VIP)
        return res.status(503).json({ 
            message: '🚧 SISTEMA EM MANUTENÇÃO. Volte em breve.',
            maintenance: true 
        });

    } catch (error) {
        console.error('Erro crítico no middleware:', error);
        next();
    }
};