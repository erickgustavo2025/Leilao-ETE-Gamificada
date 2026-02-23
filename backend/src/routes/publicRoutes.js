// backend/src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', publicController.getPublicStats);
router.get('/config', adminController.getConfig);
router.get('/profile/:userId', protect, publicController.getPublicProfile);

module.exports = router;
