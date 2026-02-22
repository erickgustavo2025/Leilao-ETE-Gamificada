// ARQUIVO: backend/src/routes/houseHistoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/houseHistoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Público — qualquer aluno logado pode ver a linha do tempo
router.get('/', protect, controller.getAll);

// Admin apenas — CRUD completo
router.post('/',        protect, admin, controller.create);
router.put('/:id',      protect, admin, controller.update);
router.delete('/:id',   protect, admin, controller.remove);

module.exports = router;