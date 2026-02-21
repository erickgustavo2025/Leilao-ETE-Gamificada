// frontend/src/pages/public/home/components/Navbar.tsx
import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Unlock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
import { getImageUrl } from '../../../../utils/imageHelper';
import { queryKeys } from '../../../../utils/queryKeys';

interface NavbarProps {
    navigate: (path: string) => void;
    playClick: () => void;
    playHover: () => void;
}

export function UltraNavbar({ navigate, playClick, playHover }: NavbarProps) {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    
    /* --- TANSTACK QUERY: FETCH CONFIG --- */
    const { data: config } = useQuery({
        queryKey: queryKeys.public.config,
        queryFn: async () => {
            const response = await api.get('/public/config');
            return response.data as { siteName: string; logoUrl: string };
        },
        staleTime: 1000 * 60 * 5, // Cache por 5 minutos
        placeholderData: { 
            siteName: 'ETE GAMIFICADA', 
            logoUrl: '/assets/etegamificada.png' 
        }, // Fallback instantâneo
    });

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const handleScroll = (id: string) => {
        playClick();
        const element = document.getElementById(id.toLowerCase());
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const NAV_ITEMS = [
        { label: 'EVENTOS', id: 'eventos' },
        { label: 'RANKING', id: 'ranking' },
        { label: 'RECURSOS', id: 'loja' },
        { label: 'CASAS', id: 'ranking' }
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 2.5 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6"
        >
            <div
                className={`max-w-7xl mx-auto flex justify-between items-center rounded-2xl px-6 py-3 border transition-all duration-500 ${
                    isScrolled
                        ? "bg-black/80 backdrop-blur-md border-white/10 shadow-lg"
                        : "bg-transparent border-transparent"
                }`}
            >
                {/* Logo Dinâmica */}
                <div
                    className="flex items-center gap-4 cursor-pointer group"
                    onMouseEnter={playHover}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <div className="relative">
                        <img 
                            src={getImageUrl(config?.logoUrl || '/assets/etegamificada.png')}
                            className="w-10 h-10 object-contain drop-shadow-lg transition-transform group-hover:scale-110" 
                            alt="Logo" 
                        />
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="font-press text-sm text-white group-hover:text-pink-400 transition-colors uppercase">
                            {config?.siteName || 'ETE GAMIFICADA'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            <span className="font-mono text-[10px] text-green-400 tracking-widest">ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="hidden lg:flex items-center gap-8">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.label}
                            onMouseEnter={playHover}
                            onClick={() => handleScroll(item.id)}
                            className="font-mono text-xs text-slate-400 hover:text-white transition-colors tracking-widest relative group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-pink-500 group-hover:w-full transition-all duration-300" />
                        </button>
                    ))}
                </div>

                {/* CTA LOGIN */}
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={() => { playClick(); navigate('/login'); }}
                        onMouseEnter={playHover}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative px-6 py-2 font-press text-sm text-white overflow-hidden rounded-lg border border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 transition-colors group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Unlock size={14} />
                            LOGIN
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </motion.button>
                </div>
            </div>
        </motion.nav>
    );
}