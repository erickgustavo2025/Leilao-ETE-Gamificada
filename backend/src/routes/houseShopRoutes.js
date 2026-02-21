const express = require('express');
const router = express.Router();
const controller = require('../controllers/houseShopController');
const { protect } = require('../middlewares/authMiddleware');

// Se o controller não tiver a função 'getBecoItems', o servidor VAI CRASHAR aqui
router.get('/', protect, controller.getBecoItems);
router.post('/buy', protect, controller.buyCollective);
router.post('/buy-individual', protect, controller.buyIndividual);

module.exports = router;