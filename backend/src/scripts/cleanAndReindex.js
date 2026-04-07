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

    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI não encontrado no .env');
        process.exit(1);
    }

    const hasAnyKey = process.env.GEMINI_API_KEY ||
        Object.keys(process.env).some(k => k.match(/^GEMINI_KEY_\d+$/));

    if (!hasAnyKey) {
        console.error('❌ Nenhuma chave Gemini encontrada. Configure GEMINI_KEY_1 (ou GEMINI_API_KEY) no .env');
        process.exit(1);
    }

    try {
        // ── FASE 1: LIMPEZA ───────────────────────────────────────────
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado.\n');

        console.log('🗑️  Limpando coleção de embeddings...');
        const { deletedCount } = await DocumentEmbedding.deleteMany({});
        console.log(`✅ ${deletedCount} documentos removidos.\n`);

        // ── FASE 2: RE-INDEXAÇÃO ──────────────────────────────────────
        // Reutiliza a conexão existente — não desconecta para reconectar.
        // O processDocuments.js exporta processAll() para uso como módulo.
        console.log('🚀 Iniciando re-indexação...');
        console.log('   Modelo de embedding: gemini-embedding-001 (768 dims)');
        console.log('   Rotação de chaves: ativa\n');

        // Importação dinâmica para garantir que o .env já foi carregado
        const { processAll } = require('./processDocuments');
        await processAll();

        // ── FASE 3: SUMMARY ───────────────────────────────────────────
        const total = await DocumentEmbedding.countDocuments();
        console.log('');
        console.log('╔══════════════════════════════════════════╗');
        console.log(`║  ✨ Concluído! ${String(total).padStart(4)} chunks indexados.    ║`);
        console.log('║                                          ║');
        console.log('║  ⚠️  Atlas Vector Search:                ║');
        console.log('║     Índice "vector_index" = 768 dims     ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');

    } catch (error) {
        console.error('\n❌ Erro durante o processo:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB.');
    }
}

cleanAndReindex();
