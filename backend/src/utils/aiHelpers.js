// backend/src/utils/aiHelpers.js

/**
 * Classifica a intenção da pergunta do aluno para otimizar o processamento e o custo.
 * @param {String} pergunta 
 * @param {String} paginaOrigem 
 * @returns {String} MODO (PEDAGOGICO, ECONOMIA, SUPORTE, CONSULTOR)
 */
const detectMode = (pergunta, paginaOrigem = "") => {
    const p = pergunta.toLowerCase();
    
    // Palavras-chave de Economia / Investimentos
    const econKeywords = ['pc$', 'saldo', 'invest', 'ação', 'ações', 'crypto', 'banco', 'empréstimo', 'juros', 'dividendos', 'startup', 'venda', 'compra', 'mercado', 'pix'];
    if (econKeywords.some(k => p.includes(k)) || paginaOrigem.includes('investe') || paginaOrigem.includes('banco')) {
        return "ECONOMIA";
    }

    // Palavras-chave de Suporte / Interface
    const supportKeywords = ['erro', 'bug', 'ajuda', 'como funciona', 'não consigo', 'esqueci', 'onde fica', 'perdi'];
    if (supportKeywords.some(k => p.includes(k))) {
        return "SUPORTE";
    }

    // Padrão: Pedagógico (Contexto de Aula)
    return "PEDAGOGICO";
};

/**
 * Gera um resumo formatado das ementas para o prompt do sistema
 * @param {Array} ementaChunks 
 */
const formatEmentaContext = (ementaChunks) => {
    if (!ementaChunks || ementaChunks.length === 0) return "";
    
    return "\n\n📌 DIRETRIZES DA EMENTA DO PROFESSOR (O que deve ser ensinado agora):\n" + 
           ementaChunks.map(c => `- ${c.chunkText}`).join("\n");
};

module.exports = {
    detectMode,
    formatEmentaContext
};
