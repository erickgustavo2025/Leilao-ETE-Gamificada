const express = require('express');
const router = express.Router();
const controller = require('../controllers/houseController');
const { protect, admin } = require('../middlewares/authMiddleware');

// 🔥 ROTA DE CONFIG (Deve vir ANTES das rotas com :parametro)
router.get('/config', protect, controller.getSystemStatus); 
router.get('/stats', controller.getStats); // Removi protect se for público, se não, pode manter
router.get('/history/global', protect, controller.getGlobalHistory);

// Rotas Gerais
router.get('/leaderboard', controller.getLeaderboard);
router.get('/punitions', protect, controller.listPunishments); 

// 🔥 ROTA DA MOCHILA DA SALA (O que estava faltando!)
router.get('/inventory/:turma', protect, controller.getHouseInventory);

// Rotas com Parâmetros
router.get('/:turma/history', protect, controller.getHouseHistory);

// Rotas de Admin (Pontos e Punição)
router.post('/points', protect, admin, controller.managePoints);
router.post('/punish', protect, admin, controller.applyPunishment);

module.exports = router;