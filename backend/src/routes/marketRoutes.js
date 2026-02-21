const express = require('express');
const router = express.Router();
const controller = require('../controllers/marketController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

router.use(protect);

router.get('/', controller.getListings);
router.get('/mine', controller.getMyListings);

router.post('/sell', validate(schemas.market.sell), controller.createListing);
router.post('/buy', validate(schemas.market.buy), controller.buyItem);

// REMOVIDA A VALIDAÇÃO DO DELETE (O ID vem na URL, Mongoose valida)
router.delete('/:id', controller.cancelListing);

module.exports = router;