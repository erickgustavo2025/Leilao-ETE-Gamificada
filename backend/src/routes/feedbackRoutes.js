const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Criar (Qualquer aluno logado)
router.post('/', protect, feedbackController.createFeedback);

// Listar (Só Admin/Dev)
router.get('/', protect, admin, feedbackController.getAllFeedbacks);

// Atualizar Status (Só Admin/Dev)
router.patch('/:id/resolve', protect, admin, feedbackController.markAsResolved);

// Deletar (Só Admin/Dev)
router.delete('/:id', protect, admin, feedbackController.deleteFeedback);

module.exports = router;
