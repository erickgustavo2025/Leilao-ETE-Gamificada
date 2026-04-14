const TeacherSurveyResponse = require('../models/TeacherSurveyResponse');

exports.submitSurvey = async (req, res) => {
    try {
        const { respostas, comentariosGerais, disciplinaId } = req.body;
        const professorId = req.user.id;
        const mesReferencia = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Verifica se já existe resposta para este mês
        const existing = await TeacherSurveyResponse.findOne({ professorId, mesReferencia });
        if (existing) {
            return res.status(400).json({ message: 'Você já enviou a pesquisa deste mês. Obrigado!' });
        }

        const survey = await TeacherSurveyResponse.create({
            professorId,
            disciplinaId,
            mesReferencia,
            respostas,
            comentariosGerais
        });

        res.json({ message: 'Pesquisa científica enviada com sucesso! Seu feedback é valioso.', survey });
    } catch (error) {
        console.error('Teacher Survey Error:', error);
        res.status(500).json({ message: 'Erro ao salvar pesquisa.' });
    }
};

exports.getSurveyStatus = async (req, res) => {
    try {
        const professorId = req.user.id;
        const mesReferencia = new Date().toISOString().slice(0, 7);
        const survey = await TeacherSurveyResponse.findOne({ professorId, mesReferencia });
        
        res.json({ answered: !!survey });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao verificar status da pesquisa.' });
    }
};
