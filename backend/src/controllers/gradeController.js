const Grade = require('../models/Grade');
const User = require('../models/User');
const AIInteraction = require('../models/AIInteraction');
const ChatSession = require('../models/ChatSession');
const Professor = require('../models/Professor');

module.exports = {
    // 📝 1. IMPORTAÇÃO EM MASSA (CSV/XLS convertido em JSON no frontend)
    async importGrades(req, res) {
        try {
            const { grades, disciplinaId, trimestre, tipo } = req.body;
            const professorId = req.user.id; // ID do professor logado

            // Validar se o professor tem vínculo com essa disciplina
            const professor = await Professor.findById(professorId);
            const vinculo = professor.disciplinas.find(d => 
                d.disciplinaId.toString() === disciplinaId && 
                (tipo === 'REDACAO' ? d.isRedacao : !d.isRedacao)
            );

            if (!vinculo) {
                return res.status(403).json({ message: 'Você não tem permissão para esta disciplina/tipo.' });
            }

            const results = {
                sucesso: 0,
                erros: []
            };

            for (const item of grades) {
                try {
                    const student = await User.findOne({ matricula: item.matricula });
                    
                    if (!student) {
                        results.erros.push(`Matrícula ${item.matricula} não encontrada.`);
                        continue;
                    }

                    // Verificar se o aluno pertence a uma das turmas vinculadas do professor
                    if (!vinculo.turmas.includes(student.turma)) {
                        results.erros.push(`Aluno ${student.nome} não pertence às suas turmas.`);
                        continue;
                    }

                    // Upsert (Atualizar se existir, criar se não)
                    await Grade.findOneAndUpdate(
                        { 
                            alunoId: student._id, 
                            disciplinaId, 
                            trimestre, 
                            tipo 
                        },
                        { 
                            professorId,
                            n1: Number(item.n1) || 0,
                            n2: Number(item.n2) || 0,
                            turma: student.turma
                        },
                        { upsert: true, new: true }
                    );

                    results.sucesso++;
                } catch (err) {
                    results.erros.push(`Erro ao processar ${item.matricula}: ${err.message}`);
                }
            }

            res.status(200).json({ 
                message: `Importação concluída: ${results.sucesso} registros processados.`,
                errors: results.erros 
            });

        } catch (err) {
            res.status(500).json({ message: 'Erro interno na importação.' });
        }
    },

    // 🔬 2. DADOS DE CORRELAÇÃO (Coração do Artigo PJC)
    async getCorrelationData(req, res) {
        try {
            const { disciplinaId, turma, trimestre } = req.query;
            const professorId = req.user.id;

            // --- 🛡️ TRAVA IDOR (S2) ---
            const professor = await Professor.findById(professorId);
            const temVinculo = professor.disciplinas.some(d => 
                d.disciplinaId.toString() === disciplinaId && 
                d.turmas.includes(turma)
            );

            if (!temVinculo && req.user.role !== 'admin' && req.user.role !== 'dev') {
                return res.status(403).json({ 
                    message: 'Acesso Negado: Você não possui vínculo com esta turma/disciplina para acessar dados científicos.' 
                });
            }
            
            // Buscar todas as notas daquela turma/disciplina
            const grades = await Grade.find({ disciplinaId, turma, trimestre })
                .populate('alunoId', 'nome xp matricula');

            const correlationReport = await Promise.all(grades.map(async (g) => {
                // Buscar interações desse aluno com a IA
                const aiCount = await AIInteraction.countDocuments({ user: g.alunoId._id });
                
                // Buscar tempo total em sessões de estudo
                const sessions = await ChatSession.find({ user: g.alunoId._id });
                const totalMinutes = sessions.reduce((acc, s) => {
                    if (s.endTime) {
                        return acc + (new Date(s.endTime) - new Date(s.startTime)) / 60000;
                    }
                    return acc;
                }, 0);

                return {
                    aluno: g.alunoId.nome,
                    matricula: g.alunoId.matricula,
                    mediaAcademica: (g.n1 + g.n2) / 2,
                    interacoesIA: aiCount,
                    minutosEstudo: Math.round(totalMinutes),
                    xp: g.alunoId.xp
                };
            }));

            res.status(200).json(correlationReport);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao gerar dados de correlação.' });
        }
    },

    // 📋 3. LISTAR NOTAS POR PROFESSOR
    async getProfessorGrades(req, res) {
        try {
            const professorId = req.user.id;
            const { disciplinaId, tipo } = req.query;

            const grades = await Grade.find({ professorId, disciplinaId, tipo })
                .populate('alunoId', 'nome turma')
                .sort({ turma: 1, 'alunoId.nome': 1 });

            res.status(200).json(grades);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao buscar notas.' });
        }
    }
};
