const express = require('express');
const router = express.Router();
const devController = require('../controllers/devController');
const { protect } = require('../middlewares/authMiddleware');

// Middleware manual de segurança (Dev Only)
const devOnly = (req, res, next) => {
    if (req.user && ['dev', 'admin'].includes(req.user.role)) {
        next();
    } else {
        return res.status(403).json({ error: 'Acesso restrito a desenvolvedores.' });
    }
};

// Trava de Segurança
router.use(protect, devOnly);

// Dashboard & Monitoramento
router.get('/stats', devController.getSystemStats); 
router.get('/logs', devController.getSystemLogs); // <--- Corrigido para usar o devController

// Ações Críticas
router.post('/maintenance', devController.toggleMaintenance); // <--- Corrigido para toggleMaintenance
router.post('/impersonate', devController.impersonateUser);

module.exports = router;