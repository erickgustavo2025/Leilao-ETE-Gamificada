const { getAccessBadgeForRank } = require('../config/gameRules');

const testCases = [
    { input: 'Bronze', expected: 'AC_BRONZE' },
    { input: 'Épico', expected: 'AC_EPICO' },
    { input: 'Épico Lendário', expected: 'AC_LENDARIO' },
    { input: 'Épico Supremo', expected: 'AC_SUPREMO' },
    { input: '🔱 Épico Mitológico', expected: 'AC_MITOLOGICO' },
    { input: '⚡ Épico Soberano', expected: 'AC_SOBERANO' },
    { input: 'Lendário', expected: 'AC_LENDARIO' },
    { input: 'OURO', expected: 'AC_OURO' },
    { input: 'Comum', expected: null },
    { input: 'Evento', expected: null }
];

console.log("🧪 Iniciando Teste de Hierarquia de Mérito (9 Níveis)...");
let success = true;

testCases.forEach(tc => {
    const result = getAccessBadgeForRank(tc.input);
    if (result === tc.expected) {
        console.log(`✅ [PASS] Input: "${tc.input}" -> Result: ${result}`);
    } else {
        console.log(`❌ [FAIL] Input: "${tc.input}" -> Expected: ${tc.expected}, Got: ${result}`);
        success = false;
    }
});

if (success) {
    console.log("\n✨ TODOS OS TESTES PASSARAM! A hierarquia está blindada até o Soberano.");
} else {
    console.log("\n⚠️ ALGUNS TESTES FALHARAM. Verifique a lógica.");
}
