const express = require('express');
const router = express.Router();
const startupController = require('../controllers/startupController');
const { protect, admin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

// Rotas protegidas por login
router.use(protect);

// Alunos podem listar e criar startups
router.get('/', startupController.listStartups);
router.post('/create', validate(schemas.startupCreate), startupController.createStartup);

// Apenas admin/professores podem gerenciar startups
router.put('/:id/approve', admin, startupController.approveStartup);
router.put('/:id/reject', admin, startupController.rejectStartup);
router.put('/:id/performance', admin, startupController.updatePerformance);

module.exports = router;
