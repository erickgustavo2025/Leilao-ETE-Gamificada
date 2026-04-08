const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- ROTAS DO ALUNO ---
router.get('/active', protect, surveyController.getActiveSurvey);
router.post('/submit', protect, surveyController.submitResponse);

// --- ROTAS DO ADMIN ---
router.get('/list', protect, admin, surveyController.listSurveys);
router.post('/create', protect, admin, surveyController.createSurvey);
router.patch('/toggle/:id', protect, admin, surveyController.toggleSurveyStatus);
router.get('/analytics/:surveyId', protect, admin, surveyController.getSurveyAnalytics);

module.exports = router;
