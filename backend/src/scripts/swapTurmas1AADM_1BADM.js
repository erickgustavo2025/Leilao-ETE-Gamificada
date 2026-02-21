// ================================================================
// backend/src/scripts/swapTurmas1AADM_1BADM.js
//
// 🔄 Troca TODOS os alunos entre 1°A ADM e 1°B ADM:
//    • Alunos da 1A ADM → vão para 1B ADM
//    • Alunos da 1B ADM → vão para 1A ADM
//
// Estratégia segura (3 passos com valor temporário):
//    Passo 1: 1A ADM  →  __SWAP_TEMP__   (guarda os alunos do A)
//    Passo 2: 1B ADM  →  1A ADM          (B vira A)
//    Passo 3: __SWAP_TEMP__  →  1B ADM   (A (guardado) vira B)
// ================================================================

const mongoose = require('mongoose');
const path     = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI não encontrada no .env!');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// Nomes canônicos das turmas (exatamente como estão no banco)
// ─────────────────────────────────────────────────────────────────
const TURMA_A    = '1A ADM';
const TURMA_B    = '1B ADM';
const TEMP_TOKEN = '__SWAP_TEMP_ADM__';

async function swapTurmas() {
    let session; // Declarada fora do try para ser acessível no catch

    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        console.log('✅ Conectado!\n');

        // A sessão agora é iniciada APÓS a conexão estar estabelecida
        session = await mongoose.startSession();

        // ── Diagnóstico antes do swap ────────────────────────────
        const countA = await User.countDocuments({ turma: TURMA_A });
        const countB = await User.countDocuments({ turma: TURMA_B });

        console.log(`📊 Estado ANTES do swap:`);
        console.log(`   ${TURMA_A}: ${countA} alunos`);
        console.log(`   ${TURMA_B}: ${countB} alunos\n`);

        if (countA === 0 && countB === 0) {
            console.log('⚠️  Nenhum aluno encontrado nas duas turmas.');
            console.log('   Verifique se os nomes estão corretos no banco.');
            const allTurmas = await User.distinct('turma');
            console.log('   Turmas existentes:', allTurmas);
            process.exit(0);
        }

        // ── Confirmação de segurança ──
        const alunosA = await User.find({ turma: TURMA_A }).select('nome matricula').sort({ nome: 1 });
        const alunosB = await User.find({ turma: TURMA_B }).select('nome matricula').sort({ nome: 1 });

        console.log(`👥 Alunos de ${TURMA_A} (→ irão para ${TURMA_B}):`);
        alunosA.forEach(u => console.log(`   • ${u.nome} (${u.matricula})`));

        console.log(`\n👥 Alunos de ${TURMA_B} (→ irão para ${TURMA_A}):`);
        alunosB.forEach(u => console.log(`   • ${u.nome} (${u.matricula})`));

        console.log('\n🔄 Iniciando swap com transação...\n');

        // ── Executa swap dentro de uma transação ────────────────
        session.startTransaction();

        // Passo 1: 1A ADM → TEMP
        const step1 = await User.updateMany(
            { turma: TURMA_A },
            { $set: { turma: TEMP_TOKEN } },
            { session }
        );
        console.log(`   ✅ Passo 1: ${step1.modifiedCount} alunos de '${TURMA_A}' → '${TEMP_TOKEN}'`);

        // Passo 2: 1B ADM → 1A ADM
        const step2 = await User.updateMany(
            { turma: TURMA_B },
            { $set: { turma: TURMA_A } },
            { session }
        );
        console.log(`   ✅ Passo 2: ${step2.modifiedCount} alunos de '${TURMA_B}' → '${TURMA_A}'`);

        // Passo 3: TEMP → 1B ADM
        const step3 = await User.updateMany(
            { turma: TEMP_TOKEN },
            { $set: { turma: TURMA_B } },
            { session }
        );
        console.log(`   ✅ Passo 3: ${step3.modifiedCount} alunos de '${TEMP_TOKEN}' → '${TURMA_B}'`);

        await session.commitTransaction();
        session.endSession();

        // ── Diagnóstico depois do swap ───────────────────────────
        const countAAfter = await User.countDocuments({ turma: TURMA_A });
        const countBAfter = await User.countDocuments({ turma: TURMA_B });
        const countTemp   = await User.countDocuments({ turma: TEMP_TOKEN });

        console.log(`\n📊 Estado DEPOIS do swap:`);
        console.log(`   ${TURMA_A}: ${countAAfter} alunos  (era ${countA})`);
        console.log(`   ${TURMA_B}: ${countBAfter} alunos  (era ${countB})`);

        if (countTemp > 0) {
            console.error(`\n🚨 ATENÇÃO: ${countTemp} alunos ainda estão com turma '${TEMP_TOKEN}'!`);
            console.error(`   Execute manualmente: db.alunos.updateMany({turma: '${TEMP_TOKEN}'}, {$set: {turma: '${TURMA_B}'}})`);
            process.exit(1);
        }

        console.log('\n🎉 Swap concluído com sucesso! Nenhum aluno ficou com valor temporário.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro durante o swap:', error.message);

        // Tenta reverter a transação se a sessão tiver sido iniciada
        if (session) {
            try {
                await session.abortTransaction();
                session.endSession();
                console.log('↩️  Transação revertida — banco permanece sem alterações.');
            } catch (_) {
                console.log('⚠️  Não foi possível reverter (sessão já encerrada ou não iniciada).');
            }
        }

        // Verifica se sobrou TEMP_TOKEN
        try {
            const orphans = await User.countDocuments({ turma: TEMP_TOKEN });
            if (orphans > 0) {
                console.error(`\n🚨 ${orphans} alunos estão com turma '${TEMP_TOKEN}' — corrija manualmente!`);
                console.error(`   db.alunos.updateMany({turma:'${TEMP_TOKEN}'},{$set:{turma:'${TURMA_A}'}})`);
            }
        } catch (_) {}

        process.exit(1);
    }
}

swapTurmas();
