const express = require('express');
const router = express.Router();
// O CTO Removeu a importação duplicada do multer daqui!
const { upload, processImageToWebp } = require('../config/upload');
const controller = require('../controllers/classroomController');
const { protect, admin } = require('../middlewares/authMiddleware');

// 1. Rota Pública (Ranking)
router.get('/', controller.index);

// 2. Rotas Protegidas (Aluno ou Admin)
router.get('/:id/inventory', protect, controller.getClassroomInventory);

// 3. Rotas Administrativas (Só Admin)
// Agora o WEBP Mágico está ativado e não vai dar erro!
router.post('/', protect, admin, upload.single('logo'), processImageToWebp, controller.store);
router.put('/:id', protect, admin, upload.single('logo'), processImageToWebp, controller.update);
router.delete('/:id', protect, admin, controller.delete);

module.exports = router;