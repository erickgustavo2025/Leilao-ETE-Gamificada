const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const { protect, admin } = require('../middlewares/authMiddleware');

// GET /api/admin/analytics
// Rota protegida: apenas administradores podem acessar os dados científicos
router.get('/', protect, admin, adminAnalyticsController.getDashboardData);
router.get('/export', protect, admin, adminAnalyticsController.exportScientificData);

module.exports = router;
