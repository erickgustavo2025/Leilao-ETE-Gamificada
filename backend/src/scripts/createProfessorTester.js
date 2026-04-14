// backend/src/scripts/createProfessorTester.js
const mongoose = require('mongoose');
const Professor = require('../models/Professor');
const Disciplina = require('../models/Disciplina');
require('dotenv').config({ path: 'backend/.env' });

async function setupProfessorTester() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB para setup do Professor Tester');

        // Busca uma disciplina real para vincular (ou cria uma fake se não existir)
        let disciplina = await Disciplina.findOne();
        if (!disciplina) {
            disciplina = await Disciplina.create({
                nome: 'Ciência de Dados (Teste)',
                codigo: 'DS-TESTE',
                area: 'TECNICA'
            });
        }

        const professorData = {
            nome: 'Professor Alpha PJC',
            usuario: 'prof_alpha',
            senha: 'prof_secure_pass',
            email: 'prof@pjc.com',
            disciplinas: [{
                disciplinaId: disciplina._id,
                ano: '1',
                curso: 'DS',
                turmas: ['1A', '1B']
            }, {
                disciplinaId: disciplina._id,
                ano: '3',
                curso: 'DS',
                turmas: ['3A', '3B']
            }],
            ativo: true
        };

        let prof = await Professor.findOne({ usuario: professorData.usuario });
        if (prof) {
            console.log('🔄 Atualizando Professor Tester existente...');
            prof.nome = professorData.nome;
            prof.senha = professorData.senha; // O hook 'pre-save' cuidará do hash
            prof.disciplinas = professorData.disciplinas;
            await prof.save();
        } else {
            console.log('✨ Criando novo Professor Tester...');
            prof = await Professor.create(professorData);
        }

        console.log(`🚀 Professor '${prof.nome}' (User: ${prof.usuario}) preparado.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no setup do Professor:', err);
        process.exit(1);
    }
}

setupProfessorTester();
