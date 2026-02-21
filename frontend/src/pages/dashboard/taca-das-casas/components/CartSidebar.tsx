import { motion } from 'framer-motion';
import { ShoppingCart, X, Trash2, Minus, Plus, Info, Coins, Users, Loader2 } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageHelper';
import { PixelButton } from '../../../../components/ui/PixelButton';

// Interface auxiliar para tipagem do item no carrinho (opcional, mas bom ter)
interface CartItem {
    item: {
        _id: string;
        nome: string;
        preco: number;
        imagem: string;
    };
    qtd: number;
}

export function CartSidebar({
    cart,
    total,
    rateio,
    numAlunos,
    processing,
    onClose,
    onRemove,
    onUpdateQty,
    onCheckout
}: any) {
    return (
        <>
            {/* Header */}
            <div className="p-6 border-b-2 border-yellow-600 bg-gradient-to-r from-yellow-900/60 to-amber-900/60 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-vt323 text-3xl text-yellow-400 flex items-center gap-3">
                        <ShoppingCart size={28} />
                        CALDEIRÃO
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400 hover:text-white" size={24} />
                    </motion.button>
                </div>
                <p className="font-mono text-xs text-yellow-300/80 tracking-wide">
                    Compra Coletiva da Sala
                </p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <ShoppingCart size={64} className="text-slate-700 mb-4" />
                        <p className="font-vt323 text-2xl text-slate-500">
                            O caldeirão está vazio.
                        </p>
                        <p className="font-mono text-xs text-slate-600 mt-2">
                            Adicione itens da loja!
                        </p>
                    </div>
                ) : (
                    cart.map((cartItem: CartItem) => (
                        <motion.div
                            key={cartItem.item._id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex gap-4 bg-black/40 backdrop-blur-sm p-4 rounded-xl border-2 border-yellow-900/50 hover:border-yellow-700/50 transition-all"
                        >
                            {/* Image */}
                            <div className="w-20 h-20 bg-black/60 rounded-lg border border-yellow-900 shrink-0 flex items-center justify-center p-2">
                                <img
                                    src={getImageUrl(cartItem.item.imagem)}
                                    className="w-full h-full object-contain"
                                    alt={cartItem.item.nome}
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-vt323 text-xl text-white truncate mb-1">
                                    {cartItem.item.nome}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-press text-sm text-yellow-400">
                                        {cartItem.item.preco.toLocaleString()} PC$
                                    </span>
                                    <span className="font-mono text-xs text-slate-500">
                                        x {cartItem.qtd}
                                    </span>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onUpdateQty(cartItem.item._id, -1)}
                                        className="p-1 bg-yellow-900/50 hover:bg-yellow-800 rounded border border-yellow-700 transition-colors"
                                    >
                                        <Minus size={14} className="text-yellow-400" />
                                    </motion.button>

                                    <span className="font-mono text-sm text-white w-8 text-center">
                                        {cartItem.qtd}
                                    </span>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onUpdateQty(cartItem.item._id, 1)}
                                        className="p-1 bg-yellow-900/50 hover:bg-yellow-800 rounded border border-yellow-700 transition-colors"
                                    >
                                        <Plus size={14} className="text-yellow-400" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onRemove(cartItem.item._id)}
                                        className="ml-auto p-2 bg-red-900/50 hover:bg-red-800 rounded border border-red-700 transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer - Total & Checkout */}
            {cart.length > 0 && (
                <div className="p-6 border-t-2 border-yellow-600 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm space-y-4">

                    {/* Info Box */}
                    <div className="bg-blue-900/30 border-2 border-blue-700/50 rounded-xl p-4 flex gap-3">
                        <Info className="text-blue-400 shrink-0" size={20} />
                        <p className="font-mono text-xs text-blue-200 leading-relaxed">
                            O valor será dividido igualmente entre <strong>{numAlunos} alunos</strong> ativos da sua sala.
                        </p>
                    </div>

                    {/* Totals */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-sm text-slate-400 flex items-center gap-2">
                                <Coins size={16} />
                                TOTAL GERAL
                            </span>
                            <span className="font-press text-2xl text-yellow-400">
                                {total.toLocaleString()} PC$
                            </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="font-mono text-sm text-slate-400 flex items-center gap-2">
                                <Users size={16} />
                                RATEIO/ALUNO
                            </span>
                            <span className="font-vt323 text-3xl text-green-400">
                                {rateio} PC$
                            </span>
                        </div>
                    </div>

                    {/* Checkout Button (PixelButton) */}
                    <PixelButton
                        onClick={onCheckout}
                        disabled={processing}
                        className={cn(
                            "w-full flex items-center justify-center gap-3 py-4 font-press text-sm",
                            "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500",
                            "border-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                        )}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                PROCESSANDO...
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={20} />
                                FINALIZAR COMPRA
                            </>
                        )}
                    </PixelButton>
                </div>
            )}
        </>
    );
}