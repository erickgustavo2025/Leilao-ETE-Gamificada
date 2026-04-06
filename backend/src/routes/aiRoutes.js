// backend/src/routes/aiRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { processAIRequest, submitFeedback } = require('../controllers/aiController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ── RATE LIMITER ESPECÍFICO PARA IA (Seção 3.7)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 minuto
    max: 10,                  // 10 perguntas por minuto por usuário
    message: { error: 'Muitas perguntas. Aguarde um momento.' },
    keyGenerator: (req) => req.user?._id?.toString() || 'aluno-anonimo'
});

// Rotas protegidas por autenticação
router.post('/ask', protect, aiLimiter, processAIRequest);
router.post('/feedback', protect, submitFeedback);

module.exports = router;
