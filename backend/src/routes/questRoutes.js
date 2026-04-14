const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');
const { uploadDocument } = require('../config/upload');

// ROTAS DE ALUNO (Taverna)
router.post('/validate', protect, validate(schemas.quests.validateCode), questController.validateSecretCode);
router.post('/request-validation', protect, uploadDocument.single('file'), validate(schemas.quests.submitManual), questController.requestManualValidation);

// Lista de missões disponíveis
router.get('/secondary', protect, questController.getSecondaryQuests);

module.exports = router;