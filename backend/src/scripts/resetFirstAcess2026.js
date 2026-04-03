// ARQUIVO: src/scripts/resetFirstAcess2026.js
// Objetivo: Encontrar todos os alunos do 1º ano e redefinir o campo isFirstAccess para true.
// Regra: Turmas começando com '1' (Regex ^1)
// Segurança: NÃO alterar ou limpar o campo 'senha'. Os alunos devem usar a senha atual para validar o primeiro acesso.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

async function resetFirstAccess2026() {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI não encontrada no .env");
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        console.log("🔍 Buscando alunos dos Primeiros Anos (Turmas começando com '1')...");

        // Filtro: apenas alunos (role: student) do 1º ano (turma: ^1)
        const filter = {
            role: 'student',
            turma: { $regex: /^1/ } 
        };

        // Redefine APENAS isFirstAccess para true.
        // A senha permanece intacta conforme exigência do CTO para garantir a prova de identidade.
        const update = {
            $set: { isFirstAccess: true }
        };

        const result = await User.updateMany(filter, update);

        console.log("══════════════════════════════════════");
        console.log(`✅ OPERAÇÃO CONCLUÍDA!`);
        console.log(`👥 Alunos encontrados: ${result.matchedCount}`);
        console.log(`🔄 Alunos resetados para Primeiro Acesso: ${result.modifiedCount}`);
        console.log(`🔓 Campo isFirstAccess definido como TRUE.`);
        console.log(`🛡️  Segurança: Senhas preservadas.`);
        console.log("══════════════════════════════════════");

    } catch (error) {
        console.error("❌ Erro fatal:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Conexão encerrada.");
        process.exit();
    }
}

resetFirstAccess2026();
