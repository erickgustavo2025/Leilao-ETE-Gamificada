const express = require('express');
const router = express.Router();
const economyController = require('../controllers/economyController');
const { protect } = require('../middlewares/authMiddleware');

// Todas as rotas de economia exigem login
router.use(protect);

// Rota de PIX: POST /api/economy/transfer
router.post('/transfer', economyController.transferPc);

module.exports = router;