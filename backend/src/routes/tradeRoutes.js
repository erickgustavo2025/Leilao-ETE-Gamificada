const express = require('express');
const router = express.Router();
const controller = require('../controllers/tradeController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/create', controller.createTrade);
router.post('/accept', controller.acceptTrade);
router.get('/my', controller.getMyTrades);
router.delete('/:id', controller.cancelTrade);

module.exports = router;