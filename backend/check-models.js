require('dotenv').config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("⚠️ Chave API não encontrada!");
    return;
  }

  console.log("🔍 Consultando Panteão de Modelos do Google...\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    console.log("📊 MODELOS DE EMBEDDING (VETORIZAÇÃO):");
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes("embedContent")) {
        console.log(`✅ ${model.name.replace('models/', '')} | Dimensões: ${model.outputTokenLimit || 'Ver doc'}`);
      }
    });

    console.log("\n🤖 MODELOS DE CHAT (GERAÇÃO):");
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`✨ ${model.name.replace('models/', '')}`);
      }
    });

  } catch (error) {
    console.log("❌ Erro ao consultar a API:", error);
  }
}

checkModels();