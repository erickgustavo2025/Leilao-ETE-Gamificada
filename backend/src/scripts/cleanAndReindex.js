// backend/src/scripts/cleanAndReindex.js
const mongoose = require('mongoose');
const DocumentEmbedding = require('../models/DocumentEmbedding');
const { execSync } = require('child_process');
require('dotenv').config();

async function cleanAndReindex() {
    console.log('🧹 Iniciando limpeza da coleção de embeddings...');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Conectado ao MongoDB.');

        // Deleta todos os documentos da coleção
        const result = await DocumentEmbedding.deleteMany({});
        console.log(`✅ Coleção limpa! Documentos removidos: ${result.deletedCount}`);

        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB para iniciar o script de indexação.');

        console.log('🚀 Iniciando re-indexação de documentos (processDocuments.js)...');
        // Executa o script de processamento de documentos original
        // Certifique-se de que o processDocuments.js está configurado para gemini-embedding-001
        execSync('node src/scripts/processDocuments.js', { stdio: 'inherit' });

        console.log('\n✨ Processo de limpeza e re-indexação concluído com sucesso!');
        console.log('⚠️ IMPORTANTE: O gemini-embedding-001 possui 768 dimensões.');
        console.log('⚠️ Se você estiver usando MongoDB Atlas Vector Search, certifique-se de que o índice "vector_index" está configurado para 768 dimensões.');
    } catch (error) {
        console.error('❌ Erro durante o processo:', error.message);
        process.exit(1);
    }
}

cleanAndReindex();
