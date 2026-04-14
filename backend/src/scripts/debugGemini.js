const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
    console.log('🧪 [DEBUG-GEMINI] Verificando chaves...\n');
    
    const keys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(Boolean);

    const modelsToTest = ["gemini-1.5-flash", "gemini-pro"];

    for (let i = 0; i < keys.length; i++) {
        console.log(`🔑 Testando Chave ${i + 1}: ${keys[i].substring(0, 10)}...`);
        
        // Teste de Embedding (que sabemos que funcionou no reindex)
        try {
            const genAI = new GoogleGenerativeAI(keys[i]);
            const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            await embModel.embedContent("Teste");
            console.log(`   ✅ SUCESSO! Embeddings funcionando.`);
        } catch (e) {
            console.log(`   ❌ FALHA (Embedding): ${e.message}`);
        }

        // Teste de Conversa
        for (const modelName of modelsToTest) {
            try {
                const genAI = new GoogleGenerativeAI(keys[i]);
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Oi");
                console.log(`   ✅ SUCESSO! Chat (${modelName}) funcionando.`);
                break;
            } catch (error) {
                console.log(`   ❌ FALHA (Chat ${modelName}): ${error.message}`);
            }
        }
        console.log('');
    }
}

listModels();
