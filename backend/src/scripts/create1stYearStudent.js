// backend/src/scripts/create1stYearStudent.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: 'backend/.env' });

async function setup1stYearStudent() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB para setup do Aluno 1º Ano');

        const studentData = {
            matricula: '1111111',
            nome: 'Calouro Teste PJC',
            email: 'calouro@ete.com',
            senha: 'calouro_secure_pass',
            dataNascimento: '2008-01-01',
            role: 'student',
            saldoPc: 100,
            xp: 50,
            turma: '1A' // Fundamental para o teste de Oráculo Contextual
        };

        let user = await User.findOne({ matricula: studentData.matricula });
        if (user) {
            console.log('🔄 Atualizando Calouro existente...');
            Object.assign(user, studentData);
            await user.save();
        } else {
            console.log('✨ Criando novo Calouro...');
            user = await User.create(studentData);
        }

        console.log(`🚀 Aluno '${user.nome}' (1º Ano) preparado.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no setup do Calouro:', err);
        process.exit(1);
    }
}

setup1stYearStudent();
