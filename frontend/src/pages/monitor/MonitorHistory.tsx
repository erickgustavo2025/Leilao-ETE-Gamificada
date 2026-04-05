import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowLeft, PlusCircle, MinusCircle, Info, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';

interface LogEntry {
    _id: string;
    target: {
        nome: string;
        turma: string;
    };
    details: string;
    createdAt: string;
}

export function MonitorHistory() {
    const navigate = useNavigate();

    // ==================== QUERIES ====================
    
    const { 
        data: logs = [], 
        isLoading,
        isError 
    } = useQuery({
        queryKey: ['monitorLogs'],
        queryFn: async () => {
            const res = await api.get('/users/monitor/logs');
            return res.data as LogEntry[];
        },
        staleTime: 3 * 60 * 1000, // 3 minutos
    });

    // ==================== HELPERS ====================
    
    const getLogType = (details: string) => {
        if (details.includes('Adicionou')) return 'add';
        if (details.includes('Removeu')) return 'remove';
        return 'info';
    };

    // ==================== RENDER ====================

    return (
        <PageTransition>
            <div className="mb-6">
                <button 
                    onClick={() => navigate('/monitor')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white font-press text-xs mb-4 transition-colors"
                >
                    <ArrowLeft size={16} /> VOLTAR
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <Clock className="text-yellow-500" size={24} />
                    </div>
                    <div>
                        <h2 className="font-vt323 text-3xl text-white leading-none">HISTÓRICO</h2>
                        <p className="text-slate-500 text-xs font-mono">Suas últimas 50 ações registradas</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                    <p className="text-yellow-600 font-press text-xs animate-pulse">
                        BUSCANDO REGISTROS NO SERVIDOR...
                    </p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-red-800 rounded-xl bg-red-900/10">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <p className="text-red-400 font-press text-sm mb-2">ERRO AO CARREGAR</p>
                    <p className="text-slate-500 font-mono text-xs">Não foi possível buscar os registros.</p>
                </div>
            ) : logs.length > 0 ? (
                <div className="space-y-3">
                    {logs.map(log => {
                        const type = getLogType(log.details);
                        const valueMatch = log.details.match(/(\d+)\s*PC\$/);
                        const value = valueMatch ? valueMatch[1] : '???';

                        // Seleciona o ícone baseado no tipo
                        const StatusIcon = type === 'add' ? PlusCircle : type === 'remove' ? MinusCircle : Info;
                        const statusColor = type === 'add' ? 'text-green-500' : type === 'remove' ? 'text-red-500' : 'text-blue-500';

                        return (
                            <PixelCard 
                                key={log._id} 
                                className={cn(
                                    "p-4 border-l-4 bg-slate-900/50 flex items-center justify-between group hover:bg-slate-900 transition-colors",
                                    type === 'add' ? "border-l-green-500" : "border-l-red-500"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn("mt-1 p-2 rounded-full bg-slate-950 border border-slate-800", statusColor)}>
                                        <StatusIcon size={20} />
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-sm">{log.target?.nome || 'Aluno Desconhecido'}</span>
                                            <span className="text-[10px] bg-black px-1.5 py-0.5 rounded text-slate-400 font-mono border border-slate-800">
                                                {log.target?.turma || 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono truncate w-48 md:w-auto leading-relaxed">
                                            {log.details.split('Motivo:')[1] || log.details}
                                        </p>
                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600">
                                            <Clock size={10} />
                                            {new Date(log.createdAt).toLocaleString('pt-BR', { 
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className={cn(
                                    "font-vt323 text-3xl px-3 py-1 rounded min-w-[80px] text-center ml-2",
                                    type === 'add' ? "text-green-400 bg-green-900/10 border border-green-900/30" : "text-red-400 bg-red-900/10 border border-red-900/30"
                                )}>
                                    {type === 'add' ? '+' : '-'}{value}
                                </div>
                            </PixelCard>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                    <div className="p-4 bg-slate-800 rounded-full mb-4 opacity-50">
                        <Info size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-vt323 text-xl">Nenhum registro encontrado.</p>
                    <p className="text-slate-600 text-xs font-mono mt-1">Suas ações aparecerão aqui.</p>
                </div>
            )}
        </PageTransition>
    );
}