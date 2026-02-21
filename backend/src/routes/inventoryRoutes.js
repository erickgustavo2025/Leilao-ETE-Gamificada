const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const inventoryController = require('../controllers/inventoryController');
const { protect, admin } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

// --- ROTAS DE INVENTÁRIO ---

router.get('/my', protect, userController.getMyInventory); 
router.get('/public/:userId', protect, userController.getUserInventoryPublic); 

// 🔥 USO DE ITENS (Agora inclui item pessoal e de sala)
router.post('/use', protect, inventoryController.useItem); 
router.post('/use-room-item', protect, inventoryController.useRoomItem); // Adicionado aqui!



router.delete('/item/:slotId', protect, inventoryController.discardItem);
router.delete('/room-item/:slotId', protect, inventoryController.discardRoomItem);

// Admin
router.get('/items', protect, admin, inventoryController.getAllItems);


module.exports = router;