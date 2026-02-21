// ARQUIVO: frontend/src/components/features/TradeManagerModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Check, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { PixelCard } from '../ui/PixelCard';
import { PixelButton } from '../ui/PixelButton';
import { getImageUrl } from '../../utils/imageHelper';
import { cn } from '../../utils/cn';

interface TradeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TradeManagerModal({ isOpen, onClose }: TradeManagerModalProps) {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [selectedTrade, setSelectedTrade] = useState<any>(null);

    // 1. BUSCAR TROCAS
    const { data: trades = [], isLoading } = useQuery({
        queryKey: ['trades', 'my'],
        queryFn: async () => {
            const res = await api.get('/trade/my');
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: isOpen,
        staleTime: 10000,
    });

    // 2. ACEITAR TROCA
    const acceptMutation = useMutation({
        mutationFn: async (tradeId: string) => {
            await api.post('/trade/accept', { tradeId });
        },
        onSuccess: () => {
            toast.success("TROCA ACEITA! 🎉");
            queryClient.invalidateQueries({ queryKey: ['trades', 'my'] });
            refreshUser();
            setSelectedTrade(null);
        },
        onError: (error: any) => {
            toast.error("FALHA AO ACEITAR ❌", { description: error.response?.data?.error || "Erro desconhecido." });
        }
    });

    // 3. RECUSAR/CANCELAR TROCA
    const cancelMutation = useMutation({
        mutationFn: async (tradeId: string) => {
            await api.delete(`/trade/${tradeId}`);
        },
        onSuccess: () => {
            toast.info("Troca cancelada/recusada.");
            queryClient.invalidateQueries({ queryKey: ['trades', 'my'] });
            setSelectedTrade(null);
        },
        onError: () => {
            toast.error("Erro ao cancelar troca.");
        }
    });

    if (!isOpen) return null;

    const myId = user?._id;
    const sentTrades = trades.filter((t: any) => t.initiator?._id === myId);
    const receivedTrades = trades.filter((t: any) => t.target?._id === myId);

    // Subcomponente de lista
    const TradeList = ({ title, list, isSent }: { title: string, list: any[], isSent: boolean }) => (
        <div className="mb-6">
            <h3 className="font-vt323 text-xl text-slate-400 border-b border-slate-700 pb-1 mb-3 uppercase tracking-widest">{title}</h3>
            {list.length === 0 ? (
                <p className="font-mono text-xs text-slate-600 italic">Nenhuma solicitação.</p>
            ) : (
                <div className="space-y-2">
                    {list.map((trade) => {
                        const otherUser = isSent ? trade.target : trade.initiator;
                        return (
                            <div key={trade._id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-between items-center hover:border-slate-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", isSent ? "bg-blue-900/20 border-blue-500" : "bg-purple-900/20 border-purple-500")}>
                                        <ArrowRightLeft size={14} className={isSent ? "text-blue-400" : "text-purple-400"} />
                                    </div>
                                    <div>
                                        <p className="font-vt323 text-xl text-white leading-none">{otherUser?.nome?.split(' ')[0]}</p>
                                        <p className="font-mono text-[10px] text-slate-400">{otherUser?.turma || 'Turma N/A'}</p>
                                    </div>
                                </div>
                                <PixelButton onClick={() => setSelectedTrade(trade)} className="px-3 py-1.5 text-[10px]">
                                    VER
                                </PixelButton>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Subcomponente de detalhes do Oferente
    const OfferSide = ({ title, offer, userName }: { title: string, offer: any, userName: string }) => (
        <div className="flex-1 bg-black/40 border border-slate-700 rounded p-3">
            <p className="font-vt323 text-lg text-slate-400 text-center mb-2">{title} <br/><span className="text-white">{userName}</span></p>
            <div className="space-y-2">
                <div className="bg-slate-900 p-2 rounded flex justify-between items-center border border-slate-800">
                    <span className="font-mono text-xs text-slate-500">PC$ Ofertado:</span>
                    <span className="font-vt323 text-xl text-green-400">{offer.pc} PC$</span>
                </div>
                <div className="space-y-1">
                    {offer.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                            <img src={getImageUrl(item.image)} className="w-8 h-8 object-contain bg-black rounded" alt="item" />
                            <div className="flex-1 min-w-0">
                                <p className="font-vt323 text-base text-white truncate leading-none">{item.name}</p>
                                {item.isHouseItem && <span className="text-[8px] bg-purple-900 text-purple-300 px-1 rounded font-press">SALA</span>}
                            </div>
                        </div>
                    ))}
                    {(!offer.items || offer.items.length === 0) && (
                        <p className="font-mono text-[10px] text-slate-600 text-center py-2">Sem itens.</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-3xl">
                        <PixelCard className="bg-slate-900 border-slate-700 shadow-2xl relative flex flex-col max-h-[85vh]">
                            
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                                <h2 className="font-vt323 text-3xl text-white flex items-center gap-2">
                                    <ArrowRightLeft className="text-purple-400" /> GERENCIAR TROCAS
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X /></button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-500" /></div>
                                ) : !selectedTrade ? (
                                    <>
                                        <TradeList title="RECEBIDAS (Para Aceitar)" list={receivedTrades} isSent={false} />
                                        <TradeList title="ENVIADAS (Aguardando eles)" list={sentTrades} isSent={true} />
                                    </>
                                ) : (
                                    /* DETALHES DA TROCA SELECIONADA */
                                    <div className="animate-in fade-in slide-in-from-right-4">
                                        <button onClick={() => setSelectedTrade(null)} className="text-[10px] font-press text-slate-500 hover:text-white mb-4 flex items-center gap-2">
                                            <ArrowRight className="rotate-180" size={12} /> VOLTAR PARA LISTA
                                        </button>
                                        
                                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                                            <OfferSide 
                                                title="OFERTA DE" 
                                                userName={selectedTrade.initiator.nome.split(' ')[0]} 
                                                offer={selectedTrade.offerInitiator} 
                                            />
                                            <div className="flex items-center justify-center shrink-0">
                                                <ArrowRightLeft className="text-slate-600 rotate-90 md:rotate-0" size={32} />
                                            </div>
                                            <OfferSide 
                                                title="EM TROCA DO QUE" 
                                                userName={selectedTrade.target.nome.split(' ')[0]} 
                                                offer={selectedTrade.offerTarget} 
                                            />
                                        </div>

                                        {/* AÇÕES */}
                                        <div className="flex gap-2">
                                            {selectedTrade.target._id === myId ? (
                                                <>
                                                    <PixelButton 
                                                        onClick={() => acceptMutation.mutate(selectedTrade._id)} 
                                                        disabled={acceptMutation.isPending}
                                                        className="flex-1 bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
                                                    >
                                                        {acceptMutation.isPending ? <Loader2 className="animate-spin" /> : <><Check size={16}/> ACEITAR</>}
                                                    </PixelButton>
                                                    <PixelButton 
                                                        onClick={() => cancelMutation.mutate(selectedTrade._id)} 
                                                        disabled={cancelMutation.isPending}
                                                        className="flex-1 bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2"
                                                    >
                                                        {cancelMutation.isPending ? <Loader2 className="animate-spin" /> : <><X size={16}/> RECUSAR</>}
                                                    </PixelButton>
                                                </>
                                            ) : (
                                                <PixelButton 
                                                    onClick={() => cancelMutation.mutate(selectedTrade._id)} 
                                                    disabled={cancelMutation.isPending}
                                                    className="w-full bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2"
                                                >
                                                    {cancelMutation.isPending ? <Loader2 className="animate-spin" /> : <><Trash2 size={16}/> CANCELAR PROPOSTA ENVIADA</>}
                                                </PixelButton>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PixelCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}