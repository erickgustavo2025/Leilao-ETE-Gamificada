// backend/src/scripts/createVectorIndex.js
const axios = require('axios');
require('dotenv').config();

/**
 * Script para criar o índice vetorial no MongoDB Atlas via API
 * Nota: Requer API Key do Atlas com permissões de Project Owner.
 * Se não tiver, o índice deve ser criado manualmente no painel do Atlas.
 */

const ATLAS_API_BASE = 'https://cloud.mongodb.com/api/atlas/v1.0';
const PROJECT_ID = process.env.ATLAS_PROJECT_ID;
const CLUSTER_NAME = process.env.ATLAS_CLUSTER_NAME;

const indexDefinition = {
  name: "vector_index",
  type: "vectorSearch",
  collectionName: "documentembeddings",
  database: "test", // Ajustar para o nome do seu banco
  mappings: {
    dynamic: true,
    fields: {
      embedding: {
        dimensions: 768, // text-embedding-004 usa 768 dimensões
        similarity: "cosine",
        type: "knnVector"
      }
    }
  }
};

async function createIndex() {
  console.log('🚀 Iniciando criação de índice vetorial...');
  console.log('⚠️ Certifique-se de que as variáveis ATLAS_PROJECT_ID e ATLAS_CLUSTER_NAME estão no .env');
  
  // Como este script depende de chaves de API do Atlas que podem não estar presentes,
  // ele serve mais como documentação da estrutura do índice.
  console.log('\nESTRUTURA DO ÍNDICE (Copie para o painel do Atlas se necessário):');
  console.log(JSON.stringify(indexDefinition, null, 2));
  
  console.log('\n💡 Para criar manualmente:');
  console.log('1. Vá em Search -> Create Search Index');
  console.log('2. Selecione "JSON Editor"');
  console.log('3. Selecione a coleção "documentembeddings"');
  console.log('4. Cole o JSON acima.');
}

createIndex();
