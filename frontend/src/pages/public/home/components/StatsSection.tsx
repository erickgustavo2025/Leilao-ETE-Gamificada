// frontend/src/pages/public/home/components/StatsSection.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Sword, Gavel, Activity, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
import { queryKeys } from '../../../../utils/queryKeys';
import { getSocket, connectSocket } from '../../../../services/socket';

interface StatsData {
    players: number;
    xp: number;
    houses: number;
    auctions: number;
    online: number;
    guests?: number;
}

const StatsSection = React.memo(() => {
    // 📡 Estado Live Independente
    const [liveStats, setLiveStats] = useState<{ online: number; guests: number } | null>(null);

    /* --- TANSTACK QUERY: FETCH STATS --- */
    const { data: statsData } = useQuery({
        queryKey: queryKeys.public.stats,
        queryFn: async () => {
            const response = await api.get('/public/stats');
            return response.data as StatsData;
        },
        staleTime: 1000 * 60 * 1,
    });

    /* --- 📡 REAL-TIME: SOCKET CONNECT & LISTEN --- */
    useEffect(() => {
        // Conecta o socket para contar este visitante mesmo se não estiver logado
        const socket = connectSocket();
        
        const handleUpdate = (data: { online: number, guests: number }) => {
            setLiveStats({ online: data.online, guests: data.guests });
        };

        socket.on('LIVE_STATS_UPDATE', handleUpdate);
        
        return () => {
            socket.off('LIVE_STATS_UPDATE', handleUpdate);
        };
    }, []);

    /* --- FORMAT NUMBER --- */
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    /* --- STATS CONFIG (AGORA COM 6 CARDS) --- */
    const stats = useMemo(() => {
        const base = statsData || { players: 0, xp: 0, houses: 0, auctions: 0, online: 0, guests: 0 };
        
        return [
            { 
                value: base.players.toLocaleString(), 
                label: 'JOGADORES', 
                icon: Users, 
                color: 'from-blue-500 to-cyan-600' 
            },
            { 
                value: formatNumber(base.xp), 
                label: 'PC$ CIRCULANTES', 
                icon: Sparkles, 
                color: 'from-purple-500 to-violet-600' 
            },
            { 
                value: (liveStats?.online ?? base.online).toString(), 
                label: 'JOGADORES ONLINE', 
                icon: Activity, 
                color: 'from-green-500 to-emerald-600',
                isLive: true
            },
            { 
                value: (liveStats?.guests ?? base.guests ?? 0).toString(), 
                label: 'EXPLORADORES', 
                icon: Eye, 
                color: 'from-orange-500 to-amber-600',
                isLive: true
            },
            { 
                value: base.houses.toString(), 
                label: 'CASAS ATIVAS', 
                icon: Sword, 
                color: 'from-indigo-500 to-blue-600' 
            },
            { 
                value: base.auctions.toString(), 
                label: 'LEILÕES', 
                icon: Gavel, 
                color: 'from-pink-500 to-rose-600' 
            }
        ];
    }, [statsData, liveStats]);

    return (
       <section id="status" className="relative z-10 py-20 border-y border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group cursor-default"
                    >
                        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative`}>
                            <stat.icon size={24} className="text-white" />
                            {stat.isLive && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-black"></span>
                                </span>
                            )}
                        </div>
                        <h2 className={`font-press text-xl md:text-2xl text-white mb-2 ${stat.isLive ? 'text-green-400' : ''}`}>
                            {stat.value}
                        </h2>
                        <div className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
});

export default StatsSection;