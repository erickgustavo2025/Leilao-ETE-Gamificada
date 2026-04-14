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

// Estado de cooldown por chave
const cooldowns = new Array(keys.length).fill(0);
let currentIndex = 0;

function getNextAvailableIndex() {
  const now = Date.now();
  for (let i = 0; i < keys.length; i++) {
    const idx = (currentIndex + i) % keys.length;
    if (cooldowns[idx] <= now) {
      currentIndex = (idx + 1) % keys.length;
      return idx;
    }
  }
  return null;
}

/**
 * Retorna a próxima chave disponível e seu índice.
 */
function getAvailableKey() {
  const index = getNextAvailableIndex();
  return index !== null ? { key: keys[index], index } : null;
}

/**
 * Marca uma chave como esgotada (429).
 */
function markKeyAsQuoted(index) {
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos de descanso
  if (index >= 0 && index < cooldowns.length) {
    const keySuffix = keys[index].slice(-4);
    console.warn(`🚨 [Gemini] Chave ${index + 1} (...${keySuffix}) em rate limit. Cooldown de 5 min.`);
    cooldowns[index] = Date.now() + COOLDOWN_MS;
  }
}

/**
 * Gera embedding com rotação automática.
 */
async function embedContent(text) {
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyData = getAvailableKey();
    if (!keyData) throw new Error("Todas as chaves Gemini em cooldown.");

    try {
      const genAI = new GoogleGenerativeAI(keyData.key);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(text);
      // 🔥 Força 768 dimensões (Corte técnico para compatibilidade com o Atlas)
      return result.embedding.values.slice(0, 768);
    } catch (err) {
      if (err?.status === 429 || err?.response?.status === 429) {
        markKeyAsQuoted(keyData.index);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Todas as chaves falharam ao gerar embedding.");
}

module.exports = { embedContent, getAvailableKey, markKeyAsQuoted };