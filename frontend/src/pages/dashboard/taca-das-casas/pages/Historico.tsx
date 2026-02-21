import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, 
    History as HistoryIcon, 
    ShieldAlert,
    Clock,
    User,
    Loader2,
    AlertCircle,
    BellRing,
    Gavel
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../api/axios-config';
import { PageTransition } from '../../../../components/layout/PageTransition';
import { cn } from '../../../../utils/cn';

// Tipagem blindada contra o erro de ReactNode
interface GlobalPunishment {
    _id: string;
    type: 'PUNIÇÃO' | 'DECRETO' | 'AVISO';
    reason: string;
    pointsDeducted: number;
    house: { nome: string, serie: string } | string; // Aceita Obj ou String
    appliedBy: { nome: string };
    appliedAt: string;
}

export function Historico() {
    const navigate = useNavigate();

    // ==================== QUERIES ====================
    const { 
        data: actions = [], 
        isLoading,
        isError 
    } = useQuery({
        queryKey: ['globalPunishments'],
        queryFn: async () => {
            const res = await api.get('/house/punitions');
            return res.data as GlobalPunishment[];
        },
        staleTime: 5 * 60 * 1000,
    });

    // ==================== HELPERS ====================
    const getActionStyle = (tipo: string) => {
        if (tipo === 'DECRETO') return { icon: Gavel, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' };
        if (tipo === 'AVISO') return { icon: BellRing, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' };
        return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' };
    };

    // Helper para extrair o nome da casa seguramente e resolver o Type Error
    const getHouseName = (houseData: any) => {
        if (typeof houseData === 'string') return houseData === 'TODAS' ? 'ESCOLA INTEIRA' : houseData;
        if (houseData?.serie === 'TODAS') return 'ESCOLA INTEIRA';
        return houseData?.serie || 'DESCONHECIDO';
    };

    // ==================== RENDER ====================

    return (
        <PageTransition className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden">
            
            {/* Background Decorativo */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

           {/* Header */}
            <header className="relative z-10 px-4 pt-20 md:pt-6 pb-6 md:pl-28">
                <div className="max-w-4xl mx-auto flex items-center gap-4 mb-8">
                    
                    <button onClick={() => navigate('/taca-das-casas')} className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                        <ChevronLeft className="text-slate-400" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <HistoryIcon size={32} className="text-red-500" />
                        </div>
                        
                        <div>
                            <h1 className="font-vt323 text-4xl md:text-5xl text-white drop-shadow-md uppercase leading-none">
                                DECRETOS E <span className="text-red-500">PUNIÇÕES</span>
                            </h1>
                            <p className="font-mono text-xs text-slate-400 mt-1 tracking-widest uppercase">
                                // MURAL DE AVISOS GLOBAIS DA ESCOLA
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Timeline */}
            <main className="relative z-10 px-4 pb-24 md:pl-28">
                <div className="max-w-4xl mx-auto">
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                            <p className="font-press text-xs text-slate-500 animate-pulse">LENDO OS DECRETOS...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle size={48} className="text-red-500 mb-4" />
                            <h3 className="font-press text-sm text-red-400 mb-2">FALHA NA LEITURA</h3>
                            <p className="font-vt323 text-xl text-slate-500">Não foi possível acessar as crônicas.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 space-y-8">
                            {actions.length > 0 ? actions.map((action, index) => {
                                const style = getActionStyle(action.type);
                                const Icon = style.icon;

                                return (
                                    <motion.div 
                                        key={action._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative pl-8 md:pl-12"
                                    >
                                        {/* Dot na linha do tempo */}
                                        <div className={cn("absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 bg-[#050505]", style.border, style.color)} />

                                        {/* Card do Evento */}
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 hover:bg-slate-900 transition-colors group">
                                            <div className="flex items-start justify-between gap-4">
                                                
                                                <div className="flex gap-4 w-full">
                                                    {/* Ícone Grande */}
                                                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border", style.bg, style.border, style.color)}>
                                                        <Icon size={24} />
                                                    </div>

                                                    <div className="flex-1">
                                                        {/* Título: Turma + Ação */}
                                                        <div className="flex justify-between items-start w-full">
                                                            <h3 className="font-press text-[10px] md:text-xs text-white mb-2 leading-relaxed">
                                                                {/* 🔥 CORREÇÃO DO TYPESCRIPT APLICADA AQUI 🔥 */}
                                                                <span className={style.color}>
                                                                    {getHouseName(action.house)}
                                                                </span> 
                                                                <span className="text-slate-500 ml-2">[{action.type}]</span>
                                                            </h3>

                                                            {/* Valor (Se houver punição) */}
                                                            {action.pointsDeducted > 0 && (
                                                                <div className="font-vt323 text-3xl text-red-500 whitespace-nowrap">
                                                                    -{action.pointsDeducted}
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Motivo */}
                                                        <p className="font-vt323 text-xl text-slate-300 leading-tight mb-3">
                                                            "{action.reason}"
                                                        </p>

                                                        {/* Meta Info */}
                                                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <User size={10} /> 
                                                                {action.appliedBy?.nome?.split(' ')[0] || 'Tribunal'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {new Date(action.appliedAt).toLocaleDateString('pt-BR')} às {new Date(action.appliedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="pl-8 py-12">
                                    <div className="max-w-md bg-black/40 backdrop-blur-xl border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center">
                                        <ShieldAlert size={56} className="text-green-500/50 mx-auto mb-4" />
                                        <p className="font-vt323 text-2xl text-green-400">Nenhum decreto ou punição no histórico recente.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </PageTransition>
    );
}