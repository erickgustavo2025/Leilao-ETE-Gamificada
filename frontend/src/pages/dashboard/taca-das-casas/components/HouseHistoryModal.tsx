import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, User, Clock, Shield, BellRing, Gavel } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageHelper';

// O Frontend agora aceita os dois formatos para não quebrar
interface HistoryItem {
    _id: string;
    tipo?: string; 
    type?: string;
    valor?: number;
    pointsDeducted?: number;
    motivo?: string;
    reason?: string;
    autor?: { nome: string };
    appliedBy?: { nome: string };
    data?: string;
    appliedAt?: string;
}

interface HouseHistoryModalProps {
    house: any | null;
    history: HistoryItem[];
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
}

export function HouseHistoryModal({ house, history, isOpen, onClose, loading }: HouseHistoryModalProps) {
    if (!isOpen || !house) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl bg-[#0a0a0f] border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-black flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-600 overflow-hidden bg-black shrink-0">
                            <img 
                                src={getImageUrl(house.logo)} 
                                alt={house.nome} 
                                className="w-full h-full object-cover"
                                onError={(e) => (e.target as HTMLImageElement).src = '/assets/etegamificada.png'}
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-press text-xl text-white uppercase">{house.nome}</h2>
                            <p className="font-mono text-[10px] text-slate-400 mt-1">{house.serie} • EXTRATO DE AÇÕES E DECRETOS</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500 hover:text-white rounded-full transition-colors shrink-0">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 font-press text-xs text-slate-500 animate-pulse">
                                CARREGANDO PERGAMINHOS...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Shield size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-vt323 text-2xl text-slate-400">O quadro de avisos está limpo.</p>
                            </div>
                        ) : (
                            history.map((item, i) => {
                                // NORMALIZAÇÃO DOS DADOS (Trata o inglês e o português)
                                const isPunishmentLog = !!item.type; // Se tiver 'type', veio do Tribunal
                                
                                const actionType = item.type || item.tipo || 'DESCONHECIDO';
                                const motivo = item.reason || item.motivo || 'Sem motivo detalhado';
                                const autorName = item.appliedBy?.nome || item.autor?.nome || 'Sistema';
                                const dateStr = item.appliedAt || item.data || new Date().toISOString();
                                
                                // O valor da punição vem sempre positivo do banco, então subtraímos visualmente
                                const valorBruto = item.pointsDeducted !== undefined ? item.pointsDeducted : (item.valor || 0);
                                const isNegative = isPunishmentLog ? valorBruto > 0 : valorBruto < 0;
                                const valorDisplay = isPunishmentLog ? -valorBruto : valorBruto;

                                // Cores Dinâmicas
                                let iconStyle = "bg-slate-900/50 border-slate-700 text-slate-400";
                                let IconTag = Shield;

                                if (actionType === 'DECRETO') {
                                    iconStyle = "bg-purple-900/20 border-purple-500/30 text-purple-400";
                                    IconTag = Gavel;
                                } else if (actionType === 'AVISO') {
                                    iconStyle = "bg-yellow-900/20 border-yellow-500/30 text-yellow-400";
                                    IconTag = BellRing;
                                } else if (isNegative) {
                                    iconStyle = "bg-red-900/20 border-red-500/30 text-red-400";
                                    IconTag = TrendingDown;
                                } else {
                                    iconStyle = "bg-green-900/20 border-green-500/30 text-green-400";
                                    IconTag = TrendingUp;
                                }

                                return (
                                    <motion.div 
                                        key={item._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:bg-slate-800/60 transition-colors"
                                    >
                                        {/* Icone */}
                                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2", iconStyle)}>
                                            <IconTag size={20} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={cn(
                                                    "font-press text-[8px] px-2 py-0.5 rounded uppercase",
                                                    iconStyle.replace('bg-', 'bg-').replace('border-', 'border-') // Reusa as cores
                                                )}>
                                                    {actionType}
                                                </span>

                                                {/* Valor numérico */}
                                                {valorDisplay !== 0 && (
                                                    <div className={cn(
                                                        "font-press text-xs text-right whitespace-nowrap",
                                                        isNegative ? "text-red-500" : "text-green-500"
                                                    )}>
                                                        {valorDisplay > 0 ? '+' : ''}{valorDisplay}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="font-vt323 text-xl text-white mt-2 leading-tight">"{motivo}"</p>
                                            
                                            <div className="flex items-center gap-4 mt-2 border-t border-slate-800/50 pt-2">
                                                <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500 uppercase">
                                                    <User size={10} className="text-slate-600" />
                                                    {autorName.split(' ')[0]}
                                                </div>
                                                <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500 uppercase">
                                                    <Clock size={10} className="text-slate-600" />
                                                    {new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}