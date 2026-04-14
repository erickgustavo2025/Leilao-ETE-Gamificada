// backend/src/scripts/createAlphaTester.js
const mongoose = require('mongoose');
const User = require('../models/User'); 
require('dotenv').config({ path: 'backend/.env' });

async function setupAlphaTester() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB para setup do Alpha Tester');

        const alphaData = {
            matricula: '9999999',
            nome: 'Alpha Tester PJC',
            email: 'alpha@ete.com',
            senha: 'alpha_secure_pass',
            dataNascimento: '2000-01-01', // Necessário para o schema
            role: 'student', // Corrigido para minúsculo conforme enum
            saldoPc: 5000,
            xp: 10000,
            turma: '3A',
            cargos: ['PODE_FAZER_TRADE', 'MONITOR_LUMOS'] // Atribui permissões de teste
        };

        // 1. Criar ou Resetar Usuário
        let user = await User.findOne({ matricula: alphaData.matricula });
        if (user) {
            console.log('🔄 Atualizando Alpha Tester existente...');
            Object.assign(user, alphaData);
            await user.save();
        } else {
            console.log('✨ Criando novo Alpha Tester...');
            user = await User.create(alphaData);
        }

        console.log(`🚀 Alpha Tester '${user.nome}' preparado com permissões de Trade!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no setup:', err);
        process.exit(1);
    }
}

setupAlphaTester();
