import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ShoppingCart,
    Sparkles,
    Wand2,
    Wine,
    Gamepad2,
    Scroll,
    BookOpen,
    AlertCircle,
    Backpack,
    Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Imports
import { api } from '../../../../api/axios-config';
import { useAuth } from '../../../../contexts/AuthContext';
import { cn } from '../../../../utils/cn';
import { PageTransition } from '../../../../components/layout/PageTransition';
import { useGameSound } from '../../../../hooks/useGameSound';
import { ItemCard } from '../components/ItemCard';
import { CartSidebar } from '../components/CartSidebar';

// ========================
// HOOK: Detectar Mobile (Para Otimização)
// ========================
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
};

interface StoreItem {
    _id: string;
    nome: string;
    descricao: string;
    preco: number;
    imagem: string;
    raridade: 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mitológico' | 'Soberano';
    lojaTematica: string;
}

interface CartItem {
    item: StoreItem;
    qtd: number;
}

const SHOPS = [
    {
        id: 'VASSOURAS',
        name: 'MASTER VASSOURAS',
        icon: Sparkles,
        color: 'text-amber-400',
        border: 'border-amber-600',
        bg: 'bg-amber-900/20',
        glow: 'shadow-[0_0_40px_rgba(251,191,36,0.4)]',
        gradient: 'from-amber-500/20 via-amber-600/10 to-transparent'
    },
    {
        id: 'VARINHAS',
        name: 'OLIVARAS',
        icon: Wand2,
        color: 'text-emerald-400',
        border: 'border-emerald-600',
        bg: 'bg-emerald-900/20',
        glow: 'shadow-[0_0_40px_rgba(52,211,153,0.4)]',
        gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent'
    },
    {
        id: 'POCOES',
        name: 'CASA DE MAGIA',
        icon: Wine,
        color: 'text-purple-400',
        border: 'border-purple-600',
        bg: 'bg-purple-900/20',
        glow: 'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-500/20 via-purple-600/10 to-transparent'
    },
    {
        id: 'MAROTO',
        name: 'MAROTO E-SPORTS',
        icon: Gamepad2,
        color: 'text-red-400',
        border: 'border-red-600',
        bg: 'bg-red-900/20',
        glow: 'shadow-[0_0_40px_rgba(248,113,113,0.4)]',
        gradient: 'from-red-500/20 via-red-600/10 to-transparent'
    },
    {
        id: 'MINISTERIO',
        name: 'MINISTÉRIO',
        icon: Scroll,
        color: 'text-blue-400',
        border: 'border-blue-600',
        bg: 'bg-blue-900/20',
        glow: 'shadow-[0_0_40px_rgba(96,165,250,0.4)]',
        gradient: 'from-blue-500/20 via-blue-600/10 to-transparent'
    },
    {
        id: 'MAGIC_BOOK',
        name: 'MAGIC BOOK',
        icon: BookOpen,
        color: 'text-pink-400',
        border: 'border-pink-600',
        bg: 'bg-pink-900/20',
        glow: 'shadow-[0_0_40px_rgba(244,114,182,0.4)]',
        gradient: 'from-pink-500/20 via-pink-600/10 to-transparent'
    }
];

export function BecoDiagonal() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { playClick, playSuccess, playError, playHover } = useGameSound();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    // Estados de UI (mantidos)
    const [activeTab, setActiveTab] = useState('VASSOURAS');
    const [cart, setCart] = useState<CartItem[]>([]); // Cart permanece local
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Permissões
    const isRep = user?.cargos?.includes('representante') ||
        user?.cargos?.includes('vice_representante') ||
        user?.role === 'admin';

    // Mock: número de alunos (você pode buscar da API)
    const numAlunos = 40;

    // ==================== QUERIES ====================

    // Query 1: Configuração da Loja (aberta/fechada)
    const { data: config } = useQuery({
        queryKey: ['becoConfig'],
        queryFn: async () => {
            const res = await api.get('/house/config');
            return res.data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutos
    });

    // Query 2: Itens da Loja (só busca se estiver aberta ou se for admin)
    const { 
        data: items = {}, 
        isLoading 
    } = useQuery({
        queryKey: ['becoItems'],
        queryFn: async () => {
            const res = await api.get('/beco');
            if (res.data && typeof res.data === 'object') {
                return res.data;
            }
            return {};
        },
        enabled: config?.becoDiagonalOpen === true || user?.role === 'admin', // Só busca se aberto
        staleTime: 3 * 60 * 1000, // 3 minutos
    });

    // ==================== DERIVAÇÕES ====================

    const isClosed = config?.becoDiagonalOpen === false && user?.role !== 'admin';
    const currentItems = items[activeTab] || [];
    const currentShop = SHOPS.find(s => s.id === activeTab) || SHOPS[0];
    const cartTotal = cart.reduce((acc, curr) => acc + (curr.item.preco * curr.qtd), 0);
    const cartRateio = Math.ceil(cartTotal / numAlunos);
    const cartCount = cart.reduce((acc, i) => acc + i.qtd, 0);

    // ==================== MUTATIONS ====================

    // Mutation 1: Compra Individual
    const buyIndividualMutation = useMutation({
        mutationFn: async (itemId: string) => {
            return await api.post('/beco/buy-individual', { itemId });
        },
        onSuccess: async () => {
            playSuccess();
            toast.success('Compra realizada! 🎉', {
                description: `Item enviado para o inventário da ${user?.turma}.`
            });
            // Invalida cache do usuário para atualizar saldo
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            await refreshUser();
        },
        onError: (error: any) => {
            playError();
            toast.error(error.response?.data?.error || "Erro na compra.");
        }
    });

    // Mutation 2: Checkout do Carrinho (Compra Coletiva)
    const checkoutMutation = useMutation({
        mutationFn: async (payload: { items: { itemId: string; quantity: number }[] }) => {
            return await api.post('/beco/buy', payload);
        },
        onSuccess: async (response) => {
            playSuccess();
            toast.success("COMPRA REALIZADA! 🎉", { 
                description: response.data.message || 'Itens enviados para a sala!' 
            });
            setCart([]); // Limpa carrinho
            setIsCartOpen(false);
            // Invalida cache do usuário
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            await refreshUser();
        },
        onError: (error: any) => {
            playError();
            toast.error(error.response?.data?.error || "Erro na transação mágica.");
        }
    });

    // ==================== HANDLERS ====================

    const addToCart = (item: StoreItem) => {
        playClick();
        setCart(prev => {
            const existing = prev.find(i => i.item._id === item._id);
            if (existing) {
                return prev.map(i =>
                    i.item._id === item._id ? { ...i, qtd: i.qtd + 1 } : i
                );
            }
            return [...prev, { item, qtd: 1 }];
        });
        toast.success(`${item.nome} adicionado ao caldeirão!`, { icon: '🛒', duration: 2000 });
    };

    const removeFromCart = (itemId: string) => {
        playClick();
        setCart(prev => prev.filter(i => i.item._id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.item._id === itemId) {
                const newQtd = Math.max(1, i.qtd + delta);
                return { ...i, qtd: newQtd };
            }
            return i;
        }));
    };

    const buyIndividual = async (item: StoreItem) => {
        if (!user) return;
        if (user.saldoPc < item.preco) {
            playError();
            return toast.error("Saldo insuficiente!", {
                description: `Você precisa de ${item.preco} PC$, mas tem apenas ${user.saldoPc} PC$`
            });
        }
        if (!confirm(`Comprar ${item.nome} para a Sala?\n\nO valor será debitado do seu saldo pessoal.`)) return;

        setProcessing(true);
        try {
            await buyIndividualMutation.mutateAsync(item._id);
        } finally {
            setProcessing(false);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        const total = cart.reduce((acc, curr) => acc + (curr.item.preco * curr.qtd), 0);
        const rateio = Math.ceil(total / numAlunos);

        if (!confirm(
            `🛒 CONFIRMAR COMPRA COLETIVA?\n\n` +
            `💰 Total: ${total.toLocaleString()} PC$\n` +
            `👥 Rateio: ${rateio} PC$ por aluno (${numAlunos} alunos)\n\n` +
            `O valor será dividido igualmente entre todos os alunos da sala.`
        )) return;

        setProcessing(true);
        try {
            const payload = { 
                items: cart.map(c => ({ itemId: c.item._id, quantity: c.qtd })) 
            };
            await checkoutMutation.mutateAsync(payload);
        } finally {
            setProcessing(false);
        }
    };

    // ==================== RENDER ====================

    // 🔒 TELA DE BLOQUEIO
    if (isClosed) {
        return (
            <PageTransition className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 animate-pulse pointer-events-none"></div>
                
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-black/60 backdrop-blur-xl border-4 border-red-900/50 rounded-3xl p-10 text-center relative shadow-[0_0_100px_rgba(220,38,38,0.2)]"
                >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border-4 border-red-900 rounded-full p-6 shadow-2xl">
                        <Store size={48} className="text-red-500" />
                    </div>
                    
                    <h1 className="font-press text-2xl text-red-500 mt-8 mb-4 uppercase">BECO FECHADO</h1>
                    <p className="font-vt323 text-2xl text-slate-400 mb-8 leading-relaxed">
                        Os duendes de Gringotts estão fazendo o balanço do estoque.
                        <br/><br/>
                        <span className="text-red-400 text-lg">A loja reabrirá em breve.</span>
                    </p>

                    <button 
                        onClick={() => navigate('/taca-das-casas')}
                        className="w-full py-4 bg-red-900/40 hover:bg-red-900/60 border-2 border-red-800 text-red-200 font-press text-xs rounded-xl transition-all uppercase tracking-widest"
                    >
                        VOLTAR PARA O HALL
                    </button>
                </motion.div>
            </PageTransition>
        );
    }

    return (
        <PageTransition className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden">
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className={cn("absolute inset-0 bg-gradient-radial", currentShop.gradient)}
                    style={{ background: `radial-gradient(circle at top right, var(--tw-gradient-stops))` }}
                />
                
                {/* 🔥 OTIMIZAÇÃO: Partículas DESATIVADAS no Mobile */}
                {!isMobile && (
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={cn("absolute w-1 h-1 rounded-full", currentShop.color.replace('text-', 'bg-'))}
                                initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, opacity: 0 }}
                                animate={{ y: [null, Math.random() * -200], opacity: [0, 0.6, 0] }}
                                transition={{ duration: 5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* HEADER */}
            <header className="relative z-10 px-4 pt-20 md:pt-6 pb-6 md:pl-28">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { playClick(); navigate('/taca-das-casas'); }}
                                className="p-3 bg-black/60 border-2 border-purple-500/30 rounded-xl hover:border-purple-400 transition-all backdrop-blur-sm group"
                            >
                                <ChevronLeft className="text-purple-400 group-hover:text-purple-300" />
                            </motion.button>
                            <div>
                                <motion.h1
                                    className="font-press text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 mb-2"
                                    animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                >
                                    BECO DIAGONAL
                                </motion.h1>
                                <p className="font-mono text-xs text-slate-500 tracking-widest">
                                    SUPRIMENTOS MÁGICOS PARA SUA CASA
                                </p>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { playClick(); navigate('/taca-das-casas/mochila'); }}
                                onMouseEnter={playHover}
                                className="p-4 rounded-xl border-2 transition-all backdrop-blur-sm bg-black/40 border-slate-700 hover:border-purple-400 group"
                                title="Mochila da Sala"
                            >
                                <Backpack className="text-slate-400 group-hover:text-purple-400 transition-colors" size={24} />
                            </motion.button>

                            {isRep && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { playClick(); setIsCartOpen(true); }}
                                    onMouseEnter={playHover}
                                    className="relative p-4 rounded-xl border-2 transition-all backdrop-blur-sm bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-600 hover:border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] group"
                                >
                                    <ShoppingCart className="text-yellow-400 group-hover:scale-110 transition-transform" size={24} />
                                    {cart.length > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white font-press text-[10px] flex items-center justify-center rounded-full border-2 border-black shadow-lg"
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* SHOP TABS */}
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                        {SHOPS.map((shop, index) => {
                            const isActive = activeTab === shop.id;
                            const ShopIcon = shop.icon;
                            return (
                                <motion.button
                                    key={shop.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { playClick(); setActiveTab(shop.id); }}
                                    onMouseEnter={playHover}
                                    className={cn(
                                        "flex-shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 rounded-xl border-2 font-vt323 text-lg md:text-xl transition-all uppercase tracking-wide backdrop-blur-sm",
                                        isActive
                                            ? cn(shop.bg, shop.border, shop.color, shop.glow, "scale-105")
                                            : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600"
                                    )}
                                >
                                    <ShopIcon size={20} />
                                    <span className="hidden md:inline">{shop.name}</span>
                                    <span className="md:hidden">{shop.id}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="relative z-10 px-4 pb-24 md:pl-28">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-64 bg-slate-900/50 rounded-xl border border-slate-800"></div>
                                ))}
                            </div>
                        </div>
                    ) : currentItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {currentItems.map((item: StoreItem, index: number) => (
                                    <ItemCard
                                        key={item._id}
                                        item={item}
                                        index={index}
                                        shop={currentShop}
                                        onBuyIndividual={buyIndividual}
                                        onAddToCart={addToCart}
                                        isRep={isRep}
                                        processing={processing}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-32 text-center"
                        >
                            <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border-2 border-dashed border-slate-800 rounded-2xl p-12">
                                <AlertCircle size={64} className="text-slate-600 mx-auto mb-6" />
                                <h3 className="font-press text-sm text-slate-500 mb-2">ESTOQUE ESGOTADO</h3>
                                <p className="font-vt323 text-xl text-slate-600">Esta loja está vazia no momento.</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* CART SIDEBAR */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-gradient-to-b from-yellow-950 to-amber-950 border-l-4 border-yellow-600 z-50 shadow-2xl flex flex-col"
                        >
                            <CartSidebar
                                cart={cart}
                                total={cartTotal}
                                rateio={cartRateio}
                                numAlunos={numAlunos}
                                processing={processing}
                                onClose={() => setIsCartOpen(false)}
                                onRemove={removeFromCart}
                                onUpdateQty={updateQuantity}
                                onCheckout={handleCheckout}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}