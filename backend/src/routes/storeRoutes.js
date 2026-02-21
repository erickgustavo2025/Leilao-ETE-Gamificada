const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../config/upload');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

// Rota Pública (Vitrine)
router.get('/items', protect, storeController.listItems);
 
router.get('/all', protect, storeController.listItems);

// Rota de Compra (Aluno)
router.post('/buy/:id', protect, storeController.buyItem);

// Rotas de Admin (Gestão)
router.post('/items', protect, admin, upload.single('imagem'), storeController.createItem);
router.put('/items/:id', protect, admin, upload.single('imagem'), validate(schemas.store.updateItem), storeController.updateItem);
router.delete('/items/:id', protect, admin, storeController.deleteItem);

module.exports = router;