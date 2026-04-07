// backend/src/utils/geminiKeyManager.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lê todas as chaves do .env: GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3...
const keys = Object.keys(process.env)
  .filter(k => k.match(/^GEMINI_KEY_\d+$/))
  .sort()
  .map(k => process.env[k])
  .filter(Boolean);

if (keys.length === 0) {
  // Fallback para a chave legada GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  else throw new Error("Nenhuma chave Gemini encontrada no .env");
}

// Estado de cooldown por chave (não reinicia com o servidor, mas serve pra sessão)
const cooldowns = new Array(keys.length).fill(0); // timestamp até quando está bloqueada
let currentIndex = 0;

function getNextAvailableIndex() {
  const now = Date.now();
  // Tenta cada chave começando pela atual, procura a primeira disponível
  for (let i = 0; i < keys.length; i++) {
    const idx = (currentIndex + i) % keys.length;
    if (cooldowns[idx] <= now) {
      currentIndex = (idx + 1) % keys.length; // avança para próxima chamada
      return idx;
    }
  }
  return null; // Todas em cooldown
}

/**
 * Gera embedding com rotação automática de chave e retry em 429.
 * @param {string} text - Texto a embeddar
 * @returns {Promise<number[]>} - Vetor de embedding
 */
async function embedContent(text) {
  const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora de cooldown quando bate RPD

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = getNextAvailableIndex();

    if (idx === null) {
      throw new Error("Todas as chaves Gemini estão em cooldown. Tente mais tarde.");
    }

    try {
      const genAI = new GoogleGenerativeAI(keys[idx]);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;

    } catch (err) {
      const status = err?.status || err?.response?.status;

      if (status === 429 || status === 503) {
        // Coloca a chave em cooldown e tenta a próxima
        console.warn(`⚠️ [Gemini] Chave ${idx + 1} em rate limit. Cooldown de 1h. Tentando próxima...`);
        cooldowns[idx] = Date.now() + COOLDOWN_MS;
        // Continua o loop para tentar a próxima chave
      } else {
        // Erro diferente (auth inválida, rede) — não tenta outra chave
        throw err;
      }
    }
  }

  throw new Error("Todas as chaves Gemini falharam com rate limit.");
}

module.exports = { embedContent };