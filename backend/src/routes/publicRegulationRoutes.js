const express = require('express');
const router = express.Router();
const publicRegulationController = require('../controllers/publicRegulationController');
const { protect } = require('../middlewares/authMiddleware');

// Alunos autenticados podem ver os regulamentos
router.get('/', protect, publicRegulationController.listActive);

module.exports = router;
