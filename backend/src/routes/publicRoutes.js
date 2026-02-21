// backend/src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');

router.get('/stats', publicController.getPublicStats);
router.get('/config', adminController.getConfig);

module.exports = router;