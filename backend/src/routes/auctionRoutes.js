const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../config/upload');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas'); // <--- Importando a central

// --- ROTAS DE ALUNO ---

router.get('/', protect, auctionController.getItems);
router.get('/history', protect, auctionController.getStudentHistory);

// Dar Lance (Agora usa o schema centralizado)
router.post('/bid/:id', 
    protect, 
    validate(schemas.auction.bid), 
    auctionController.placeBid
);

// --- ROTAS DE ADMIN ---

// Criar Item (Com validação de dados + Upload)
// Nota: O validate vem DEPOIS do upload, pois os dados vêm no req.body preenchido pelo multer
router.post('/', 
    protect, 
    admin, 
    upload.single('image'), 
    validate(schemas.auction.createItem), 
    auctionController.createItem
);

router.delete('/:id', protect, admin, auctionController.deleteItem);
router.put('/:id/close', protect, admin, auctionController.closeItem);

// Atualizar Item (Também validamos, mas reaproveitamos o schema de create ou fazemos um partial se precisar)
router.put('/:id', 
    protect, 
    admin, 
    upload.single('image'), 
    auctionController.updateItem
);

module.exports = router;