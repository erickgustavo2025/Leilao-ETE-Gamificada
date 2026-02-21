// frontend/src/pages/public/home/components/StatsSection.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Sword, Gavel } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
import { queryKeys } from '../../../../utils/queryKeys';

interface StatsData {
    players: number;
    xp: number;
    houses: number;
    auctions: number;
}

const StatsSection = React.memo(() => {
    /* --- TANSTACK QUERY: FETCH STATS --- */
    const { data: statsData } = useQuery({
        queryKey: queryKeys.public.stats,
        queryFn: async () => {
            const response = await api.get('/public/stats');
            return response.data as StatsData;
        },
        staleTime: 1000 * 60 * 1, // Cache por 1 minuto (stats mudam devagar)
        placeholderData: { 
            players: 0, 
            xp: 0, 
            houses: 0, 
            auctions: 0 
        }, // Fallback instantâneo
    });

    /* --- FORMAT NUMBER --- */
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'; // 1.3M
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';       // 135.5K
        return num.toString();
    };

    /* --- STATS CONFIG --- */
    const stats = useMemo(() => {
        if (!statsData) return [];
        
        return [
            { 
                value: statsData.players.toLocaleString(), 
                label: 'JOGADORES ATIVOS', 
                icon: Users, 
                color: 'from-pink-500 to-rose-600' 
            },
            { 
                value: formatNumber(statsData.xp), 
                label: 'PC$ EM CIRCULAÇÃO', 
                icon: Sparkles, 
                color: 'from-purple-500 to-violet-600' 
            },
            { 
                value: statsData.houses.toString(), 
                label: 'CASAS EM GUERRA', 
                icon: Sword, 
                color: 'from-amber-500 to-orange-600' 
            },
            { 
                value: statsData.auctions.toString(), 
                label: 'LEILÕES ATIVOS', 
                icon: Gavel, 
                color: 'from-cyan-500 to-blue-600' 
            }
        ];
    }, [statsData]);

    return (
       <section id="status" className="relative z-10 py-20 border-y border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center group cursor-default"
                    >
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} className="text-white" />
                        </div>
                        <h2 className="font-press text-3xl md:text-4xl text-white mb-2">{stat.value}</h2>
                        <div className="font-mono text-xs text-slate-500 tracking-widest">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
});

export default StatsSection;