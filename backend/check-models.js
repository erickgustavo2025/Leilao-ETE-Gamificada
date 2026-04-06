require('dotenv').config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("⚠️ Chave API não encontrada no .env!");
    return;
  }

  console.log("🔍 Consultando os servidores do Google...\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    console.log("🤖 Modelos de Texto disponíveis para a sua chave:");
    data.models.forEach(model => {
      // Filtra apenas os modelos que servem para gerar chat/texto
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`✅ ${model.name.replace('models/', '')}`);
      }
    });
  } catch (error) {
    console.log("❌ Erro ao consultar a API:", error);
  }
}

checkModels();