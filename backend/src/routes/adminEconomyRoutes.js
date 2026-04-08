const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const adminEconomyController = require('../controllers/adminEconomyController');

const router = express.Router();

router.use(protect, admin);

// Dashboard
router.get('/stats', adminEconomyController.getEconomyStats);

// Disciplinas
router.get('/disciplinas', adminEconomyController.getDisciplinas);
router.post('/disciplinas', adminEconomyController.createDisciplina);
router.put('/disciplinas/:id', adminEconomyController.updateDisciplina);
router.delete('/disciplinas/:id', adminEconomyController.deleteDisciplina);

// Ranks
router.get('/ranks', adminEconomyController.getRanks);
router.put('/ranks/:id', adminEconomyController.updateRank);

module.exports = router;
