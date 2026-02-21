import { motion } from 'framer-motion';
import { ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageHelper';
import { useGameSound } from '../../../../hooks/useGameSound';

// Configuração de Cores por Raridade
const RARITY_COLORS = {
    'Comum': { text: 'text-slate-400', bg: 'bg-slate-600', border: 'border-slate-500' },
    'Raro': { text: 'text-blue-400', bg: 'bg-blue-600', border: 'border-blue-500' },
    'Épico': { text: 'text-purple-400', bg: 'bg-purple-600', border: 'border-purple-500' },
    'Lendário': { text: 'text-orange-400', bg: 'bg-orange-600', border: 'border-orange-500' },
    'Mitológico': { text: 'text-pink-400', bg: 'bg-pink-600', border: 'border-pink-500' },
    'Soberano': { text: 'text-yellow-400', bg: 'bg-yellow-600', border: 'border-yellow-500' },
};

export function ItemCard({
    item,
    index,
    shop,
    onBuyIndividual,
    onAddToCart,
    isRep,
    processing
}: any) {
    // Garante que existe uma cor padrão se a raridade não for reconhecida
    const rarityStyle = RARITY_COLORS[item.raridade as keyof typeof RARITY_COLORS] || RARITY_COLORS.Comum;
    const { playHover } = useGameSound();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onMouseEnter={playHover}
            className="group h-full"
        >
            <div className={cn(
                "h-full flex flex-col rounded-2xl border-2 overflow-hidden backdrop-blur-xl transition-all duration-300",
                "bg-gradient-to-b from-black/60 to-black/80",
                shop.border,
                "hover:shadow-[0_0_40px_rgba(0,0,0,0.8)]",
                shop.glow
            )}>

                {/* Image Container */}
                <div className="relative h-48 bg-gradient-to-b from-black/40 to-black/60 p-4 flex items-center justify-center overflow-hidden">
                    {/* Background glow */}
                    <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity blur-2xl",
                        shop.color.replace('text-', 'bg-')
                    )} />

                    {/* Image - AGORA COM LAZY LOADING */}
                    <motion.img
                        loading="lazy" // <--- A MÁGICA AQUI
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ type: 'spring', damping: 10 }}
                        src={getImageUrl(item.imagem)}
                        alt={item.nome}
                        className="relative h-full w-full object-contain drop-shadow-2xl z-10"
                        onError={(e) => (e.target as HTMLImageElement).src = '/assets/store.png'}
                    />

                    {/* Rarity Badge */}
                    <div className={cn(
                        "absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-vt323 text-lg text-yellow-400 uppercase tracking-widest",
                        rarityStyle.bg,
                        rarityStyle.border,
                        rarityStyle.text
                    )}>
                        {item.raridade}
                    </div>

                    {/* Sparkle effect on hover */}
                    <motion.div
                        className="absolute top-4 left-4 opacity-0 group-hover:opacity-100"
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                    >
                        <Sparkles size={20} className={shop.color} />
                    </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                    {/* Title */}
                    <h3 className="font-vt323 text-2xl text-white uppercase leading-none mb-2 group-hover:text-yellow-400 transition-colors">
                        {item.nome}
                    </h3>

                    {/* Description */}
                    <p className="font-vt323 text-lg text-slate-400 leading-tight mb-4 flex-1">
                        {item.descricao}
                    </p>

                    {/* Price & Actions */}
                    <div className="pt-3 border-t border-white/10 space-y-3">
                        {/* Price */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-press text-2xl md:text-3xl text-yellow-400 leading-none">
                                    {item.preco.toLocaleString()}
                                    <span className="text-sm ml-1">PC$</span>
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 mt-1">
                                    ~{Math.ceil(item.preco / 40)} PC$/aluno
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Buy Individual */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onBuyIndividual(item)}
                                disabled={processing}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-press text-[10px] transition-all border-2",
                                    "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500",
                                    "border-blue-400 text-white",
                                    "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                title="Comprar para a Sala (Individual)"
                            >
                                <ShoppingBag size={16} />
                                <span className="hidden md:inline">COMPRAR</span>
                            </motion.button>

                            {/* Add to Cart (só Rep) */}
                            {isRep && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onAddToCart(item)}
                                    disabled={processing}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-press text-[10px] transition-all border-2",
                                        "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500",
                                        "border-yellow-400 text-black",
                                        "shadow-[0_0_20px_rgba(234,179,8,0.3)]",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    title="Adicionar ao Carrinho Coletivo"
                                >
                                    <ShoppingCart size={16} />
                                    <span className="hidden md:inline">COLETIVO</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}