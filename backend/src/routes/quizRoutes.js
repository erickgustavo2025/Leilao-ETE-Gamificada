const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, professor } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Limiter para evitar spam de geração de IA (custo de tokens)
const aiGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Max 10 gerações por hora por professor
    message: { message: "Limite de geração de IA atingido por esta hora. Use o banco de questões manuais." }
});

// Rotas de Professor
router.get('/', protect, professor, quizController.getTeacherQuestions);
router.post('/generate', protect, professor, aiGenerationLimiter, quizController.generateAIQuestions);

// Rotas de Aluno
router.post('/submit', protect, quizController.submitQuizAnswer);

module.exports = router;
