const express = require('express');
const router = express.Router();
const controller = require('../controllers/rouletteController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- ROTA PÚBLICA (Aluno) ---
router.get('/status', protect, controller.getStatus); // Pega saldo de skills e roletas ativas
router.post('/spin', protect, controller.spin);       // Gira a roleta

// --- ROTA ADMIN (Gestão) ---
// O prefixo /api/roulette já vem do server.js
router.get('/admin/all', protect, admin, controller.listAll);
router.post('/admin/save', protect, admin, controller.saveRoulette);

// 🔥 A ROTA QUE FALTAVA (Adicione esta linha):
router.delete('/admin/:id', protect, admin, controller.delete);

module.exports = router;