const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', controller.getBankInfo);
router.post('/loan', controller.takeLoan);
router.post('/pay', controller.payLoan);

module.exports = router;