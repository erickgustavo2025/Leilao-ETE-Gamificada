const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

async function blessStudent() {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        const matriculaTarget = "3673198";
        
        // Busca o aluno abençoado
        const user = await User.findOne({ matricula: matriculaTarget });

        if (!user) {
            console.log(`❌ ERRO: Aluno com matrícula ${matriculaTarget} não encontrado.`);
            return;
        }

        // Verifica se ele já tem o cargo
        if (!user.cargos.includes('bencao_de_merlin')) {
            user.cargos.push('bencao_de_merlin');
            await user.save();
            
            console.log(`\n=================================================`);
            console.log(`✨ BÊNÇÃO DE MERLIN CONCEDIDA COM SUCESSO! ✨`);
            console.log(`👤 Aluno: ${user.nome}`);
            console.log(`🎓 Matrícula: ${user.matricula}`);
            console.log(`\nAgora este aluno receberá +0.5x de bônus passivo!`);
            console.log(`Se usar Triplicador, o bônus será de 3.5x!`);
            console.log(`=================================================\n`);
        } else {
            console.log(`⚡ O aluno ${user.nome} JÁ POSSUI a Bênção de Merlin! Nenhuma alteração foi feita.`);
        }

    } catch (error) {
        console.error("❌ Erro fatal ao conceder bênção:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Conexão encerrada.");
        process.exit();
    }
}

blessStudent();