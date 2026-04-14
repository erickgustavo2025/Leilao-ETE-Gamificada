const express = require('express');
const router = express.Router();
const professorAuthController = require('../controllers/professorAuthController');
const gradeController = require('../controllers/gradeController');
const { protect, professor } = require('../middlewares/authMiddleware');

// 🔒 Todas as rotas daqui para baixo exigem: Token Válido + Role Professor/Admin
router.use(protect, professor);

// 🎓 GESTÃO DE TURMAS & ALUNOS
router.get('/students', professorAuthController.getStudents);

// 🛡️ CONTROLE DE AVALIAÇÕES (EXAM LOCK)
router.post('/exam-lock', professorAuthController.toggleExamLock);

// 🔬 MÓDULO CIENTÍFICO & ACADÊMICO (Notas N1/N2)
const teacherSurveyController = require('../controllers/teacherSurveyController');
router.post('/grades/import', gradeController.importGrades);
router.get('/grades/correlation', gradeController.getCorrelationData);
router.get('/grades', gradeController.getProfessorGrades);

// 📊 PESQUISA CIENTÍFICA (PJC) & ANALYTICS IA
const pjcController = require('../controllers/pjcController');
router.post('/surveys/submit', teacherSurveyController.submitSurvey);
router.get('/surveys/status', teacherSurveyController.getSurveyStatus);
router.get('/pjc/export/:disciplinaId', pjcController.exportPJCData);
router.get('/pjc/gaps/:disciplinaId', pjcController.getPedagogicalGaps);

// 📚 GESTÃO PEDAGÓGICA (EMENTA & RAG)
const disciplinaController = require('../controllers/disciplinaController');
const ragController = require('../controllers/ragController');
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB para PDFs/DOCXs
});

router.get('/ementa', disciplinaController.getEmenta);
router.put('/ementa', disciplinaController.updateEmenta);

// RAG: Materiais de Estudo & Base de Conhecimento
router.post('/materials/upload', upload.single('file'), ragController.uploadMaterial);
router.get('/materials/topics/:disciplinaId', ragController.getTopicsByDisciplina);
router.get('/materials/:disciplinaId', ragController.getMaterialsByDisciplina);
router.delete('/materials/:fileId', ragController.deleteMaterial);

// SIMULADOS DE TREINO (PJC 2.0)
const trainingQuizController = require('../controllers/trainingQuizController');
router.post('/training-quizzes/generate', trainingQuizController.generateAIQuestions);
router.post('/training-quizzes', trainingQuizController.createQuiz);

// 👤 PERFIL
router.get('/me', professorAuthController.getMe);

module.exports = router;
