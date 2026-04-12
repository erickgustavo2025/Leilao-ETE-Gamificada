/**
 * MIDDLEWARE: nosqlSanitizer.js
 * 
 * 🛡️ BLINDAGEM CONTRA NOSQL INJECTION (AGRESSIVA)
 * 
 * Este middleware intercepta todas as requisições (body, query, params) e 
 * bloqueia agressivamente qualquer chave que comece com '$' ou contenha '.'.
 * É compatível com Express 5 e substitui o 'express-mongo-sanitize'.
 */

const hasNoSqlKey = (obj) => {
    if (!obj || typeof obj !== 'object') return false;

    for (const key in obj) {
        // Detecta injeção no nome da chave
        if (key.startsWith('$') || key.includes('.')) {
            return true;
        }

        // Recursividade para objetos aninhados
        if (typeof obj[key] === 'object' && hasNoSqlKey(obj[key])) {
            return true;
        }
    }
    return false;
};

const nosqlSanitizer = (req, res, next) => {
    const hasViolation = 
        hasNoSqlKey(req.body) || 
        hasNoSqlKey(req.query) || 
        hasNoSqlKey(req.params);

    if (hasViolation) {
        console.warn(`🚨 [SECURITY] Tentativa de NoSQL Injection bloqueada vinda do IP: ${req.ip}`);
        console.warn(`🔍 Payload suspeito detectado em: ${req.originalUrl}`);
        
        return res.status(403).json({
            error: 'Bloqueio de Segurança: Requisição malformada ou maliciosa detectada.',
            code: 'NOSQL_INJECTION_PREVENTED'
        });
    }

    next();
};

module.exports = nosqlSanitizer;
