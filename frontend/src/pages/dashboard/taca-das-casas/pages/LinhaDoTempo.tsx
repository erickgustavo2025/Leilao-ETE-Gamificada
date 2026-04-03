// ARQUIVO: frontend/src/pages/dashboard/taca-das-casas/pages/LinhaDoTempo.tsx
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../api/axios-config';
import { getImageUrl } from '../../../../utils/imageHelper';
import { ArrowLeft, Trophy, Star, Clock, ChevronLeft, ChevronRight, X, Flame, Shield, Gem } from 'lucide-react';
import { HouseCupHeader } from '../components/HouseCupHeader';
import { HouseCupFooter } from '../components/HouseCupFooter';

interface HouseHistoryItem {
    _id: string;
    nome: string;
    anosAtivos: string;
    anoEntrada: number;
    anoSaida: number;
    vitorias: number;
    imagemUrl: string;
}

// ─────────────────────────────────────────────
// SISTEMA DE TIERS — baseado em vitórias
// ─────────────────────────────────────────────
function getTier(vitorias: number) {
    if (vitorias >= 7) return {
        label: 'LENDARIO', // sem acento → font-press
        labelAccent: 'Lendário', // com acento → font-vt323
        icon: Flame,
        text: 'text-yellow-300',
        border: 'border-yellow-400',
        glow: '#eab308',
        glowHex: 'rgba(234,179,8,',
        cardBg: 'from-yellow-950/80 to-black/90',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        barColor: 'bg-yellow-400',
        ring: 'ring-yellow-400/30',
    };
    if (vitorias >= 5) return {
        label: 'EPICO',
        labelAccent: 'Épico',
        icon: Gem,
        text: 'text-purple-300',
        border: 'border-purple-500',
        glow: '#a855f7',
        glowHex: 'rgba(168,85,247,',
        cardBg: 'from-purple-950/80 to-black/90',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        barColor: 'bg-purple-400',
        ring: 'ring-purple-400/30',
    };
    if (vitorias >= 4) return {
        label: 'DIAMANTE',
        labelAccent: 'Diamante',
        icon: Gem,
        text: 'text-cyan-300',
        border: 'border-cyan-400',
        glow: '#06b6d4',
        glowHex: 'rgba(6,182,212,',
        cardBg: 'from-cyan-950/80 to-black/90',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
        barColor: 'bg-cyan-400',
        ring: 'ring-cyan-400/30',
    };
    if (vitorias >= 3) return {
        label: 'OURO',
        labelAccent: 'Ouro',
        icon: Trophy,
        text: 'text-amber-300',
        border: 'border-amber-500',
        glow: '#f59e0b',
        glowHex: 'rgba(245,158,11,',
        cardBg: 'from-amber-950/80 to-black/90',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        barColor: 'bg-amber-400',
        ring: 'ring-amber-400/30',
    };
    if (vitorias >= 2) return {
        label: 'PRATA',
        labelAccent: 'Prata',
        icon: Shield,
        text: 'text-slate-300',
        border: 'border-slate-400',
        glow: '#94a3b8',
        glowHex: 'rgba(148,163,184,',
        cardBg: 'from-slate-800/80 to-black/90',
        badge: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
        barColor: 'bg-slate-400',
        ring: 'ring-slate-400/30',
    };
    return {
        label: 'BRONZE',
        labelAccent: 'Bronze',
        icon: Shield,
        text: 'text-orange-400',
        border: 'border-orange-700',
        glow: '#c2410c',
        glowHex: 'rgba(194,65,12,',
        cardBg: 'from-orange-950/80 to-black/90',
        badge: 'bg-orange-900/30 text-orange-400 border-orange-700/50',
        barColor: 'bg-orange-500',
        ring: 'ring-orange-700/30',
    };
}

function buildYearMap(houses: HouseHistoryItem[]) {
    const years = new Set<number>();
    houses.forEach(h => {
        for (let y = h.anoEntrada; y < h.anoSaida; y++) years.add(y);
    });
    return Array.from(years).sort();
}

// ─────────────────────────────────────────────
// SUB-COMPONENTE: Card da Galeria
// ─────────────────────────────────────────────
function ChampionCard({
    house,
    rank,
    onClick,
    delay,
}: {
    house: HouseHistoryItem;
    rank: number;
    onClick: () => void;
    delay: number;
}) {
    const t = getTier(house.vitorias);
    const TierIcon = t.icon;
    const maxVitorias = 10; // teto visual da barra
    const pct = Math.min((house.vitorias / maxVitorias) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', damping: 20, stiffness: 120 }}
            whileHover={{ y: -8, scale: 1.03 }}
            onClick={onClick}
            className={`
                relative group cursor-pointer rounded-2xl border-2 ${t.border}
                bg-gradient-to-b ${t.cardBg}
                overflow-hidden flex flex-col items-center text-center
                transition-shadow duration-300 ring-4 ${t.ring}
            `}
            style={{ boxShadow: `0 0 30px ${t.glowHex}0.15)` }}
        >
            {/* Brilho no hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${t.glowHex}0.12), transparent 65%)` }}
            />

            {/* Medalha de pódio */}
            {rank <= 3 && (
                <div className={`
                    absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center
                    border-2 font-press text-[9px] shadow-lg z-10
                    ${rank === 1 ? 'bg-yellow-500 border-yellow-300 text-black' :
                      rank === 2 ? 'bg-slate-300 border-slate-100 text-black' :
                                   'bg-orange-600 border-orange-400 text-white'}
                `}>
                    #{rank}
                </div>
            )}

            {/* Tier badge */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-press ${t.badge} z-10`}>
                <TierIcon size={8} />
                {/* SEM ACENTO → font-press */}
                {t.label}
            </div>

            {/* Imagem */}
            <div className="pt-10 pb-3 px-4 relative z-10">
                <div
                    className="w-20 h-20 mx-auto relative"
                    style={{ filter: `drop-shadow(0 0 12px ${t.glow})` }}
                >
                    <img
                        src={getImageUrl(house.imagemUrl)}
                        alt={house.nome}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png')}
                    />
                </div>
            </div>

            {/* Nome — font-vt323 suporta acentos */}
            <h3 className={`font-vt323 text-2xl leading-tight uppercase px-3 ${t.text} relative z-10`}>
                {house.nome}
            </h3>

            {/* Período — font-poppins legível */}
            <p className="font-poppins text-[10px] text-slate-500 mt-1 mb-3 relative z-10">
                {house.anosAtivos}
            </p>

            {/* Barra de vitórias */}
            <div className="w-full px-4 mb-2 relative z-10">
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                        className={`h-full ${t.barColor} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Contagem de vitórias */}
            <div className={`flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full border font-press text-[9px] ${t.badge} relative z-10`}>
                <Trophy size={10} />
                {house.vitorias}x VITORIA{house.vitorias !== 1 ? 'S' : ''}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export function LinhaDoTempo() {
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedHouse, setSelectedHouse] = useState<HouseHistoryItem | null>(null);

    const { data: houses = [], isLoading } = useQuery<HouseHistoryItem[]>({
        queryKey: ['houseHistory'],
        queryFn: async () => {
            const res = await api.get('/house-history');
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const years = buildYearMap(houses);
    const sortedByVic = [...houses].sort((a, b) => b.vitorias - a.vitorias || a.anoEntrada - b.anoEntrada);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#040410] text-white flex flex-col">
            <HouseCupHeader />

            {/* ── HERO ── */}
            <div className="relative pt-6 pb-8 px-4 text-center overflow-hidden">
                {/* Gradiente de fundo do hero */}
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-yellow-500/5 blur-3xl pointer-events-none" />

                <motion.button
                    onClick={() => navigate('/taca-das-casas')}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-4 top-6 flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-press text-[9px] uppercase"
                >
                    <ArrowLeft size={13} /> VOLTAR
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 mb-3 px-4 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/5"
                >
                    <Trophy size={13} className="text-yellow-400" />
                    {/* Label sem acento → font-press */}
                    <span className="font-press text-[9px] text-yellow-400 uppercase tracking-widest">HALL DA FAMA</span>
                </motion.div>

                {/* Título principal — UPPERCASE sem acento → font-press ok */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-press text-2xl md:text-4xl text-yellow-400 uppercase leading-tight drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-2"
                >
                    LINHA DO TEMPO
                </motion.h1>

                {/* Subtítulo com acento → font-vt323 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-vt323 text-2xl text-slate-400"
                >
                    A história das casas campeãs da ETE Gil Rodrigues
                </motion.p>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin" />
                    {/* Texto com acento → font-vt323 */}
                    <p className="font-vt323 text-2xl text-yellow-400 animate-pulse">Consultando os arquivos...</p>
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════════
                        SEÇÃO 1: CRONOLOGIA HORIZONTAL
                    ══════════════════════════════════ */}
                    <section className="relative px-3 md:px-6 py-4">
                        <div className="flex items-center justify-between mb-3 max-w-7xl mx-auto">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-purple-400" />
                                {/* Sem acento → font-press */}
                                <h2 className="font-press text-[9px] text-purple-300 uppercase tracking-widest">CRONOLOGIA</h2>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => scroll('left')}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <button
                                    onClick={() => scroll('right')}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="overflow-x-auto pb-3"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <div className="relative" style={{ minWidth: `${Math.max(years.length * 84 + 32, 320)}px` }}>
                                {/* Linha do tempo */}
                                <div className="absolute left-0 right-0 top-[52px] h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

                                <div className="flex">
                                    {years.map((year) => {
                                        const activeHouses = houses.filter(h => h.anoEntrada <= year && h.anoSaida > year);
                                        return (
                                            <div key={year} className="flex-shrink-0 w-20 mx-0.5 flex flex-col items-center">
                                                {/* Marcador do ano */}
                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70 border border-yellow-300 mt-[47px] mb-1 ring-4 ring-yellow-400/10" />
                                                <span className="font-mono text-[9px] text-slate-500 mb-2">{year}</span>

                                                {/* Casas ativas */}
                                                <div className="space-y-1 w-full">
                                                    {activeHouses.map(house => {
                                                        const t = getTier(house.vitorias);
                                                        return (
                                                            <motion.div
                                                                key={house._id + year}
                                                                whileHover={{ scale: 1.08 }}
                                                                onClick={() => setSelectedHouse(house)}
                                                                className={`w-full rounded-lg border ${t.border} bg-black/70 hover:bg-black/90 p-1 cursor-pointer transition-all`}
                                                                style={{ boxShadow: `0 0 6px ${t.glowHex}0.25)` }}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    <img
                                                                        src={getImageUrl(house.imagemUrl)}
                                                                        alt={house.nome}
                                                                        className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                                                                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png')}
                                                                    />
                                                                    {/* Nome curto — font-vt323 suporta acento */}
                                                                    <span className={`font-vt323 text-sm leading-none uppercase ${t.text} truncate`}>
                                                                        {house.nome.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════════
                        SEÇÃO 2: GALERIA DE CAMPEOES
                    ══════════════════════════════════ */}
                    <section className="flex-1 px-3 md:px-6 pb-32 max-w-7xl mx-auto w-full">

                        {/* Header da seção */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Star size={15} className="text-yellow-400" />
                                {/* Sem acento → font-press */}
                                <h2 className="font-press text-[9px] text-yellow-300 uppercase tracking-widest">GALERIA DE CAMPEOES</h2>
                            </div>
                            {/* Com acento → font-vt323 ou font-mono */}
                            <span className="font-mono text-xs text-slate-600">{sortedByVic.length} casas</span>
                        </div>

                        {/* Legenda de tiers — mobile scroll horizontal */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                            {[
                                { label: 'LENDARIO', labelPt: 'Lendário (7+)', color: 'text-yellow-300 border-yellow-500/50 bg-yellow-500/10' },
                                { label: 'EPICO', labelPt: 'Épico (5-6)', color: 'text-purple-300 border-purple-500/50 bg-purple-500/10' },
                                { label: 'DIAMANTE', labelPt: 'Diamante (4)', color: 'text-cyan-300 border-cyan-500/50 bg-cyan-500/10' },
                                { label: 'OURO', labelPt: 'Ouro (3)', color: 'text-amber-300 border-amber-500/50 bg-amber-500/10' },
                                { label: 'PRATA', labelPt: 'Prata (2)', color: 'text-slate-300 border-slate-500/50 bg-slate-500/10' },
                                { label: 'BRONZE', labelPt: 'Bronze (1)', color: 'text-orange-400 border-orange-700/50 bg-orange-800/10' },
                            ].map(tier => (
                                <div key={tier.label} className={`flex-shrink-0 px-2.5 py-1 rounded-full border text-[9px] font-press whitespace-nowrap ${tier.color}`}>
                                    {tier.label}
                                </div>
                            ))}
                        </div>

                        {/* Grid responsivo: 2 colunas mobile → 3 tablet → 4 desktop → 5 wide */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {sortedByVic.map((house, i) => (
                                <ChampionCard
                                    key={house._id}
                                    house={house}
                                    rank={i + 1}
                                    onClick={() => setSelectedHouse(house)}
                                    delay={i * 0.05}
                                />
                            ))}
                        </div>

                        {sortedByVic.length === 0 && (
                            <div className="text-center py-24">
                                {/* Com acento → font-vt323 */}
                                <p className="font-vt323 text-3xl text-slate-600">Nenhuma casa registrada ainda.</p>
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* ══════════════════════════════════
                MODAL DE DETALHES
            ══════════════════════════════════ */}
            <AnimatePresence>
                {selectedHouse && (() => {
                    const t = getTier(selectedHouse.vitorias);
                    const TierIcon = t.icon;
                    const anosAtivo = selectedHouse.anoSaida - selectedHouse.anoEntrada;

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4"
                            onClick={() => setSelectedHouse(null)}
                        >
                            <motion.div
                                initial={{ y: 80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 80, opacity: 0 }}
                                transition={{ type: 'spring', damping: 24, stiffness: 200 }}
                                className={`
                                    w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl
                                    border-t-2 sm:border-2 ${t.border}
                                    bg-[#06060f] overflow-hidden
                                `}
                                style={{ boxShadow: `0 -20px 80px ${t.glowHex}0.25), 0 0 0 1px ${t.glowHex}0.1)` }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Fechar */}
                                <button
                                    onClick={() => setSelectedHouse(null)}
                                    className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>

                                {/* Header com brilho radial */}
                                <div
                                    className="relative flex flex-col items-center text-center pt-10 pb-6 px-6"
                                    style={{ background: `radial-gradient(ellipse at 50% -20%, ${t.glowHex}0.2), transparent 65%)` }}
                                >
                                    {/* Handle mobile */}
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />

                                    <div
                                        className="w-28 h-28 mb-4"
                                        style={{ filter: `drop-shadow(0 0 20px ${t.glow})` }}
                                    >
                                        <img
                                            src={getImageUrl(selectedHouse.imagemUrl)}
                                            alt={selectedHouse.nome}
                                            className="w-full h-full object-contain"
                                            onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png')}
                                        />
                                    </div>

                                    {/* Nome com acento → font-vt323 */}
                                    <h2 className={`font-vt323 text-5xl uppercase ${t.text} leading-none mb-1`}>
                                        {selectedHouse.nome}
                                    </h2>

                                    {/* Período → font-poppins */}
                                    <p className="font-poppins text-sm text-slate-500 mb-3">{selectedHouse.anosAtivos}</p>

                                    {/* Tier badge — sem acento → font-press */}
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-press text-[9px] ${t.badge}`}>
                                        <TierIcon size={10} />
                                        TIER {t.label}
                                    </div>
                                </div>

                                {/* Stats em grid */}
                                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                        <Trophy size={22} className={`${t.text} mx-auto mb-2`} />
                                        <div className={`font-vt323 text-6xl ${t.text} leading-none`}>
                                            {selectedHouse.vitorias}
                                        </div>
                                        {/* Sem acento → font-press */}
                                        <div className="font-press text-[8px] text-slate-500 uppercase mt-1">VITORIAS</div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                                        <Clock size={22} className="text-slate-400 mx-auto mb-2" />
                                        <div className="font-vt323 text-6xl text-white leading-none">{anosAtivo}</div>
                                        {/* Sem acento → font-press */}
                                        <div className="font-press text-[8px] text-slate-500 uppercase mt-1">ANOS ATIVO{anosAtivo !== 1 ? 'S' : ''}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            <HouseCupFooter />
        </div>
    );
}
