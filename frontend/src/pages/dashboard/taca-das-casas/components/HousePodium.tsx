import { motion } from 'framer-motion';
import { Crown, TrendingUp } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageHelper';

interface HousePodiumProps {
    house: {
        _id: string;
        nome: string;
        serie: string;
        pontuacaoAtual: number;
        logo: string;
    };
    rank: number;
    delay?: number;
}

const HOUSE_COLORS: Record<string, { primary: string; secondary: string; glow: string; gradient: string }> = {
    'SPARTTA': { primary: 'from-red-600 to-red-800', secondary: 'border-red-500', glow: 'shadow-red-500/20', gradient: 'from-red-500/20' },
    'ELECTRA': { primary: 'from-blue-600 to-blue-800', secondary: 'border-blue-500', glow: 'shadow-blue-500/20', gradient: 'from-blue-500/20' },
    'ARCANIA': { primary: 'from-green-400 to-green-600', secondary: 'border-green-400', glow: 'shadow-green-500/20', gradient: 'from-green-400/20' },
    'VALHALLA': { primary: 'from-gray-800 to-black', secondary: 'border-gray-600', glow: 'shadow-gray-500/20', gradient: 'from-gray-600/20' },
    'MONARCAS': { primary: 'from-orange-600 to-orange-800', secondary: 'border-orange-500', glow: 'shadow-orange-500/20', gradient: 'from-orange-500/20' },
    'ARDHARIA': { primary: 'from-rose-900 to-rose-950', secondary: 'border-rose-700', glow: 'shadow-rose-900/20', gradient: 'from-rose-700/20' },
    'MIDGARD': { primary: 'from-lime-700 to-lime-900', secondary: 'border-lime-600', glow: 'shadow-lime-600/20', gradient: 'from-lime-600/20' },
    'ATLANTIS': { primary: 'from-cyan-400 to-cyan-600', secondary: 'border-cyan-400', glow: 'shadow-cyan-500/20', gradient: 'from-cyan-400/20' },
    'SALA AMARELA': { primary: 'from-yellow-500 to-yellow-700', secondary: 'border-yellow-400', glow: 'shadow-yellow-500/20', gradient: 'from-yellow-400/20' },
    'SALA CINZA': { primary: 'from-gray-500 to-gray-700', secondary: 'border-gray-400', glow: 'shadow-gray-500/20', gradient: 'from-gray-400/20' },
    'SALA ROXA': { primary: 'from-purple-600 to-purple-800', secondary: 'border-purple-500', glow: 'shadow-purple-500/20', gradient: 'from-purple-500/20' },
    'SALA ROSA': { primary: 'from-pink-500 to-pink-700', secondary: 'border-pink-400', glow: 'shadow-pink-500/20', gradient: 'from-pink-400/20' },
};

export function HousePodium({ house, rank, delay = 0 }: HousePodiumProps) {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;
    
    const heightClass = isFirst ? 'h-56 md:h-72' : isSecond ? 'h-40 md:h-56' : isThird ? 'h-32 md:h-40' : 'h-24 md:h-32';

    const houseTheme = HOUSE_COLORS[house.nome.toUpperCase()] || {
        primary: 'from-slate-600 to-slate-800',
        secondary: 'border-slate-500',
        glow: 'shadow-slate-500/20',
        gradient: 'from-slate-500/20'
    };

    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }} // Reduzi o movimento inicial
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.5, ease: "backOut" }} // Troquei Spring por Ease (mais leve)
            className="flex flex-col items-center group cursor-pointer"
        >
           {/* Cabeçalho do Pódio (Logo + Rank) */}
            <div className="mb-2 text-center relative flex flex-col items-center">
                <div className="relative mb-2">
                    {/* Coroas Estáticas (Animação removida para performance) */}
                    {isFirst && <Crown size={40} className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400 z-20 drop-shadow-lg" />}
                    {isSecond && <Crown size={32} className="absolute -top-8 left-1/2 -translate-x-1/2 text-slate-300 fill-slate-300 z-20" />}
                    {isThird && <Crown size={28} className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-400 fill-orange-400 z-20" />}

                    <div className={cn(
                        "w-16 h-16 md:w-20 md:h-20 rounded-full border-4 overflow-hidden bg-black/50 relative z-10",
                        isFirst ? "border-yellow-400 shadow-lg shadow-yellow-500/30" :
                        isSecond ? "border-slate-300" :
                        isThird ? "border-orange-500" : "border-slate-600"
                    )}>
                       <img 
                            src={getImageUrl(house.logo)} 
                            alt={house.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/etegamificada.png'; }}
                        />
                    </div>
                    
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-press border z-20 bg-black/80 text-white border-white/20">
                        #{rank}
                    </div>
                </div>

                <h3 className="font-press text-sm md:text-lg text-white leading-none mb-1 tracking-wider mt-2 truncate max-w-[120px]">
                    {house.nome}
                </h3>
                <p className="font-mono text-[10px] text-slate-400 tracking-widest bg-black/40 px-2 rounded">
                    {house.serie}
                </p>
            </div>

            {/* Pilar do Pódio (Base) - OTIMIZADO: Removido partículas internas */}
            <div className={cn(
                    "w-full rounded-t-2xl border-4 flex flex-col items-center justify-end relative overflow-hidden transition-all duration-300",
                    heightClass,
                    houseTheme.secondary,
                    "shadow-xl", // Sombra estática mais leve
                    houseTheme.glow
                )}
                style={{ background: `linear-gradient(to bottom, var(--tw-gradient-stops))` }}
            >
                <div className={cn("absolute inset-0 bg-gradient-to-b opacity-90", houseTheme.primary)} />

                {/* Brilho estático ou animação CSS pura (muito mais leve que framer-motion) */}
                <div className={cn("absolute inset-0 bg-gradient-to-t opacity-30", houseTheme.gradient)} />

                {/* Score Display */}
                <div className="relative z-10 pb-6 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp size={16} className="text-white/80" />
                        <span className="font-press text-xl md:text-3xl text-white drop-shadow-md">
                            {house.pontuacaoAtual.toLocaleString()}
                        </span>
                    </div>
                    <div className="font-mono text-[8px] text-white/60 tracking-widest uppercase">
                        Pontos
                    </div>
                </div>
            </div>
        </motion.div>
    );
}