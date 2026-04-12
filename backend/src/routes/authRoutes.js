const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

// --- ROTAS PÚBLICAS ---

// 1º Acesso (Valida se matrícula e data batem)
router.post('/first-access', 
    validate(schemas.auth.firstAccess), 
    authController.checkFirstAccess
);

// Cadastro de Senha/Ativação
router.post('/register', 
    validate(schemas.auth.register), 
    authController.register
);

// Login Unificado
router.post('/login', 
    validate(schemas.auth.login), 
    authController.login
);

// Recuperação de Senha
router.post('/forgot-password', validate(schemas.auth.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(schemas.auth.resetPassword), authController.resetPassword);

// --- ROTAS PRIVADAS ---
router.get('/me', protect, authController.getMe);
router.get('/rules', protect, authController.getSystemRules);

// Configurações de Conta
router.put('/change-password', protect, validate(schemas.auth.changePassword), authController.changePassword);
router.put('/change-email', protect, validate(schemas.auth.changeEmail), authController.changeEmail);

module.exports = router;