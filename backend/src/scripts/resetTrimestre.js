require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Log = require('../models/Log'); // Assumindo que você tem um model de Log

const resetTrimestre = async () => {
    try {
        console.log("🔌 Conectando ao Banco de Dados...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado!");
        
        console.log("⚠️ INICIANDO O GRANDE RESET TRIMESTRAL (ECA DIGITAL) ⚠️");
        
        // Atualiza todos os alunos, zerando APENAS o saldoPc
        const result = await User.updateMany(
            { role: 'student' },
            { $set: { saldoPc: 0 } }
            // xp, maxPcAchieved, inventory, badges, cargos ficam INTACTOS!
        );

        // Registra a ação no sistema de logs para auditoria
        if (Log) {
            await Log.create({
                action: 'SYSTEM_RESET',
                details: `Reset trimestral da ECA Digital executado. ${result.modifiedCount} alunos tiveram o saldo zerado.`,
                adminId: null, // Sistema
                targetId: null,
                createdAt: new Date()
            });
        }

        console.log(`══════════════════════════════════════`);
        console.log(`✅ RESET CONCLUÍDO COM SUCESSO!`);
        console.log(`👥 Alunos afetados: ${result.matchedCount}`);
        console.log(`💸 Contas zeradas (saldoPc): ${result.modifiedCount}`);
        console.log(`🛡️ Segurança: maxPcAchieved e XP mantidos intactos!`);
        console.log(`══════════════════════════════════════`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ ERRO FATAL DURANTE O RESET:", error);
        process.exit(1);
    }
};

resetTrimestre();