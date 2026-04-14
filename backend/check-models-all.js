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

  const chatInventory = {}; 
  const embedInventory = {};
  
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

      const chat = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace('models/', ''));

      const embed = data.models
        .filter(m => m.supportedGenerationMethods.includes("embedContent"))
        .map(m => m.name.replace('models/', ''));

      console.log(`   ✅ Chat: ${chat.length} | Embedding: ${embed.length}`);
      
      chat.forEach(m => chatInventory[m] = (chatInventory[m] || 0) + 1);
      embed.forEach(m => embedInventory[m] = (embedInventory[m] || 0) + 1);

    } catch (e) {
      console.error(`   ❌ Falha na requisição: ${e.message}`);
    }
    console.log("-------------------------------------------------");
  }

  const getCommon = (inv) => Object.entries(inv)
    .filter(([_, count]) => count === keys.length)
    .map(([name, _]) => name);

  const commonChat = getCommon(chatInventory);
  const commonEmbed = getCommon(embedInventory);

  console.log("\n📊 RELATÓRIO DE DISPONIBILIDADE (Interseção):");
  
  if (commonChat.length > 0) {
    console.log("🤖 Chat disponíveis em TODAS as chaves:");
    commonChat.forEach(m => console.log(`   - ${m}`));
  }

  if (commonEmbed.length > 0) {
    console.log("\n📐 Embedding disponíveis em TODAS as chaves:");
    commonEmbed.forEach(m => console.log(`   - ${m}`));
  }
}

checkAllKeys();
