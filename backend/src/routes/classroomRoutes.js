// ARQUIVO: backend/src/routes/classroomRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadConfig = require('../config/upload'); 
const controller = require('../controllers/classroomController');
const { protect, admin } = require('../middlewares/authMiddleware');

const upload = multer(uploadConfig);

// 1. Rota Pública (Ranking)
// Qualquer um pode ver o ranking
router.get('/', controller.index);

// 2. Rotas Protegidas (Aluno ou Admin)
// O aluno PRECISA acessar isso. O controller faz a validação se é a sala dele.
// NÃO coloque 'admin' aqui, apenas 'protect'.
router.get('/:id/inventory', protect, controller.getClassroomInventory);

// 3. Rotas Administrativas (Só Admin)
// Aqui sim usamos o middleware 'admin'
router.post('/', protect, admin, upload.single('logo'), controller.store);
router.put('/:id', protect, admin, upload.single('logo'), controller.update);
router.delete('/:id', protect, admin, controller.delete);

module.exports = router;