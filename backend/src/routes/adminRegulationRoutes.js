const express = require('express');
const router = express.Router();
const adminRegulationController = require('../controllers/adminRegulationController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rotas protegidas: apenas administradores podem gerenciar regulamentos
router.get('/', protect, admin, adminRegulationController.list);
router.post('/', protect, admin, adminRegulationController.create);
router.put('/:id', protect, admin, adminRegulationController.update);
router.delete('/:id', protect, admin, adminRegulationController.delete);

module.exports = router;
