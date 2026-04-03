// ARQUIVO: backend/src/routes/adminQuestRoutes.js
const express = require('express');
const router = express.Router();
const adminQuestController = require('../controllers/adminQuestController');
const { protect, admin } = require('../middlewares/authMiddleware');

// TODAS as rotas aqui exigem que o usuário esteja logado E seja Admin
router.use(protect, admin);

router.get('/', adminQuestController.getAllQuests);
router.post('/', adminQuestController.createQuest);
router.patch('/:id/toggle', adminQuestController.toggleQuest);
router.delete('/:id', adminQuestController.deleteQuest);

// --- FILA DE APROVAÇÃO ---
router.get('/approvals', adminQuestController.getPendingApprovals);
router.post('/approvals/:submissionId/approve', adminQuestController.approveQuest);
router.post('/approvals/:submissionId/reject', adminQuestController.rejectQuest);

module.exports = router;
