// ARQUIVO: backend/src/routes/giftRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/giftController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rotas Aluno
router.get('/', protect, controller.getMyGifts);
router.post('/:id/claim', protect, controller.claimGift);

// Rotas Admin
router.post('/', protect, admin, controller.createGift);
// router.get('/admin', protect, admin, controller.listAllGifts); // Futuro
// router.delete('/:id', protect, admin, controller.deleteGift); // Futuro

module.exports = router;