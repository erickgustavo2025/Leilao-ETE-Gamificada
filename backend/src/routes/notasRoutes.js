const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const notasController = require('../controllers/notasController');

const router = express.Router();

router.use(protect);

router.get('/me', notasController.getAvailableDisciplinas);
router.post('/comprar', notasController.comprarPonto);

module.exports = router;
