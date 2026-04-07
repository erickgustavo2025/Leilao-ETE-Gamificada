// backend/src/routes/aiRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
    processAIRequest,
    submitFeedback,
    getSessions,
    getSessionById,
    deleteSession, 
    renameSession  
} = require('../controllers/aiController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ── RATE LIMITER ESPECÍFICO PARA IA
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 minuto
    max: 25,                  // Aumentado para 25 para permitir maior fluidez sob carga
    message: { error: 'O Oráculo está meditando sobre muitas perguntas. Aguarde um minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: true,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    validate: {
        keyGeneratorIpFallback: false
    }
});

// Rotas de Chat e IA
router.post('/ask', protect, aiLimiter, processAIRequest);
router.post('/feedback', protect, submitFeedback);

// Rotas de Histórico/Sessões
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSessionById);

// Novas rotas para o aluno gerenciar a própria memória da IA:
router.patch('/sessions/:id', protect, renameSession); // Renomear título
router.delete('/sessions/:id', protect, deleteSession); // Apagar conversa/Limpar memória

module.exports = router;
