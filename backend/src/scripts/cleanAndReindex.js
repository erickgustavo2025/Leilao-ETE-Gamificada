// backend/src/scripts/cleanAndReindex.js
const mongoose = require('mongoose');
const path = require('path');
const DocumentEmbedding = require('../models/DocumentEmbedding');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Importa a lógica de processamento diretamente — sem execSync, sem dois connects.
// O processDocuments.js exporta main() para ser chamado como módulo.
// Se você precisar rodar cleanAndReindex standalone, ele encapsula tudo aqui.

async function cleanAndReindex() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🧹  CLEAN & REINDEX — Oráculo GIL     ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    const isInternalCall = mongoose.connection.readyState === 1;

    try {
        if (!isInternalCall) {
            console.log('🔌 Conectando ao MongoDB...');
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Conectado.\n');
        }

        console.log('🗑️  Limpando coleção de embeddings...');
        const { deletedCount } = await DocumentEmbedding.deleteMany({});
        console.log(`✅ ${deletedCount} documentos removidos.\n`);

        // ── FASE 2: RE-INDEXAÇÃO ──────────────────────────────────────
        console.log('🚀 Iniciando re-indexação de documentos (Questões, PDFs, Ementas)...');
        const { processAll } = require('./processDocuments');
        await processAll();

        // ── FASE 3: SUMMARY ───────────────────────────────────────────
        const total = await DocumentEmbedding.countDocuments();
        console.log('');
        console.log('╔══════════════════════════════════════════╗');
        console.log(`║  ✨ RAG ATUALIZADO! ${String(total).padStart(4)} chunks prontos. ║`);
        console.log('║                                          ║');
        console.log('║  🤖 Oráculo GIL aprendeu tudo de novo.   ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');

    } catch (error) {
        console.error('\n❌ Erro durante o processo:', error.message);
        if (!isInternalCall) throw error;
    } finally {
        if (!isInternalCall) {
            await mongoose.disconnect();
            console.log('🔌 Desconectado do MongoDB.');
        }
    }
}

// Execução standalone
if (require.main === module) {
    cleanAndReindex().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { cleanAndReindex };
