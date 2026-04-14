// backend/src/middlewares/enrollmentGuard.js
const Disciplina = require('../models/Disciplina');
const TrainingQuiz = require('../models/TrainingQuiz');

/**
 * Middleware para validar se o aluno está matriculado na disciplina que tenta acessar.
 * Verifica o vínculo de Ano (Série) e Curso.
 * 
 * Uso: router.get('/:id', protect, checkEnrollment('params', 'id'), controller.get);
 */
const checkEnrollment = (source = 'params', field = 'disciplinaId') => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const disciplinaId = req[source][field];

            // 🛡️ Staff (Admin, Dev, Professor*) sempre tem acesso
            // *Nota: Professores são validados em nível de controller se são "donos" da disc.
            if (['admin', 'dev', 'monitor', 'professor'].includes(user.role)) {
                return next();
            }

            if (!disciplinaId) return next(); // Se não houver ID, deixa o controller lidar

            let targetDisciplinaId = disciplinaId;

            // 🔍 [BLINDAGEM 3.3] Se o campo for 'id' em rota de quiz, busca a disciplina
            if (field === 'id' && req.originalUrl.includes('training-quiz')) {
                const quiz = await TrainingQuiz.findById(disciplinaId).select('disciplinaId');
                if (!quiz) return res.status(404).json({ error: 'Simulado não encontrado.' });
                targetDisciplinaId = quiz.disciplinaId;
            }

            const disciplina = await Disciplina.findById(targetDisciplinaId);
            if (!disciplina) {
                return res.status(404).json({ error: 'Disciplina não encontrada.' });
            }

            const userYear = user.turma.charAt(0);
            const userCourse = user.turma.substring(1).toUpperCase();

            // 1. Verificação de Ano (1, 2, 3)
            if (userYear !== disciplina.ano) {
                return res.status(403).json({ 
                    error: 'ACESSO_NEGADO', 
                    message: `Este conteúdo é do ${disciplina.ano}º ano. Sua turma (${user.turma}) pertence ao ${userYear}º ano.` 
                });
            }

            // 2. Verificação de Curso (DS, ADM, COMUM)
            if (disciplina.curso !== 'COMUM' && !userCourse.includes(disciplina.curso)) {
                return res.status(403).json({ 
                    error: 'ACESSO_NEGADO', 
                    message: `Este conteúdo é restrito ao curso de ${disciplina.curso}.` 
                });
            }

            // Se passou em tudo, anexa a disciplina ao req para evitar nova busca no controller
            req.disciplina = disciplina;
            next();
        } catch (error) {
            console.error('Enrollment Guard Error:', error);
            res.status(500).json({ error: 'Erro ao validar acesso à disciplina.' });
        }
    };
};

module.exports = { checkEnrollment };
