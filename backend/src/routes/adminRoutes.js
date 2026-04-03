const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const storeController = require('../controllers/storeController');
const classroomController = require('../controllers/classroomController');
const { upload, processImageToWebp } = require('../config/upload');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- TUDO AQUI PARA BAIXO É RESTRITO A ADMIN ---
router.use(protect, admin);

// 1. GESTÃO DE ALUNOS
router.get('/students', adminController.getStudents);
router.delete('/student/:id', adminController.resetStudent);
router.put('/student/:id/balance', adminController.updateBalance);
router.get('/users', adminController.getAllUsers);

// 2. GESTÃO DA LOJA (ATUALIZADO)
router.get('/store/all', storeController.listItems);
router.put('/store/items/:id', storeController.updateItem);

// 3. GESTÃO DE SALAS
router.get('/classes', classroomController.listAllSimple);
router.put('/classes/:id', classroomController.update);

// 4. AUDITORIA
router.get('/logs', adminController.getBusinessLogs);

// 5. CONFIGURAÇÕES GERAIS (COM WEBP MÁGICO)
router.get('/config', adminController.getConfig);
router.put('/config', upload.single('file'), processImageToWebp, adminController.updateConfig);

// 6. GESTÃO DE MÍDIA (GALERIA & UPLOAD COM WEBP MÁGICO)
router.get('/images', adminController.getImages);
router.delete('/images/:filename', adminController.deleteImage);
router.post('/images', upload.single('file'), processImageToWebp, adminController.uploadImage);

// 🔴 7. O BOTÃO VERMELHO DO RESET (ECA DIGITAL)
// Obs: Não precisamos colocar "protect, admin" na linha abaixo porque o router.use() lá em cima já blinda tudo!
router.post('/system/reset-trimestre', async (req, res) => {
  try {
    const User = require('../models/User');
    const Log = require('../models/Log');
    const Classroom = require('../models/Classroom');

    // 1. Zera o saldoPc de todos os alunos (Mantém XP e MaxPcAchieved)
    const resultUsers = await User.updateMany(
      { role: 'student' },
      { $set: { saldoPc: 0 } }
    );

    // 2. Zera a pontuação atual de todas as Salas (Taça das Casas)
    const resultClasses = await Classroom.updateMany(
      {},
      { $set: { score: 0 } }
    );

    // 3. Registra no Log
    if (Log) {
      await Log.create({
        user: req.user._id,
        action: 'SYSTEM_RESET',
        details: `Reset Trimestral ECA Digital acionado pelo Admin. Alunos afetados: ${resultUsers.modifiedCount}. Salas resetadas: ${resultClasses.modifiedCount}.`,
        ip: req.ip
      });
    }

    res.json({ message: 'Reset Trimestral executado com sucesso!' });
  } catch (error) {
    console.error("Erro no Reset Trimestral:", error);
    res.status(500).json({ error: 'Erro crítico ao executar o reset.' });
  }
});

module.exports = router;