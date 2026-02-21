const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');
const { protect } = require('../middlewares/authMiddleware');

// Rota pública para logados
router.get('/', protect, benefitController.index);

module.exports = router;