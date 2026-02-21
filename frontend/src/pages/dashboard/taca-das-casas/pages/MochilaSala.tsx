import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Trash2, QrCode, X, Loader2, Sparkles, Clock, Ticket,
    ChevronLeft, Check, Users, Gift, Wand2, Wine, Gamepad2, Scroll, BookOpen, Zap, User, ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from "react-qr-code";
import { useNavigate } from 'react-router-dom';

import { api } from '../../../../api/axios-config';
import { useAuth } from '../../../../contexts/AuthContext';
import { PixelCard } from '../../../../components/ui/PixelCard';
import { PixelButton } from '../../../../components/ui/PixelButton';
import { getImageUrl } from '../../../../utils/imageHelper';
import { PageTransition } from '../../../../components/layout/PageTransition';
import { cn } from '../../../../utils/cn';
import { useGameSound } from '../../../../hooks/useGameSound';
import { formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- HELPERS VISUAIS ---
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [hasError, setHasError] = useState(false);
    const finalSrc = getImageUrl(src);

    if (hasError || !src) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-slate-800/50 text-slate-600 border-2 border-slate-700 border-dashed p-2 w-full h-full", className)}>
                <Package size={24} />
                <span className="text-[8px] font-press mt-1 text-center uppercase tracking-widest text-slate-500">
                    {alt?.substring(0, 10) || 'ITEM'}
                </span>
            </div>
        );
    }
    return <img src={finalSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
};

const ExpirationTimer = ({ date }: { date: string | Date }) => {
    const [label, setLabel] = useState("CALCULANDO...");
    const [isExpired, setIsExpired] = useState(false);

    useState(() => {
        const update = () => {
            const targetDate = new Date(date);
            if (!isValid(targetDate)) { setLabel("DATA INVÁLIDA"); return; }
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            if (diff <= 0) { setLabel("EXPIRADO"); setIsExpired(true); return; }
            const distance = formatDistanceToNow(targetDate, { locale: ptBR, addSuffix: true });
            setLabel(distance.replace('em ', '').toUpperCase());
            setIsExpired(false);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    });

    return (
        <div className={cn("flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded border",
            isExpired ? "bg-red-900/50 border-red-800 text-red-300" : "bg-blue-900/30 border-blue-800 text-blue-300"
        )}>
            <Clock size={10} /> <span>{label}</span>
        </div>
    );
};

const CATEGORIES_ICONS = [
    { id: 'ALL', label: 'TODAS LOJAS', icon: Package },
    { id: 'VASSOURAS', label: 'VASSOURAS', icon: Zap },
    { id: 'VARINHAS', label: 'VARINHAS', icon: Wand2 },
    { id: 'POCOES', label: 'POÇÕES', icon: Wine },
    { id: 'MAROTO', label: 'MAROTO', icon: Gamepad2 },
    { id: 'MINISTERIO', label: 'MINISTÉRIO', icon: Scroll },
    { id: 'MAGIC_BOOK', label: 'LIVROS', icon: BookOpen },
];

export function MochilaSala() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { playClick, playSuccess, playError } = useGameSound();
    const queryClient = useQueryClient();

    // Estados de UI (mantidos)
    const [viewMode, setViewMode] = useState<'ITEMS' | 'TICKETS'>('ITEMS');
    const [filterOrigin, setFilterOrigin] = useState<'ALL' | 'COLETIVO' | 'DOACAO'>('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [ticketModal, setTicketModal] = useState<any>(null);

    // ==================== QUERIES ====================

    // Query 1: Inventário da Sala (só busca quando viewMode === 'ITEMS')
    const {
        data: items = [],
        isLoading: itemsLoading
    } = useQuery({
        queryKey: ['roomInventory', user?.turma],
        queryFn: async () => {
            if (!user?.turma) return [];
            const encoded = encodeURIComponent(user.turma.trim());
            const res = await api.get(`/classrooms/${encoded}/inventory`);
            // Filtra itens válidos (não expirados)
            const validItems = res.data.filter((i: any) =>
                !i.expiresAt || new Date(i.expiresAt) > new Date()
            );
            return validItems;
        },
        enabled: !!user?.turma && viewMode === 'ITEMS', // Só busca se tiver turma e viewMode correto
        staleTime: 3 * 60 * 1000, // 3 minutos
    });

    // Query 2: Tickets da Sala (só busca quando viewMode === 'TICKETS')
    const {
        data: tickets = [],
        isLoading: ticketsLoading
    } = useQuery({
        queryKey: ['roomTickets'],
        queryFn: async () => {
            const res = await api.get('/tickets/room-tickets');
            return res.data || [];
        },
        enabled: viewMode === 'TICKETS', // Só busca quando na aba de tickets
        staleTime: 2 * 60 * 1000, // 2 minutos
    });

    // ==================== MUTATIONS ====================

    // Mutation 1: Usar Item (Gerar Ticket)
    const useItemMutation = useMutation({
        mutationFn: async (slotId: string) => {
            return await api.post('/inventory/use-room-item', {
                slotId,
                classroomId: user?.turma
            });
        },
        onSuccess: (response) => {
            playSuccess();
            setTicketModal(response.data.ticket);
            setSelectedItem(null);
            setViewMode('TICKETS'); // Muda para aba de tickets
            toast.success("TICKET GERADO!");

            // Invalida ambas as queries (ticket foi criado, item foi removido)
            queryClient.invalidateQueries({ queryKey: ['roomTickets'] });
            queryClient.invalidateQueries({ queryKey: ['roomInventory', user?.turma] });
        },
        onError: (error: any) => {
            playError();
            toast.error(error.response?.data?.error || "Erro ao gerar ticket.");
        }
    });

    // Mutation 2: Cancelar Ticket
    const cancelTicketMutation = useMutation({
        mutationFn: async (ticketId: string) => {
            return await api.delete(`/tickets/${ticketId}`);
        },
        onSuccess: () => {
            playClick();
            toast.success("Ticket cancelado.");
            setTicketModal(null);

            // Invalida tickets para atualizar lista
            queryClient.invalidateQueries({ queryKey: ['roomTickets'] });
        },
        onError: () => {
            toast.error("Erro ao cancelar.");
        }
    });

    // Mutation 3: Descartar Item da Sala
    const discardItemMutation = useMutation({
        mutationFn: async (slotId: string) => {
            return await api.delete(`/inventory/room-item/${slotId}`);
        },
        onSuccess: () => {
            playClick();
            toast.success("Item descartado.");
            setSelectedItem(null);

            // Invalida inventário para atualizar lista
            queryClient.invalidateQueries({ queryKey: ['roomInventory', user?.turma] });
        },
        onError: (error: any) => {
            playError();
            toast.error(error.response?.data?.message || "Erro ao descartar.");
        }
    });

    // ==================== HANDLERS ====================

    const handleUseItem = async () => {
        if (!selectedItem) return;
        await useItemMutation.mutateAsync(selectedItem._id);
    };

    const handleCancelTicket = async (ticketId: string) => {
        if (!confirm("Cancelar ticket e devolver item?")) return;
        await cancelTicketMutation.mutateAsync(ticketId);
    };

    const handleDiscardRoomItem = async () => {
        if (!selectedItem) return;
        if (!confirm("Tem certeza? O item será destruído para sempre.")) return;
        await discardItemMutation.mutateAsync(selectedItem._id);
    };

    // ==================== DERIVAÇÕES ====================

    const loading = viewMode === 'ITEMS' ? itemsLoading : ticketsLoading;

    const filteredItems = items.filter((item: any) => {
        if (filterOrigin === 'COLETIVO' && item.origin !== 'COMPRA_COLETIVA') return false;
        if (filterOrigin === 'DOACAO' && item.origin !== 'COMPRA_INDIVIDUAL') return false;
        if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
        return true;
    });

    // ==================== RENDER ====================

    return (
        <PageTransition className="min-h-screen bg-[#050505] text-slate-200 p-4 pb-24 md:pl-28 pt-20 relative">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/taca-das-casas')} className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors group">
                        <ChevronLeft className="text-slate-400 group-hover:text-white" />
                    </button>
                    <div>
                        <h1 className="font-vt323 text-4xl md:text-5xl text-yellow-500 drop-shadow-md uppercase leading-none">SALA COMUNAL</h1>
                        <p className="font-mono text-xs text-slate-400 mt-1 tracking-widest uppercase">Inventário da Turma {user?.turma}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* 🔥 BOTÃO NOVO: VISITAR O BECO DIAGONAL (NO HEADER) */}
                    <button
                        onClick={() => { playClick(); navigate('/beco-diagonal'); }}
                        className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 hover:from-purple-800/60 hover:to-fuchsia-800/60 border border-purple-500/30 text-purple-300 hover:text-white font-press text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:scale-105"
                    >
                        <ShoppingCart size={14} className="text-purple-400" /> BECO DIAGONAL
                    </button>

                    <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700 backdrop-blur-md w-full sm:w-auto">
                        <button onClick={() => setViewMode('ITEMS')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg font-press text-[10px] flex items-center justify-center gap-2 transition-all", viewMode === 'ITEMS' ? "bg-yellow-500 text-black shadow-lg" : "text-slate-500 hover:text-white")}>
                            <Package size={14} /> ITENS
                        </button>
                        <button onClick={() => setViewMode('TICKETS')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg font-press text-[10px] flex items-center justify-center gap-2 transition-all", viewMode === 'TICKETS' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white")}>
                            <Ticket size={14} /> TICKETS ({tickets.length})
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                    <p className="font-vt323 text-2xl text-slate-500 animate-pulse uppercase">Acessando cofre...</p>
                </div>
            ) : viewMode === 'ITEMS' ? (
                <>
                    <div className="flex gap-2 mb-4 relative z-10">
                        <button onClick={() => setFilterOrigin('ALL')} className={cn("flex-1 py-3 border-b-2 font-press text-[10px] transition-all", filterOrigin === 'ALL' ? "border-white text-white bg-white/5" : "border-slate-800 text-slate-500 hover:text-slate-300")}>TUDO</button>
                        <button onClick={() => setFilterOrigin('COLETIVO')} className={cn("flex-1 py-3 border-b-2 font-press text-[10px] transition-all flex items-center justify-center gap-2", filterOrigin === 'COLETIVO' ? "border-yellow-500 text-yellow-400 bg-yellow-900/10" : "border-slate-800 text-slate-500 hover:text-slate-300")}><Users size={12} /> COLETIVOS</button>
                        <button onClick={() => setFilterOrigin('DOACAO')} className={cn("flex-1 py-3 border-b-2 font-press text-[10px] transition-all flex items-center justify-center gap-2", filterOrigin === 'DOACAO' ? "border-pink-500 text-pink-400 bg-pink-900/10" : "border-slate-800 text-slate-500 hover:text-slate-300")}><Gift size={12} /> CONQUISTAS</button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-6 relative z-10">
                        {CATEGORIES_ICONS.map(cat => (
                            <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded border transition-all font-mono text-xs whitespace-nowrap uppercase", filterCategory === cat.id ? "bg-slate-800 border-white text-white" : "bg-black/20 border-slate-800 text-slate-500 hover:border-slate-600")}>
                                <cat.icon size={14} /> {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.length > 0 ? filteredItems.map((slot: any) => {
                                const ownerId = slot.acquiredBy?._id || slot.acquiredBy;
                                const isMine = ownerId === user?._id;
                                const ownerName = slot.acquiredBy?.nome?.split(' ')[0] || 'Anônimo';

                                return (
                                    <motion.div key={slot._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={() => { playClick(); setSelectedItem(slot); }}>
                                        <PixelCard className={cn("h-full cursor-pointer flex flex-col p-0 overflow-hidden relative group hover:-translate-y-1 transition-all border-2", isMine ? "border-green-500/50 hover:border-green-500 bg-green-950/10" : "border-slate-800 hover:border-slate-600")}>
                                            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                                                {isMine ? (
                                                    <span className="bg-green-600 text-white text-[8px] font-press px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase"><Check size={8} /> Seu Item</span>
                                                ) : (
                                                    <span className="bg-slate-800/90 text-slate-300 text-[8px] font-mono px-2 py-1 rounded border border-white/10 flex items-center gap-1"><User size={8} /> {ownerName}</span>
                                                )}
                                            </div>
                                            <div className="h-32 bg-black/40 flex items-center justify-center p-4 relative">
                                                <SafeImage src={slot.image || slot.imagem} alt={slot.name} className="h-20 w-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform" />
                                                {slot.quantity > 1 && <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-600">x{slot.quantity}</div>}
                                            </div>
                                            <div className="p-3 flex-1 flex flex-col bg-slate-950/50 border-t border-white/5">
                                                <h3 className="font-vt323 text-lg text-white leading-none mb-2 line-clamp-2 uppercase">{slot.name}</h3>
                                                <div className="mt-auto">
                                                    {slot.expiresAt ? <ExpirationTimer date={slot.expiresAt} /> : <div className="flex items-center gap-1 text-[9px] font-mono text-green-400 px-2 py-1 bg-green-900/10 border border-green-800/30 rounded w-fit"><Sparkles size={10} /> <span>PERMANENTE</span></div>}
                                                </div>
                                            </div>
                                        </PixelCard>
                                    </motion.div>
                                );
                            }) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 bg-slate-900/20 rounded-2xl relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent pointer-events-none" />

                                    <Package className="w-20 h-20 text-slate-700 mb-6 drop-shadow-2xl" />
                                    <h3 className="font-vt323 text-3xl md:text-4xl text-slate-400 mb-2 uppercase tracking-widest">O Baú da Turma está Vazio</h3>
                                    <p className="font-mono text-xs text-slate-500 mb-8 max-w-sm text-center">
                                        Nenhum item mágico foi comprado ou conquistado pela sua sala ainda. Que tal fazer uma vaquinha?
                                    </p>

                                    {/* 🔥 BOTÃO GIGANTE PRO BECO QUANDO TÁ VAZIO */}
                                    <button
                                        onClick={() => { playClick(); navigate('/beco-diagonal'); }}
                                        className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-press text-xs rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 bg-white/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <ShoppingCart size={18} className="relative z-10" />
                                        <span className="relative z-10 tracking-widest">VISITAR BECO DIAGONAL</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {tickets.length > 0 ? tickets.map((ticket: any) => {
                        const isUsed = ticket.status === 'USADO';

                        return (
                            <PixelCard
                                key={ticket._id}
                                className={cn(
                                    "flex flex-col p-4 relative group transition-all",
                                    isUsed
                                        ? "bg-slate-900/40 border-slate-800 opacity-60"
                                        : "bg-blue-900/10 border-blue-500/30 hover:bg-blue-900/20"
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-20 h-20 rounded-lg flex items-center justify-center p-2 border shrink-0",
                                        isUsed ? "bg-slate-800 border-slate-700 grayscale" : "bg-black/50 border-blue-500/20"
                                    )}>
                                        <SafeImage src={ticket.itemImagem} alt={ticket.itemNome} className="w-full h-full object-contain" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn("font-vt323 text-xl uppercase leading-none mb-1", isUsed ? "text-slate-500 line-through" : "text-blue-300")}>
                                            {ticket.itemNome}
                                        </h3>

                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-mono text-[10px] text-slate-400">
                                                Dono: <span className="text-white uppercase">{ticket.user?.nome?.split(' ')[0]}</span>
                                            </p>
                                            {isUsed && (
                                                <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700 uppercase font-mono">
                                                    USADO
                                                </span>
                                            )}
                                        </div>

                                        {!isUsed && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setTicketModal(ticket)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-press text-[9px] py-2 rounded flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-tighter">
                                                    <QrCode size={12} /> Ver Código
                                                </button>
                                                <button onClick={() => handleCancelTicket(ticket._id)} className="px-3 bg-red-900/20 border border-red-500/30 hover:bg-red-900/50 text-red-400 rounded transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PixelCard>
                        );
                    }) : (
                        <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-slate-800 rounded-xl uppercase font-vt323 text-xl text-slate-500">
                            Nenhum ticket encontrado
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE ITEM SELECIONADO */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setSelectedItem(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <PixelCard className="border-2 border-yellow-500 bg-slate-950 p-0 overflow-hidden relative shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                                <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 text-slate-400 hover:text-white z-10 bg-black/50 p-1 rounded-full transition-colors"><X size={20} /></button>
                                <div className="bg-gradient-to-b from-slate-900 to-black p-10 flex justify-center border-b border-slate-800 shadow-inner">
                                    <SafeImage src={selectedItem.image || selectedItem.imagem} alt={selectedItem.name} className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
                                </div>
                                <div className="p-6 text-center space-y-4 bg-slate-950">
                                    <div>
                                        <h2 className="font-vt323 text-4xl text-yellow-400 uppercase leading-none mb-3">{selectedItem.name}</h2>
                                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1 rounded-full uppercase">
                                            <User size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-press text-slate-300">Dono: {selectedItem.acquiredBy?.nome || 'Turma'}</span>
                                        </div>
                                        <p className="font-vt323 text-xl text-slate-400 leading-tight mt-4 uppercase">{selectedItem.description || selectedItem.descricao || "Sem detalhes adicionais."}</p>

                                        <div className="mt-4 flex justify-center">
                                            {selectedItem.expiresAt ? <ExpirationTimer date={selectedItem.expiresAt} /> : <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest border border-green-900/50 px-3 py-1 rounded bg-green-900/10">Item Permanente</span>}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {(selectedItem.acquiredBy?._id === user?._id || selectedItem.acquiredBy === user?._id) && (
                                            <button
                                                onClick={handleDiscardRoomItem}
                                                className="px-4 bg-red-900/20 border border-red-500/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors flex items-center justify-center"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}

                                        <PixelButton onClick={handleUseItem} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-press text-xs h-14 uppercase tracking-widest active:translate-y-1 transition-all">
                                            <QrCode size={20} className="mr-2" /> Gerar Código
                                        </PixelButton>
                                    </div>
                                </div>
                            </PixelCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL DE QR CODE */}
            <AnimatePresence>
                {ticketModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl" onClick={() => setTicketModal(null)}>
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-black p-8 rounded-lg max-w-sm w-full text-center border-[8px] border-yellow-500 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-press px-6 py-2 border-4 border-black shadow-lg text-[10px] whitespace-nowrap uppercase tracking-tighter">Ticket Ativado</div>
                            <h2 className="font-vt323 text-4xl uppercase mb-2 mt-4 leading-none text-slate-900">{ticketModal.itemNome}</h2>
                            <p className="font-mono text-xs text-slate-500 mb-6 bg-slate-100 p-2 rounded border border-slate-200">ID: {ticketModal.hash}</p>
                            <div className="bg-white p-4 border-4 border-slate-900 mb-6 inline-block shadow-inner"><QRCode value={ticketModal.hash} size={180} /></div>
                            <p className="font-press text-[9px] text-gray-400 leading-relaxed uppercase">Apresente este código para o mestre da sala</p>
                            <button onClick={() => setTicketModal(null)} className="absolute top-3 right-3 text-slate-300 hover:text-black transition-colors"><X size={24} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}