// backend/src/utils/economyRules.js

// Taxa fixa para transferências (PIX) - Quem envia paga isso + o valor
const PIX_FEE = 800;

// Margem de tolerância para trocas justas (Trade) - 20%
// Ex: Se o Item vale 1000, o aluno pode pagar entre 800 e 1200.
const TRADE_TOLERANCE_PERCENT = 0.20;

/**
 * Detecta o ano escolar baseado na string da turma.
 * Ex: "1B ADM" -> 1
 * Ex: "2A LOG" -> 2
 * Ex: "3A DS" -> 3
 */
const getYearFromClass = (turma) => {
    if (!turma) return 1; // Segurança: assume 1º ano se não tiver turma definida

    // Pega o primeiro caractere da turma e tenta converter pra número
    const yearChar = turma.trim().charAt(0);
    const year = parseInt(yearChar);

    // Se der erro (ex: turma "Especial"), assume 1º ano por segurança
    return isNaN(year) ? 1 : year;
};

/**
 * Retorna o limite anual de recebimento (PC$)
 * Regras do Oloko:
 * 1º Ano -> 400 PC$
 * 2º Ano -> 800 PC$
 * 3º Ano -> 1200 PC$
 */
const getAnnualLimit = (turma) => {
    const year = getYearFromClass(turma);

    switch (year) {
        case 1: return 400;
        case 2: return 800;
        case 3: return 1200;
        default: return 400; // Default restritivo
    }
};

module.exports = {
    PIX_FEE,
    TRADE_TOLERANCE_PERCENT,
    getAnnualLimit
};