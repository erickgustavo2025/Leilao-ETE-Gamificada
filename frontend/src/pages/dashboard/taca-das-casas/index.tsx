import { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Scroll, ShieldAlert, History, Loader2, AlertCircle, EyeOff, ShieldCheck} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components Leves
import { ParticleBackground } from './components/ParticleBackground';
import { HouseCupHeader } from './components/HouseCupHeader';
import { HousePodium } from './components/HousePodium';
import { MenuCard } from './components/MenuCard';
import { HouseCupFooter } from './components/HouseCupFooter';

// Lazy Load do Modal Pesado
const HouseHistoryModal = lazy(() => import('./components/HouseHistoryModal').then(m => ({ default: m.HouseHistoryModal })));

import { useAuth } from '../../../contexts/AuthContext';
import { useGameSound } from '../../../hooks/useGameSound';
import { api } from '../../../api/axios-config';
import { PageTransition } from '../../../components/layout/PageTransition';
import { cn } from '../../../utils/cn';
import { getImageUrl } from '../../../utils/imageHelper';

interface HouseData {
    _id: string;
    nome: string;
    serie: string;
    pontuacaoAtual: number;
    logo: string;
    cor?: string;
}

export function HouseCupHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { playClick } = useGameSound();

    const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>(() => {
        const userYear = user?.turma?.charAt(0);
        return ['1', '2', '3'].includes(userYear || '') ? userYear! : '1';
    });

    // ==================== QUERIES ====================
    
    // Query 1: Config + Houses (combinadas)
    const { 
        data: housesData, 
        isLoading, 
        isError 
    } = useQuery({
        queryKey: ['houseCup'],
        queryFn: async () => {
            const [configRes, listRes] = await Promise.all([
                api.get('/house/config'),
                api.get('/classrooms')
            ]);
            
            return {
                isVisible: configRes.data.houseCupVisible,
                houses: listRes.data as HouseData[]
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // Query 2: Histórico da Casa (condicional - só busca quando modal abre)
    const { 
        data: historyData = [], 
        isLoading: historyLoading 
    } = useQuery({
        queryKey: ['houseHistory', selectedHouse?.serie],
        queryFn: async () => {
            if (!selectedHouse) return [];
            const turmaEncoded = encodeURIComponent(selectedHouse.serie);
            const res = await api.get(`/house/${turmaEncoded}/history`);
            return res.data;
        },
        enabled: !!selectedHouse, // Auto-fetch quando selectedHouse muda
        staleTime: 5 * 60 * 1000,
    });

    // ==================== DERIVAÇÕES ====================
    
    const houses = housesData?.houses || [];
    const isRankingHidden = housesData?.isVisible === false && user?.role !== 'admin';

    // ==================== HANDLERS ====================

    const handleOpenHistory = (house: HouseData) => {
        playClick();
        setSelectedHouse(house); // Isso vai disparar a query automaticamente
    };

    const handleNavigation = (path: string) => {
        playClick();
        navigate(path);
    };

    // ==================== FILTROS LOCAIS ====================
    
    const filteredHouses = houses.filter(house => house.serie.trim().startsWith(selectedYear));
    const sortedHouses = [...filteredHouses].sort((a, b) => b.pontuacaoAtual - a.pontuacaoAtual);

    // ==================== RENDER ====================

    return (
        <PageTransition className="min-h-screen bg-[#050505] relative overflow-hidden">
            <ParticleBackground />

            {/* Background Otimizado (Radial simples, sem blur pesado) */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(0,0,0,0) 70%)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.1) 0%, rgba(0,0,0,0) 70%)' }} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <HouseCupHeader />

                <main className="flex-1 px-4 pb-24 md:pl-28 pt-6 space-y-8">

                    <section className="max-w-7xl mx-auto">
                        {/* Header da Seção */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full mb-4">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                <span className="font-mono text-[10px] text-purple-300 tracking-widest uppercase">Tempo Real</span>
                            </div>
                            <h2 className="font-vt323 text-5xl text-yellow-500 mb-1 uppercase leading-none">TAÇA DAS CASAS</h2>
                        </div>

                        {/* Seletor de Ano */}
                        <div className="flex justify-center gap-2 mb-24">
                            {['1', '2', '3'].map((year) => (
                                <button
                                    key={year}
                                    onClick={() => { playClick(); setSelectedYear(year); }}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-press text-xs transition-all border-2 uppercase",
                                        selectedYear === year
                                            ? "bg-yellow-500 text-black border-yellow-300"
                                            : "bg-slate-900/50 text-slate-500 border-slate-700"
                                    )}
                                >
                                    {year}º ANO
                                </button>
                            ))}
                        </div>

                        {/* Conteúdo Principal */}
                        {isRankingHidden ? (
                            <div className="py-12 px-4 rounded-3xl border border-purple-900/50 bg-black/60 text-center">
                                <EyeOff size={32} className="text-purple-400 mx-auto mb-4" />
                                <h3 className="font-vt323 text-3xl text-white mb-2">MISTÉRIO NO AR</h3>
                                <p className="font-vt323 text-xl text-purple-300">O placar está oculto por magia.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                                    </div>
                                ) : isError ? (
                                    <div className="text-center py-10">
                                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                                        <p className="text-red-400 font-press text-xs">Falha na conexão mágica.</p>
                                    </div>
                                ) : sortedHouses.length > 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        {/* PÓDIO */}
                                        <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-5xl mx-auto mb-12 min-h-[180px]">
                                            <div onClick={() => sortedHouses[1] && handleOpenHistory(sortedHouses[1])}>
                                                {sortedHouses[1] ? <HousePodium house={sortedHouses[1]} rank={2} delay={0.1} /> : <div className="h-32" />}
                                            </div>
                                            <div className="-mt-8 z-10" onClick={() => sortedHouses[0] && handleOpenHistory(sortedHouses[0])}>
                                                {sortedHouses[0] ? <HousePodium house={sortedHouses[0]} rank={1} delay={0} /> : <div className="h-48" />}
                                            </div>
                                            <div onClick={() => sortedHouses[2] && handleOpenHistory(sortedHouses[2])}>
                                                {sortedHouses[2] ? <HousePodium house={sortedHouses[2]} rank={3} delay={0.2} /> : <div className="h-24" />}
                                            </div>
                                        </div>

                                        {/* LISTA DE OUTRAS CASAS */}
                                        {sortedHouses.length > 3 && (
                                            <div className="mt-8 max-w-3xl mx-auto space-y-2">
                                                {sortedHouses.slice(3).map((house, index) => (
                                                    <div
                                                        key={house._id}
                                                        onClick={() => handleOpenHistory(house)}
                                                        className="px-4 py-3 flex items-center justify-between bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-press text-xs text-slate-500 w-6">#{index + 4}</span>
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-black">
                                                                <img src={getImageUrl(house.logo)} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-vt323 text-xl text-white uppercase leading-none">{house.nome}</h4>
                                                                <p className="font-mono text-[9px] text-slate-500">{house.serie}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-press text-xs text-yellow-500">{house.pontuacaoAtual.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-20 text-slate-500 font-vt323 text-2xl">NENHUMA CASA ENCONTRADA</div>
                                )}
                            </AnimatePresence>
                        )}
                    </section>

                    {/* Menu de Navegação Rápida */}
                    <section className="max-w-6xl mx-auto pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MenuCard
                                title="BECO DIAGONAL" desc="Loja Mágica"
                                icon={ShoppingBag} color="text-purple-400" borderColor="border-purple-600"
                                onClick={() => handleNavigation('/taca-das-casas/beco-diagonal')} delay={0}
                            />
                            <MenuCard
                                title="SALA COMUNAL" desc="Inventário da Sala"
                                icon={Scroll} color="text-blue-400" borderColor="border-blue-600"
                                onClick={() => handleNavigation('/taca-das-casas/mochila')} delay={0}
                            />
                            <MenuCard
                                title="QUADRO DE AVISOS" desc="Punições"
                                icon={ShieldAlert} color="text-red-400" borderColor="border-red-600"
                                onClick={() => handleNavigation('/taca-das-casas/punicoes')} delay={0}
                            />
                            <MenuCard
                                title="REGISTROS" desc="Histórico"
                                icon={History} color="text-yellow-400" borderColor="border-yellow-600"
                                onClick={() => handleNavigation('/taca-das-casas/historico')} delay={0}
                            />

                            {(user?.cargos?.includes('armada_dumbledore') || user?.role === 'admin') && (
                                <MenuCard
                                    title="ARMADA"
                                    desc="Área Restrita"
                                    icon={ShieldCheck}
                                    color="text-blue-400"
                                    borderColor="border-blue-600"
                                    onClick={() => handleNavigation('/armada/login')}
                                    delay={0.4}
                                />
                            )}

                        </div>
                    </section>

                </main>

                <HouseCupFooter />

                {/* MODAL COM LAZY LOADING */}
                <Suspense fallback={null}>
                    <HouseHistoryModal
                        isOpen={!!selectedHouse}
                        onClose={() => setSelectedHouse(null)}
                        house={selectedHouse}
                        history={historyData}
                        loading={historyLoading}
                    />
                </Suspense>
            </div>
        </PageTransition>
    );
}