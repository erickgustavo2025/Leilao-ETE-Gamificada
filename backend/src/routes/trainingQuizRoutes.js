const express = require('express');
const router = express.Router();
const trainingQuizController = require('../controllers/trainingQuizController');
const { protect } = require('../middlewares/authMiddleware');
const { checkEnrollment } = require('../middlewares/enrollmentGuard');

// 🔒 Todas as rotas de treino exigem login do aluno
router.use(protect);

// 📖 Lista simulados disponíveis para a disciplina do aluno
router.get('/available/:disciplinaId', checkEnrollment('params', 'disciplinaId'), trainingQuizController.listAvailableQuizzes);

// 📝 Busca questões de um simulado específico (Inicia o cronômetro no server!)
router.get('/:id', checkEnrollment('params', 'id'), trainingQuizController.getQuizById);

// 🏁 Envia resultado e valida recompensa (Calcula tempo real no server!)
router.post('/:id/submit', checkEnrollment('params', 'id'), trainingQuizController.submitQuizResult);

// 🧬 Busca tópicos disponíveis para o aluno (RAG)
router.get('/topics/:disciplinaId', checkEnrollment('params', 'disciplinaId'), trainingQuizController.getTopicsForStudent);

module.exports = router;
