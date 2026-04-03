// ARQUIVO: backend/src/routes/questRoutes.js
const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const { protect, admin } = require('../middlewares/authMiddleware');

// ROTAS DE ALUNO (Taverna)
router.post('/validate', protect, questController.validateSecretCode);
router.post('/request-validation', protect, questController.requestManualValidation);
// Aqui no futuro colocaremos o router.get('/campaign') e router.get('/secondary')

router.get('/secondary', protect, questController.getSecondaryQuests);

// ROTAS DE ADMIN (Criar missões no painel)
// router.post('/', protect, admin, questController.createQuest);

module.exports = router;