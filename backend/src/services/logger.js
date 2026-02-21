const Log = require('../models/Log');

exports.logAction = async (req, action, details) => {
    try {
        // Se não tiver req.user (ex: erro de login), tenta pegar do body ou null
        const userId = req.user ? req.user._id : null; 
        
        // Padroniza a ação para MAIÚSCULO (ex: 'buy_item' -> 'BUY_ITEM')
        const standardizedAction = action.toUpperCase();

        await Log.create({
            user: userId,
            action: standardizedAction,
            details: details,
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'System'
        });

        // Opcional: Console log colorido no terminal do VSCode pra você ver rodando
        console.log(`[LOG] ${standardizedAction}: ${details}`);

    } catch (error) {
        console.error("Erro crítico ao salvar log:", error.message);
    }
};