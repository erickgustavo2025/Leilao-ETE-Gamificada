// frontend/src/pages/public/home/components/HousesLeaderboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageHelper';
import { queryKeys } from '../../../../utils/queryKeys';

interface ClassData {
    _id: string;
    nome: string;
    serie: string;
    cor: string;
    logo: string;
    pontuacao: number;
    alunosCount: number;
}

const HousesLeaderboard = React.memo(() => {
    /* --- TANSTACK QUERY: FETCH CLASSROOMS --- */
    const { data: houses = [], isLoading } = useQuery({
        queryKey: queryKeys.public.classrooms,
        queryFn: async () => {
            const response = await api.get('/classrooms');
            // Pega o Top 4 para exibir na Home
            return (response.data as ClassData[]).slice(0, 4);
        },
        staleTime: 1000 * 60 * 2, // Cache por 2 minutos (leaderboard muda devagar)
    });

    const maxPoints = Math.max(...houses.map(h => h.pontuacao), 1);

    return (
       <section id="ranking" className="relative z-10 py-32 bg-black/60 backdrop-blur-xl border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-20">
                    <div className="font-mono text-xs text-pink-500 tracking-widest mb-4">// LEADERBOARD EM TEMPO REAL</div>
                    <h2 className="font-press text-4xl md:text-6xl text-white mb-4">GUERRA DAS TURMAS</h2>
                    <p className="font-vt323 text-2xl text-slate-400">Quem lidera a batalha pelo PC$?</p>
                </div>

                {isLoading ? (
                    <div className="text-center font-press text-xs text-slate-500 animate-pulse">CARREGANDO DADOS DA ARENA...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {houses.map((house, i) => (
                            <motion.div
                                key={house._id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all group cursor-default overflow-hidden"
                            >
                                {/* Background Gradient (Dinâmico) */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                                    style={{ background: `linear-gradient(to bottom right, ${house.cor}, transparent)` }}
                                />

                                {/* Rank Badge */}
                                <div className={cn(
                                    "absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center font-press text-sm border border-white/10",
                                    i === 0 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : 
                                    i === 1 ? "bg-slate-400/20 text-slate-300 border-slate-400/50" : 
                                    i === 2 ? "bg-orange-700/20 text-orange-500 border-orange-700/50" : 
                                    "bg-white/5 text-slate-500"
                                )}>
                                    #{i + 1}
                                </div>

                                {/* House Icon / Logo */}
                                <div 
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform overflow-hidden bg-black/50 border border-white/10"
                                    style={{ boxShadow: `0 0 20px ${house.cor}44` }}
                                >
                                    <img 
                                        src={getImageUrl(house.logo)} 
                                        alt={house.nome} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/etegamificada.png'; }} 
                                    />
                                </div>

                                {/* House Name */}
                                <h3 className="font-press text-xl text-white mb-2 truncate" style={{ textShadow: `0 0 10px ${house.cor}66` }}>
                                    {house.nome}
                                </h3>
                                <p className="font-mono text-xs text-slate-500 mb-4">{house.serie}</p>

                                {/* Points */}
                                <div className="font-vt323 text-3xl text-white mb-4">
                                    {(house.pontuacao / 1000).toFixed(1)}k <span className="text-sm text-slate-500">PC$</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(house.pontuacao / maxPoints) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.2 }}
                                        className="h-full rounded-full relative"
                                        style={{ backgroundColor: house.cor }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                    </motion.div>
                                </div>
                                
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-600">
                                    <Users size={12} /> {house.alunosCount} MEMBROS
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
});

export default HousesLeaderboard;