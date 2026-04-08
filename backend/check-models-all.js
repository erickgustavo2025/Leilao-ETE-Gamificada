require('dotenv').config();

async function checkAllKeys() {
  const keys = Object.keys(process.env)
    .filter(k => k.startsWith('GEMINI_KEY') || k === 'GEMINI_API_KEY')
    .map(k => ({ name: k, key: process.env[k] }))
    .filter(k => k.key);

  if (keys.length === 0) {
    console.error("❌ Nenhuma chave GEMINI encontrada no .env");
    return;
  }

  console.log(`🔍 Iniciando auditoria em ${keys.length} chaves...\n`);

  const modelInventory = {}; // { modelName: count }
  
  for (const item of keys) {
    const suffix = item.key.slice(-4);
    console.log(`🔑 Testando ${item.name} (...${suffix})`);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${item.key}`);
      const data = await response.json();
      
      if (data.error) {
        console.error(`   ❌ Erro na chave: ${data.error.message}`);
        continue;
      }

      const available = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace('models/', ''));

      console.log(`   ✅ ${available.length} modelos encontrados.`);
      
      available.forEach(m => {
        modelInventory[m] = (modelInventory[m] || 0) + 1;
      });

    } catch (e) {
      console.error(`   ❌ Falha na requisição: ${e.message}`);
    }
    console.log("-------------------------------------------------");
  }

  console.log("\n📊 RELATÓRIO DE DISPONIBILIDADE (Interseção):");
  const commonModels = Object.entries(modelInventory)
    .filter(([_, count]) => count === keys.length)
    .map(([name, _]) => name);

  if (commonModels.length > 0) {
    console.log("✨ Modelos disponíveis em TODAS as chaves:");
    commonModels.forEach(m => console.log(`   - ${m}`));
  } else {
    console.warn("⚠️ Nenhum modelo é comum a todas as chaves.");
    console.log("Modelos mais frequentes:");
    Object.entries(modelInventory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([name, count]) => console.log(`   - ${name} (${count}/${keys.length} chaves)`));
  }
}

checkAllKeys();
