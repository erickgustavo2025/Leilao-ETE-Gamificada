const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const storeController = require('../controllers/storeController');
const classroomController = require('../controllers/classroomController');
const rouletteController = require('../controllers/rouletteController');
const upload = require('../config/upload');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- TUDO AQUI PARA BAIXO É RESTRITO A ADMIN ---
router.use(protect, admin);

// 1. GESTÃO DE ALUNOS
router.get('/students', adminController.getStudents);
router.delete('/student/:id', adminController.resetStudent);
router.put('/student/:id/balance', adminController.updateBalance);
router.get('/users', adminController.getAllUsers);

// 2. GESTÃO DA LOJA (ATUALIZADO)
// 🚨 CORREÇÃO: Mudamos de 'listAllAdmin' para 'listItems'
// O novo controller usa 'listItems' para ambos, filtrando por cargo internamente.
router.get('/store/all', storeController.listItems); 
router.put('/store/items/:id', storeController.updateItem);

// 3. GESTÃO DE SALAS
router.get('/classes', classroomController.listAllSimple); 
router.put('/classes/:id', classroomController.update);


// ROTAS DA ROLETA (ADMIN)
router.get('/roulette/admin/all', rouletteController.listAll); // Listar
router.post('/roulette/admin/save', rouletteController.saveRoulette); // Criar/Editar
router.delete('/roulette/admin/:id', rouletteController.delete);

// 4. AUDITORIA
router.get('/logs', adminController.getBusinessLogs);

// 5. CONFIGURAÇÕES GERAIS
router.get('/config', adminController.getConfig);
router.put('/config', upload.single('file'), adminController.updateConfig);

// 6. GESTÃO DE MÍDIA (GALERIA & UPLOAD)
router.get('/images', adminController.getImages);
router.delete('/images/:filename', adminController.deleteImage);
router.post('/images', upload.single('file'), adminController.uploadImage);

module.exports = router;