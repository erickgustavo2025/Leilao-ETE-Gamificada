// ARQUIVO: frontend/src/pages/dashboard/Regulations.tsx
// ─────────────────────────────────────────────────────
// TODO BACKEND: Conectar as funções marcadas com 🔌
// ─────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ChevronDown, CheckCircle2, XCircle,
    Shield, Zap, Lock, Search, User, Scroll,
     Star, Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRank } from '../../utils/rankHelper';
import { cn } from '../../utils/cn';

// ─────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────
interface TeacherPower {
    skillCode: string;
    name: string;
    description: string;
    type: 'ativa' | 'passiva';
    usesPerTrimester?: number;  // null = passiva permanente
    rankRequired: string;
    authorized: boolean;        // Se o professor liberou ou não
}

interface Teacher {
    id: string;
    nome: string;
    disciplina: string;
    avatar?: string;
    powers: TeacherPower[];
}

// ─────────────────────────────────────────────────────
// DADOS MOCK — professores e poderes
// 🔌 BACKEND: GET /api/regulations/teachers  → lista de professores
// 🔌 BACKEND: GET /api/regulations/:teacherId → poderes autorizados
// ─────────────────────────────────────────────────────
const MOCK_TEACHERS: Teacher[] = [
    {
        id: 't1', nome: 'Prof. Gildásio', disciplina: 'Programação Web',
        powers: [
            { skillCode: 'AJUDA_DIVINA',   name: 'Ajuda Divina',       type: 'ativa',   usesPerTrimester: 3, rankRequired: 'PRATA',    authorized: true,  description: 'Permite consultar material de apoio durante uma prova.' },
            { skillCode: 'INVISIBILIDADE_1',name: 'Invisibilidade',     type: 'ativa',   usesPerTrimester: 2, rankRequired: 'EPICO',    authorized: true,  description: 'Falta numa aula sem penalidade de pontos.' },
            { skillCode: 'REDUCAO_DANO',   name: 'Redução de Dano',    type: 'passiva', rankRequired: 'EPICO',    authorized: false, description: 'Reduz em 50% a perda de PC$ em punições leves.' },
            { skillCode: 'VIP_CARD',       name: 'VIP Card',           type: 'passiva', rankRequired: 'BRONZE',   authorized: true,  description: 'Acesso ao grupo VIP de avisos antecipados da disciplina.' },
            { skillCode: 'AUREA_SABER',    name: 'Aura do Saber',      type: 'ativa',   usesPerTrimester: 1, rankRequired: 'EPICO',    authorized: true,  description: 'Dobra o XP ganho em uma atividade da disciplina.' },
            { skillCode: 'TREINAMENTO',    name: 'Treinamento',        type: 'ativa',   usesPerTrimester: 3, rankRequired: 'EPICO',    authorized: false, description: 'Treina um colega — ambos ganham XP bônus na próxima atividade.' },
            { skillCode: 'PLANO_BRUXO',    name: 'Plano Bruxo',        type: 'passiva', rankRequired: 'DIAMANTE', authorized: true,  description: 'Acesso ao plano de estudos personalizado da disciplina.' },
        ],
    },
    {
        id: 't2', nome: 'Profa. Ana Lima', disciplina: 'Matemática Aplicada',
        powers: [
            { skillCode: 'AJUDA_DIVINA',   name: 'Ajuda Divina',       type: 'ativa',   usesPerTrimester: 1, rankRequired: 'PRATA',    authorized: false, description: 'Permite consultar material de apoio durante uma prova.' },
            { skillCode: 'VIP_CARD',       name: 'VIP Card',           type: 'passiva', rankRequired: 'BRONZE',   authorized: true,  description: 'Acesso ao grupo VIP com resolução comentada de exercícios.' },
            { skillCode: 'REDUCAO_DANO',   name: 'Redução de Dano',    type: 'passiva', rankRequired: 'EPICO',    authorized: true,  description: 'Reduz em 50% a perda de PC$ em punições leves.' },
            { skillCode: 'AULA_VIP',       name: 'Aula VIP',           type: 'ativa',   usesPerTrimester: 2, rankRequired: 'BRONZE',   authorized: true,  description: 'Solicitar aula de reforço individual após o horário.' },
            { skillCode: 'BAU_ENIGMAS',    name: 'Baú de Enigmas',     type: 'ativa',   usesPerTrimester: 3, rankRequired: 'PRATA',    authorized: true,  description: 'Acessa uma lista de problemas bônus para ganhar PC$ extra.' },
        ],
    },
    {
        id: 't3', nome: 'Prof. Marcus', disciplina: 'Inglês Técnico',
        powers: [
            { skillCode: 'AJUDA_DIVINA',   name: 'Ajuda Divina',       type: 'ativa',   usesPerTrimester: 2, rankRequired: 'PRATA',    authorized: true,  description: 'Uso do dicionário físico em avaliação.' },
            { skillCode: 'VIP_CARD',       name: 'VIP Card',           type: 'passiva', rankRequired: 'BRONZE',   authorized: true,  description: 'Acesso ao grupo de conversação em inglês.' },
            { skillCode: 'TREINAMENTO',    name: 'Treinamento',        type: 'ativa',   usesPerTrimester: 3, rankRequired: 'EPICO',    authorized: true,  description: 'Faz parceria com outro aluno para atividade colaborativa valendo XP.' },
            { skillCode: 'REDUCAO_DANO',   name: 'Redução de Dano',    type: 'passiva', rankRequired: 'EPICO',    authorized: false, description: 'Reduz em 50% a perda de PC$ em punições leves.' },
        ],
    },
];

// ─────────────────────────────────────────────────────
// CONFIG VISUAL DE RANK
// ─────────────────────────────────────────────────────
const RANK_STYLE: Record<string, { color: string; border: string; glow: string }> = {
    INICIANTE: { color: 'text-slate-400',   border: 'border-slate-600',   glow: '#94a3b8' },
    BRONZE:    { color: 'text-orange-400',  border: 'border-orange-600',  glow: '#c2410c' },
    PRATA:     { color: 'text-slate-300',   border: 'border-slate-400',   glow: '#94a3b8' },
    OURO:      { color: 'text-yellow-400',  border: 'border-yellow-500',  glow: '#eab308' },
    DIAMANTE:  { color: 'text-cyan-400',    border: 'border-cyan-500',    glow: '#06b6d4' },
    EPICO:     { color: 'text-purple-400',  border: 'border-purple-500',  glow: '#a855f7' },
    LENDARIO:  { color: 'text-fuchsia-400', border: 'border-fuchsia-500', glow: '#d946ef' },
    SUPREMO:   { color: 'text-red-400',     border: 'border-red-500',     glow: '#ef4444' },
    MITOLOGICO:{ color: 'text-rose-400',    border: 'border-rose-500',    glow: '#f43f5e' },
    SOBERANO:  { color: 'text-yellow-200',  border: 'border-yellow-200',  glow: '#fefce8' },
};

// ─────────────────────────────────────────────────────
// SUB-COMPONENTE: Card de Poder
// ─────────────────────────────────────────────────────
function PowerCard({
    power, userRankIndex, rankIndex, delay,
}: {
    power: TeacherPower;
    userRankIndex: number;
    rankIndex: number;
    delay: number;
}) {
    const [showDetail, setShowDetail] = useState(false);
    const rs = RANK_STYLE[power.rankRequired] || RANK_STYLE.INICIANTE;
    const isRankOk = userRankIndex >= rankIndex;
    const isFullUnlocked = isRankOk && power.authorized;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', damping: 22 }}
            className={cn(
                'rounded-xl border overflow-hidden transition-all',
                isFullUnlocked  ? `${rs.border} bg-[#060620]` :
                !power.authorized ? 'border-slate-800 bg-[#060615] opacity-55' :
                                    'border-slate-700/50 bg-[#060615] opacity-70',
            )}
            style={{ boxShadow: isFullUnlocked ? `0 0 12px ${rs.glow}20` : undefined }}
        >
            <div className="p-3 flex items-center gap-3">
                {/* Tipo ícone */}
                <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                    isFullUnlocked
                        ? `${rs.border} bg-black/40`
                        : 'border-slate-800 bg-black/30'
                )}>
                    {isFullUnlocked
                        ? (power.type === 'ativa' ? <Zap size={18} className={rs.color} /> : <Shield size={18} className={rs.color} />)
                        : <Lock size={16} className="text-slate-700" />
                    }
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* COM ACENTO → font-vt323 */}
                        <span className={cn(
                            'font-vt323 text-lg leading-none',
                            isFullUnlocked ? 'text-white' : 'text-slate-600'
                        )}>
                            {power.name}
                        </span>
                        {/* SEM ACENTO → font-press */}
                        <span className={cn(
                            'px-1.5 py-0.5 rounded border font-press text-[7px]',
                            power.type === 'ativa'
                                ? 'border-blue-500/40 text-blue-400 bg-blue-900/20'
                                : 'border-green-500/40 text-green-400 bg-green-900/20'
                        )}>
                            {power.type === 'ativa' ? 'ATIVA' : 'PASSIVA'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className={cn('font-press text-[8px]', rs.color)}>{power.rankRequired}</span>
                        {power.type === 'ativa' && power.usesPerTrimester && (
                            <span className="font-mono text-[9px] text-slate-500">{power.usesPerTrimester}x/trim.</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {power.authorized
                        ? <CheckCircle2 size={15} className="text-green-400" />
                        : <XCircle size={15} className="text-slate-700" />
                    }
                    <button
                        onClick={() => setShowDetail(!showDetail)}
                        className="p-1 rounded hover:bg-white/10 text-slate-600 hover:text-white transition-colors"
                    >
                        <Info size={13} />
                    </button>
                </div>
            </div>

            {/* Detalhe expansível */}
            <AnimatePresence>
                {showDetail && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 border-t border-white/5 pt-2">
                            <p className="font-poppins text-xs text-slate-400 leading-relaxed">{power.description}</p>
                            {!power.authorized && (
                                <p className="font-press text-[8px] text-red-400/70 mt-2">
                                    NAO AUTORIZADO NESTA DISCIPLINA
                                </p>
                            )}
                            {!isRankOk && (
                                <p className="font-press text-[8px] text-orange-400/70 mt-2">
                                    RANK INSUFICIENTE
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────
export function Regulations() {
    const { user, ranks } = useAuth();
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterAuth, setFilterAuth] = useState<'all' | 'authorized' | 'blocked'>('all');
    const [selectorOpen, setSelectorOpen] = useState(false);

    const userPoints = user?.maxPcAchieved || 0;
    const currentRank = calculateRank(userPoints, ranks);
    const userRankIndex = ranks.findIndex((r: any) => r.name?.toUpperCase() === currentRank?.name?.toUpperCase());

    // 🔌 BACKEND: Substituir por useQuery
    const teachers = MOCK_TEACHERS;

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || null;

    const filteredPowers = useMemo(() => {
        if (!selectedTeacher) return [];
        return selectedTeacher.powers
            .filter(p => {
                const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
                    || p.description.toLowerCase().includes(search.toLowerCase());
                const matchAuth = filterAuth === 'all' ? true :
                    filterAuth === 'authorized' ? p.authorized : !p.authorized;
                return matchSearch && matchAuth;
            });
    }, [selectedTeacher, search, filterAuth]);

    const authorizedCount = selectedTeacher?.powers.filter(p => p.authorized).length || 0;
    const totalCount = selectedTeacher?.powers.length || 0;

    // Rank index helper para PowerCard
    const RANK_ORDER = ['INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','EPICO','LENDARIO','SUPREMO','MITOLOGICO','SOBERANO'];

    return (
        <div className="min-h-screen bg-[#040415] pb-28 pt-16 md:pt-0">
            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[120px] bg-cyan-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 px-4 pt-14 md:pt-8 md:pl-28 pb-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                            <Scroll size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            {/* SEM ACENTO → font-press */}
                            <p className="font-press text-[9px] text-cyan-400 uppercase tracking-widest">BIBLIOTECA DE LEIS</p>
                            {/* COM ACENTO → font-vt323 */}
                            <h1 className="font-vt323 text-4xl text-white leading-none">Regulamentos</h1>
                        </div>
                    </div>

                    {/* Rank atual do aluno */}
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-xl border',
                            RANK_STYLE[currentRank?.name?.toUpperCase() || 'INICIANTE']?.border || 'border-slate-600',
                        )} style={{ background: `${RANK_STYLE[currentRank?.name?.toUpperCase() || 'INICIANTE']?.glow || '#94a3b8'}10` }}>
                            <Star size={12} className={RANK_STYLE[currentRank?.name?.toUpperCase() || 'INICIANTE']?.color} />
                            {/* COM ACENTO → font-vt323 */}
                            <span className={cn('font-vt323 text-lg', RANK_STYLE[currentRank?.name?.toUpperCase() || 'INICIANTE']?.color)}>
                                Seu rank: {currentRank?.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:pl-28 max-w-3xl mx-auto space-y-5">

                {/* ── SELETOR DE PROFESSOR ── */}
                <div className="relative">
                    <p className="font-press text-[9px] text-slate-500 mb-2 uppercase">SELECIONE O PROFESSOR</p>
                    <button
                        onClick={() => setSelectorOpen(!selectorOpen)}
                        className={cn(
                            'w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
                            selectorOpen
                                ? 'border-cyan-500/60 bg-cyan-900/10'
                                : 'border-slate-700 bg-[#07071a] hover:border-slate-600'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <User size={16} className="text-slate-400" />
                            </div>
                            {selectedTeacher ? (
                                <div>
                                    {/* COM ACENTO → font-vt323 */}
                                    <p className="font-vt323 text-xl text-white leading-none">{selectedTeacher.nome}</p>
                                    <p className="font-mono text-[10px] text-slate-500">{selectedTeacher.disciplina}</p>
                                </div>
                            ) : (
                                /* SEM ACENTO → font-press */
                                <span className="font-press text-[9px] text-slate-500">ESCOLHER PROFESSOR...</span>
                            )}
                        </div>
                        <ChevronDown size={16} className={cn('text-slate-500 transition-transform', selectorOpen && 'rotate-180')} />
                    </button>

                    <AnimatePresence>
                        {selectorOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#08081e] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                {teachers.map((t, i) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedTeacherId(t.id); setSelectorOpen(false); setSearch(''); setFilterAuth('all'); }}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/5',
                                            i > 0 && 'border-t border-white/5',
                                            selectedTeacherId === t.id && 'bg-cyan-900/20'
                                        )}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                            <User size={15} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-vt323 text-xl text-white leading-none">{t.nome}</p>
                                            <p className="font-mono text-[10px] text-slate-500">{t.disciplina}</p>
                                        </div>
                                        {selectedTeacherId === t.id && (
                                            <CheckCircle2 size={15} className="ml-auto text-cyan-400 shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── CONTEÚDO: Poderes do professor selecionado ── */}
                <AnimatePresence mode="wait">
                    {!selectedTeacher ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-20"
                        >
                            <BookOpen size={40} className="text-slate-800 mx-auto mb-3" />
                            {/* COM ACENTO → font-vt323 */}
                            <p className="font-vt323 text-2xl text-slate-700">Selecione um professor para ver os regulamentos.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedTeacher.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            {/* Resumo */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <CheckCircle2 size={12} className="text-green-400" />
                                        <span className="font-press text-[8px] text-green-400">{authorizedCount} AUTORIZADO{authorizedCount !== 1 ? 'S' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                                        <Scroll size={12} className="text-slate-400" />
                                        <span className="font-press text-[8px] text-slate-400">{totalCount} TOTAL</span>
                                    </div>
                                </div>
                            </div>

                            {/* Busca + filtro */}
                            <div className="flex gap-2 mb-4">
                                <div className="flex-1 relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input
                                        type="text"
                                        placeholder="Buscar poder..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-black/40 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white font-mono text-xs focus:border-cyan-500/60 outline-none placeholder:text-slate-700"
                                    />
                                </div>
                                <div className="flex gap-1">
                                    {([
                                        { id: 'all',        label: 'TODOS' },
                                        { id: 'authorized', label: 'OK'    },
                                        { id: 'blocked',    label: 'BLOQ'  },
                                    ] as const).map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilterAuth(f.id)}
                                            className={cn(
                                                'px-2.5 py-2 rounded-xl border font-press text-[7px] transition-all whitespace-nowrap',
                                                filterAuth === f.id
                                                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                                                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                            )}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Legenda */}
                            <div className="flex gap-4 mb-4 px-1">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={11} className="text-green-400" />
                                    {/* COM ACENTO → font-vt323 */}
                                    <span className="font-vt323 text-base text-slate-500">Autorizado</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <XCircle size={11} className="text-slate-700" />
                                    <span className="font-vt323 text-base text-slate-500">Bloqueado nesta disciplina</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Lock size={11} className="text-slate-700" />
                                    <span className="font-vt323 text-base text-slate-500">Rank insuficiente</span>
                                </div>
                            </div>

                            {/* Lista de poderes */}
                            <div className="space-y-2">
                                {filteredPowers.map((power, i) => (
                                    <PowerCard
                                        key={power.skillCode}
                                        power={power}
                                        userRankIndex={userRankIndex}
                                        rankIndex={RANK_ORDER.indexOf(power.rankRequired)}
                                        delay={i * 0.04}
                                    />
                                ))}
                                {filteredPowers.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="font-vt323 text-2xl text-slate-700">Nenhum poder encontrado.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
