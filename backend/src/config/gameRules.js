// backend/src/config/gameRules.js

const RANKS = [
    { id: 'INICIANTE', name: "Iniciante", min: 0, color: "text-slate-500", border: "border-slate-500" },
    { id: 'BRONZE', name: "🥉 Bronze", min: 1000, color: "text-orange-700", border: "border-orange-800" },
    { id: 'PRATA', name: "🥈 Prata", min: 1500, color: "text-slate-400", border: "border-slate-500" },
    { id: 'OURO', name: "🥇 Ouro", min: 2000, color: "text-yellow-400", border: "border-yellow-600" },
    { id: 'DIAMANTE', name: "💎 Diamante", min: 2500, color: "text-cyan-400", border: "border-cyan-600" },
    { id: 'EPICO', name: "👑 Épico", min: 3000, color: "text-purple-500", border: "border-purple-700" },
    { id: 'LENDARIO', name: "🌟 Épico Lendário", min: 5000, color: "text-fuchsia-500", border: "border-fuchsia-700" },
    { id: 'SUPREMO', name: "🔥 Épico Supremo", min: 10000, color: "text-red-500", border: "border-red-700" },
    { id: 'MITOLOGICO', name: "🔱 Épico Mitológico", min: 20000, color: "text-rose-900", border: "border-rose-950" },
    { id: 'SOBERANO', name: "⚡ Épico Soberano", min: 50000, color: "text-yellow-200", border: "border-yellow-100" }
];

// Mapeamento de Skills por Rank (IDs fixos)
const RANK_SKILLS = {
    'BRONZE': ['VIP_CARD', 'AULA_VIP', 'GRUPO_VIP'],
    'PRATA': ['BAU_ENIGMAS', 'AVALIACOES_RANK', 'AJUDA_DIVINA'], // Acumula Bronze? Se sim, a lógica de sync trata.
    'OURO': ['PRESENTE_ETE', 'PRESENTE_TACA', 'PRESENTE_AC', 'PC_GOLD'],
    'DIAMANTE': ['PLANO_BRUXO', 'PLANO_GAMIFICADO', 'MINA_DIAMANTE', 'SORTEIO_DIAMANTE'],
    'EPICO': ['TREINAMENTO', 'REDUCAO_DANO', 'AUREA_SABER', 'BRINDE_EPICO', 'INVISIBILIDADE_1'],
    'LENDARIO': ['CONVERTER_PC', 'IMUNIDADE_ATRASO', 'REDUCAO_DANO_2', 'GIL_HONORARIO', 'INVISIBILIDADE_2', 'ESSENCIA_SABER', 'TREINAMENTO_2'],
    'SUPREMO': ['AJUDA_SUPREMA', 'SORTUDO', 'IMORTAL', 'RENOMADO', 'RESSUSCITAR', 'ARREMATADOR'],
    'MITOLOGICO': ['AJUDA_ILIMITADA', 'CAMPEAO', 'REDUCAO_ABSOLUTA', 'DOBRADOR', 'CONCEDER_RESSUSCITAR', 'PRESENTE_DEUSES', 'TRANSF_CONHECIMENTO', 'CIRCULO_CURA'],
    'SOBERANO': ['AJUDA_SOBERANA', 'ARREMATADOR_75', 'GILBET_PREMIUM', 'TRIPLICADOR', 'PODER_FENIX', 'ROLETADA_GRATIS', 'ESSENCIA_FENIX', 'CANALIZADOR_MANA', 'PEDRA_FENIX']
};

const VALID_RARITIES = RANKS.map(r => r.id).concat(['EVENTO', 'SKILL']);

// Helper para descobrir o rank exigido para uma skill
const getRequiredRankForSkill = (skillCode) => {
    for (const [rankId, skills] of Object.entries(RANK_SKILLS)) {
        if (skills.includes(skillCode)) {
            return RANKS.find(r => r.id === rankId);
        }
    }
    return null;
};

// Helper para traduzir raridade de item em badge de acesso (AC_)
const getAccessBadgeForRank = (raridade) => {
    if (!raridade) return null;
    
    // Normalização agressiva: Maiúsculas, Sem Acentos, Sem Espaços extras
    const r = raridade.toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .trim();
    
    // Ordem de precedência: do mais forte para o mais fraco
    // Assim "Épico Lendário" retorna AC_LENDARIO e não AC_EPICO
    if (r.includes('SOBERANO')) return 'AC_SOBERANO';
    if (r.includes('MITOLOGICO') || r.includes('MITHOLOGICO')) return 'AC_MITOLOGICO';
    if (r.includes('SUPREMO')) return 'AC_SUPREMO';
    if (r.includes('LENDARIO')) return 'AC_LENDARIO';
    if (r.includes('EPICO')) return 'AC_EPICO';
    if (r.includes('DIAMANTE')) return 'AC_DIAMANTE';
    if (r.includes('OURO') || r.includes('GOLD')) return 'AC_OURO';
    if (r.includes('PRATA') || r.includes('SILVER')) return 'AC_PRATA';
    if (r.includes('BRONZE')) return 'AC_BRONZE';
    
    return null;
};

module.exports = { RANKS, RANK_SKILLS, VALID_RARITIES, getRequiredRankForSkill, getAccessBadgeForRank };