// backend/src/routes/notasRoutes.js
const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const { updateNotas, getMyNotas } = require('../controllers/notasController');

const router = express.Router();

// Rota para o próprio aluno ver suas notas
router.get('/me', protect, getMyNotas);

// Rota para o Admin atualizar notas de qualquer aluno
router.post('/update', protect, admin, updateNotas);

module.exports = router;
