const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

// Todas as rotas de investimento são protegidas
router.use(protect);

router.get('/cotacoes', investmentController.getCotacoes);
router.post('/buy', validate(schemas.investments), investmentController.buyAsset);
router.post('/sell', validate(schemas.investments), investmentController.sellAsset);

module.exports = router;
