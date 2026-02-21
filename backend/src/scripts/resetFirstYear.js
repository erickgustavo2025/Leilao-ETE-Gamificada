// ARQUIVO: src/scripts/resetFirstYear.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

async function resetFirstYear() {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");

        // Hash da senha fornecida
        const newPasswordHash = "$2a$10$0gnmBjAwKA8Bffdq/wFJSOtqkG.3fSPCRZMwgq6XpATPdF2s4SeQ6";

        console.log("🔍 Buscando alunos dos Primeiros Anos (Turmas começando com '1')...");

        // O filtro busca:
        // 1. role: 'student' (apenas alunos)
        // 2. turma: Começa com "1" (Regex ^1)
        const filter = {
            role: 'student',
            turma: { $regex: /^1/ } 
        };

        const update = {
            senha: newPasswordHash,
            isFirstAccess: false
        };

        // Atualiza todos de uma vez (muito mais rápido)
        const result = await User.updateMany(filter, update);

        console.log("══════════════════════════════════════");
        console.log(`✅ OPERAÇÃO CONCLUÍDA!`);
        console.log(`👥 Alunos encontrados/processados: ${result.matchedCount}`);
        console.log(`🔄 Alunos atualizados: ${result.modifiedCount}`);
        console.log(`🔑 Senha redefinida para o padrão fornecido.`);
        console.log(`🔓 Primeiro acesso liberado (false).`);
        console.log("══════════════════════════════════════");

    } catch (error) {
        console.error("❌ Erro fatal:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Conexão encerrada.");
        process.exit();
    }
}

resetFirstYear();