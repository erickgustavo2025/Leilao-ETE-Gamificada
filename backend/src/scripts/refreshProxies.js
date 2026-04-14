const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * IP SHIELD AUTO-REFRESHER V1.1 (PREMIUM SUPPORT)
 * Script para automatizar a rotação de proxies no .env
 */

const ENV_PATH = path.join(__dirname, '../../../.env');
const PREMIUM_TXT_PATH = path.join(__dirname, '../../../proxyscrape_premium_http_proxies.txt');
const FREE_TXT_PATH = path.join(__dirname, '../../../http_proxies.txt');
const PROXY_LIMIT = 25; // Quantidade sugerida para o .env

async function refreshProxies() {
  console.log('🚀 Iniciando atualização do IP Shield (Versão Premium)...');
  let proxies = [];

  // TENTATIVA 1: Procurar Proxies Premium (Prioridade Máxima)
  if (fs.existsSync(PREMIUM_TXT_PATH)) {
    console.log('💎 Arquivo PREMIUM detectado. Processando IPs...');
    const content = fs.readFileSync(PREMIUM_TXT_PATH, 'utf-8');
    proxies = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(p => p.startsWith('http') ? p : `http://${p}`);
  } 
  // TENTATIVA 2: Fallback para Proxies Free locais
  else if (fs.existsSync(FREE_TXT_PATH)) {
    console.log('📂 Arquivo http_proxies.txt (Free) detectado.');
    const content = fs.readFileSync(FREE_TXT_PATH, 'utf-8');
    proxies = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(p => p.startsWith('http') ? p : `http://${p}`);
  }
  // TENTATIVA 3: API do ProxyScrape
  else {
    console.log('🌐 Buscando proxies frescos via API do ProxyScrape...');
    try {
      const apiUrl = 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all';
      const response = await axios.get(apiUrl);
      proxies = response.data.split('\r\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(p => p.startsWith('http') ? p : `http://${p}`);
    } catch (error) {
      console.error('❌ Erro ao acessar a API do ProxyScrape:', error.message);
    }
  }

  if (proxies.length === 0) {
    console.error('❌ Falha crítica: Nenhum proxy encontrado.');
    process.exit(1);
  }

  // EMBARALHAR E SELECIONAR
  console.log(`✅ ${proxies.length} proxies registrados. Sorteando ${Math.min(PROXY_LIMIT, proxies.length)}...`);
  const selectedProxies = proxies
    .sort(() => Math.random() - 0.5)
    .slice(0, PROXY_LIMIT);

  const proxyString = selectedProxies.join(',');

  // ATUALIZAR O .ENV
  try {
    if (!fs.existsSync(ENV_PATH)) {
      console.error('❌ Arquivo .env não encontrado!');
      return;
    }

    let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const proxyRegex = /AI_PROXIES=(['"]?)(.*?)\1/g;

    if (proxyRegex.test(envContent)) {
      envContent = envContent.replace(proxyRegex, `AI_PROXIES="${proxyString}"`);
    } else {
      envContent += `\nAI_PROXIES="${proxyString}"\n`;
    }

    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
    console.log('💎 IP SHIELD ATUALIZADO COM PROXIES PREMIUM! 🛡️✨');
    console.log(`📡 Total em rotação: ${selectedProxies.length}`);

  } catch (error) {
    console.error('❌ Erro ao escrever no .env:', error.message);
  }
}

refreshProxies();
