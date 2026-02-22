// ARQUIVO: frontend/src/pages/dashboard/taca-das-casas/pages/LinhaDoTempo.tsx
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../api/axios-config';
import { getImageUrl } from '../../../../utils/imageHelper';
import { ArrowLeft, Trophy, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Mapeamento de cores por quantidade de vitórias (escalão lendário)
function getHouseColors(vitorias: number) {
    if (vitorias >= 7) return { text: 'text-yellow-400', border: 'border-yellow-500', glow: '#eab308', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-600', tier: 'LENDÁRIO' };
    if (vitorias >= 5) return { text: 'text-purple-400', border: 'border-purple-500', glow: '#a855f7', badge: 'bg-purple-500/20 text-purple-300 border-purple-600', tier: 'ÉPICO' };
    if (vitorias >= 4) return { text: 'text-cyan-400', border: 'border-cyan-500', glow: '#06b6d4', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-600', tier: 'DIAMANTE' };
    if (vitorias >= 3) return { text: 'text-blue-400', border: 'border-blue-500', glow: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300 border-blue-600', tier: 'OURO' };
    if (vitorias >= 2) return { text: 'text-slate-300', border: 'border-slate-500', glow: '#94a3b8', badge: 'bg-slate-500/20 text-slate-300 border-slate-600', tier: 'PRATA' };
    return { text: 'text-orange-400', border: 'border-orange-700', glow: '#c2410c', badge: 'bg-orange-800/20 text-orange-400 border-orange-700', tier: 'BRONZE' };
}

// Gera todos os anos únicos que aparecem na timeline
function buildYearMap(houses: HouseHistoryItem[]) {
    const years = new Set<number>();
    houses.forEach(h => {
        for (let y = h.anoEntrada; y < h.anoSaida; y++) years.add(y);
    });
    return Array.from(years).sort();
}

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
        staleTime: 1000 * 60 * 5
    });

    const years = buildYearMap(houses);
    const sortedByVic = [...houses].sort((a, b) => b.vitorias - a.vitorias || a.anoEntrada - b.anoEntrada);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white flex flex-col overflow-hidden">
            <HouseCupHeader />

            {/* Hero */}
            <div className="relative pt-6 pb-4 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 to-transparent pointer-events-none" />
                <motion.button
                    onClick={() => navigate('/taca-das-casas')}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-4 top-6 flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-press text-[10px] uppercase"
                >
                    <ArrowLeft size={14} /> Voltar
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 mb-2 px-4 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/5"
                >
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="font-press text-[10px] text-yellow-400 uppercase tracking-widest">Hall da Fama</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-vt323 text-5xl md:text-7xl text-yellow-400 uppercase leading-none drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                >
                    LINHA DO TEMPO
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-vt323 text-xl text-slate-400 mt-1"
                >
                    A história das casas campeãs da ETE Gil Rodrigues
                </motion.p>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="font-vt323 text-3xl text-yellow-400 animate-pulse">CONSULTANDO OS ARQUIVOS...</div>
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════
                        SEÇÃO 1: TIMELINE HORIZONTAL
                    ══════════════════════════════ */}
                    <section className="relative px-4 py-6">
                        <div className="flex items-center justify-between mb-4 max-w-7xl mx-auto">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-purple-400" />
                                <h2 className="font-press text-xs text-purple-300 uppercase tracking-widest">Cronologia</h2>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => scroll('left')}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => scroll('right')}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="overflow-x-auto pb-4 scrollbar-none"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <div className="relative" style={{ minWidth: `${years.length * 88 + 32}px` }}>
                                {/* Linha central */}
                                <div className="absolute left-0 right-0 top-[60px] h-0.5 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />

                                {/* Anos */}
                                <div className="flex">
                                    {years.map((year, yi) => (
                                        <div key={year} className="flex-shrink-0 w-20 mx-1 flex flex-col items-center">
                                            {/* Marcador do ano */}
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/60 border border-yellow-400 mb-1 mt-[54px]" />
                                            <span className="font-press text-[9px] text-slate-500 mt-1">{year}</span>

                                            {/* Casas ativas neste ano */}
                                            <div className="mt-3 space-y-1 w-full">
                                                {houses
                                                    .filter(h => h.anoEntrada <= year && h.anoSaida > year)
                                                    .map(house => {
                                                        const c = getHouseColors(house.vitorias);
                                                        return (
                                                            <motion.div
                                                                key={house._id + year}
                                                                whileHover={{ scale: 1.05 }}
                                                                onClick={() => setSelectedHouse(house)}
                                                                className={`w-full rounded-lg border p-1 cursor-pointer transition-all ${c.border} bg-black/60 hover:bg-black/80`}
                                                                style={{ boxShadow: `0 0 8px ${c.glow}30` }}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    <img
                                                                        src={getImageUrl(house.imagemUrl)}
                                                                        alt={house.nome}
                                                                        className="w-5 h-5 object-contain rounded-sm flex-shrink-0"
                                                                        onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'}
                                                                    />
                                                                    <span className={`font-press text-[7px] leading-tight uppercase ${c.text} truncate`}>
                                                                        {house.nome.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════
                        SEÇÃO 2: HALL DA FAMA (cards)
                    ══════════════════════════════ */}
                    <section className="flex-1 px-4 pb-32 max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-2 mb-6">
                            <Star size={16} className="text-yellow-400" />
                            <h2 className="font-press text-xs text-yellow-300 uppercase tracking-widest">Campeões</h2>
                            <span className="font-mono text-xs text-slate-500">({sortedByVic.length} casas)</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {sortedByVic.map((house, i) => {
                                const c = getHouseColors(house.vitorias);
                                return (
                                    <motion.div
                                        key={house._id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04, type: 'spring', damping: 18 }}
                                        whileHover={{ y: -6, scale: 1.03 }}
                                        onClick={() => setSelectedHouse(house)}
                                        className={`relative group cursor-pointer rounded-xl border-2 ${c.border} bg-black/70 p-4 flex flex-col items-center text-center transition-all`}
                                        style={{ boxShadow: `0 0 20px ${c.glow}20` }}
                                    >
                                        {/* Rank badge */}
                                        {i < 3 && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-300 flex items-center justify-center">
                                                <span className="font-press text-[8px] text-black">#{i + 1}</span>
                                            </div>
                                        )}

                                        <img
                                            src={getImageUrl(house.imagemUrl)}
                                            alt={house.nome}
                                            className="w-14 h-14 object-contain mb-3 drop-shadow-lg group-hover:scale-110 transition-transform"
                                            onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'}
                                        />

                                        <h3 className={`font-vt323 text-lg leading-tight ${c.text} uppercase mb-1`}>
                                            {house.nome}
                                        </h3>

                                        <p className="font-mono text-[10px] text-slate-500 mb-2">{house.anosAtivos}</p>

                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-press ${c.badge}`}>
                                            <Trophy size={10} />
                                            <span>{house.vitorias}x</span>
                                        </div>

                                        <span className={`mt-1 font-mono text-[9px] ${c.text} opacity-70 uppercase`}>
                                            {c.tier}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {/* ══════════════════
                MODAL DE DETALHES
            ══════════════════ */}
            <AnimatePresence>
                {selectedHouse && (() => {
                    const c = getHouseColors(selectedHouse.vitorias);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                            onClick={() => setSelectedHouse(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.85, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.85, y: 30 }}
                                className={`w-full max-w-sm rounded-2xl border-2 ${c.border} bg-[#080820] overflow-hidden`}
                                style={{ boxShadow: `0 0 60px ${c.glow}40` }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Header colorido */}
                                <div
                                    className="p-6 relative overflow-hidden flex flex-col items-center text-center"
                                    style={{ background: `radial-gradient(ellipse at top, ${c.glow}25, transparent 70%)` }}
                                >
                                    <img
                                        src={getImageUrl(selectedHouse.imagemUrl)}
                                        alt={selectedHouse.nome}
                                        className="w-24 h-24 object-contain mb-4 drop-shadow-[0_0_20px_currentColor]"
                                        onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'}
                                    />
                                    <h2 className={`font-vt323 text-4xl ${c.text} uppercase`}>{selectedHouse.nome}</h2>
                                    <p className="font-mono text-sm text-slate-400 mt-1">{selectedHouse.anosAtivos}</p>
                                </div>

                                {/* Stats */}
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 rounded-xl p-4 text-center border border-white/5">
                                        <Trophy size={20} className={`${c.text} mx-auto mb-2`} />
                                        <div className={`font-vt323 text-5xl ${c.text}`}>{selectedHouse.vitorias}</div>
                                        <div className="font-press text-[9px] text-slate-500 uppercase mt-1">Vitórias</div>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-4 text-center border border-white/5">
                                        <Clock size={20} className="text-slate-400 mx-auto mb-2" />
                                        <div className="font-vt323 text-4xl text-white">
                                            {selectedHouse.anoSaida - selectedHouse.anoEntrada}
                                        </div>
                                        <div className="font-press text-[9px] text-slate-500 uppercase mt-1">Anos Ativos</div>
                                    </div>
                                </div>

                                <div className="px-6 pb-6">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-press ${c.badge}`}>
                                        <Star size={12} />
                                        <span>Tier {c.tier}</span>
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
