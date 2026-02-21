const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin, devOnly } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const upload = require('../config/upload');
const notifController = require('../controllers/notificationController');
const schemas = require('../validators/schemas');

// --- ROTAS PROTEGIDAS (antes eram públicas — qualquer um sem login acessava) ---
router.get('/classes', protect, userController.getClasses);
router.get('/students', protect, userController.getStudentsByClass);
router.get('/find/:matricula', protect, userController.findByMatricula);
router.post('/vip-code', protect, userController.redeemVipCode);

// --- NOTIFICAÇÕES ---
router.get('/notifications', protect, notifController.getMyNotifications);
router.put('/notifications/read', protect, notifController.markAsRead);

// --- ROTAS PROTEGIDAS (ALUNO/MONITOR/ADMIN) ---
router.get('/my-inventory', protect, userController.getMyInventory);
router.put('/avatar', protect, upload.single('avatar'), userController.updateAvatar);

// Inventário Público (para o Trade)
router.get('/:userId/inventory-public', protect, userController.getUserInventoryPublic);

// Painel do Monitor
router.get('/monitor/class', protect, (req, res, next) => {
    if (['monitor', 'admin', 'dev'].includes(req.user.role)) next();
    else res.status(403).json({ error: 'Acesso restrito a Monitores' });
}, userController.getMonitorClass);

router.get('/monitor/logs', protect, userController.getMonitorLogs);

// Bulk Points (Monitor/Admin)
router.put('/points/bulk',
    protect,
    (req, res, next) => {
        if (['admin', 'monitor', 'dev'].includes(req.user.role)) next();
        else return res.status(403).json({ error: 'Sem permissão.' });
    },
    validate(schemas.admin.givePoints),
    userController.bulkUpdatePoints
);

// --- ROTAS DE ADMIN ---
router.get('/', protect, admin, userController.index);
router.put('/profile', protect, admin, userController.updateStudentProfile);
router.put('/promote', protect, admin, userController.toggleMonitor);
router.get('/logs', protect, admin, userController.getAdminLogs);
router.post('/manual', protect, devOnly, userController.createManualUser);
router.put('/block', protect, admin, validate(schemas.user.block), userController.toggleBlock);
router.put('/special-role', protect, admin, userController.toggleSpecialRole);

module.exports = router;
