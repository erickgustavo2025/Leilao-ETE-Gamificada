// frontend/src/pages/admin/AdminLogs.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Lock, Unlock, Coins, UserCog, History, Search, Filter, Ticket, Star, 
    CheckCircle, ShoppingBag, ArrowRightLeft, Gift, Gavel, PlusCircle, 
    MinusCircle, AlertTriangle
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';

interface LogData {
    _id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: { nome: string; role: string; turma?: string };
    target?: { nome: string; turma: string };
    ip?: string;
}

type FilterType = 'ALL' | 'ECONOMY' | 'SECURITY' | 'MANAGEMENT' | 'GAMEPLAY';

export function AdminLogs() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ GET Logs (substituiu useState + useEffect)
    const { data: logs = [], isLoading } = useQuery<LogData[]>({
        queryKey: queryKeys.admin.logs(),
        queryFn: async () => {
            const res = await api.get('/admin/logs');
            return res.data;
        }
    });

    // 🔍 Filtros Client-Side (useMemo para performance)
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Filtro por Categoria
            if (activeFilter === 'GAMEPLAY') {
                const gameActions = ['ROULETTE', 'ROULETTE_SPIN', 'ROULETTE_WIN', 'TICKET_CREATED', 'TICKET_CANCELLED', 'TICKET_VALIDATED', 'GIFT_CLAIM', 'USE_ITEM'];
                if (!gameActions.some(act => log.action.includes(act))) return false;
            }
            
            if (activeFilter === 'ECONOMY') {
                const moneyActions = [
                    'ADMIN_GIVE_POINTS', 'ADMIN_REMOVE_POINTS', 'MANUAL_POINT_UPDATE', 
                    'BID_PLACED', 'AUCTION_WIN', 'COMPRA_LOJA', 'BECO_COMPRA', 
                    'PIX_SENT', 'PIX_RECEIVED', 'TRADE_COMPLETED'
                ];
                if (!moneyActions.some(act => log.action.includes(act))) return false;
            }
            
            if (activeFilter === 'SECURITY') {
                const secActions = ['BLOCK', 'UNBLOCK', 'LOGIN_FAIL', 'LOGIN_BLOCKED', 'SECURITY_IMPERSONATE', 'AUTH_ERROR'];
                if (!secActions.some(act => log.action.includes(act))) return false;
            }

            if (activeFilter === 'MANAGEMENT') {
                const mngtActions = [
                    'PROMOTE', 'DEMOTE', 'UPDATE_PROFILE', 'RESET_ACCESS', 'ADMIN_ACTION', 
                    'GIFT_CREATE', 'AUCTION_CREATE', 'ITEM_CREATE', 'ITEM_UPDATE', 'ITEM_DELETE'
                ];
                if (!mngtActions.some(act => log.action.includes(act))) return false;
            }

            // Filtro de Busca (Texto)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    log.user?.nome?.toLowerCase().includes(term) ||
                    log.target?.nome?.toLowerCase().includes(term) ||
                    log.details?.toLowerCase().includes(term) ||
                    log.action?.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [logs, activeFilter, searchTerm]);

    const getActionStyle = (action: string) => {
        const act = action.toUpperCase();

        // 💰 ECONOMIA
        if (act === 'ADMIN_GIVE_POINTS') return { icon: PlusCircle, color: 'text-green-400', border: 'border-green-700', bg: 'bg-green-900/20', label: 'ADD PONTOS' };
        if (act === 'ADMIN_REMOVE_POINTS') return { icon: MinusCircle, color: 'text-red-400', border: 'border-red-700', bg: 'bg-red-900/20', label: 'REMOVE PONTOS' };
        if (act.includes('PIX')) return { icon: ArrowRightLeft, color: 'text-emerald-400', border: 'border-emerald-700', bg: 'bg-emerald-900/10', label: 'PIX' };
        if (act.includes('BID') || act.includes('LEILAO')) return { icon: Gavel, color: 'text-yellow-400', border: 'border-yellow-700', bg: 'bg-yellow-900/10', label: 'LEILÃO' };
        if (act.includes('COMPRA') || act.includes('BUY')) return { icon: ShoppingBag, color: 'text-pink-400', border: 'border-pink-700', bg: 'bg-pink-900/10', label: 'COMPRA' };
        if (act === 'TRADE_COMPLETED') return { icon: ArrowRightLeft, color: 'text-blue-400', border: 'border-blue-700', bg: 'bg-blue-900/10', label: 'TROCA' };

        // 🎮 GAMEPLAY
        if (act.includes('ROULETTE')) return { icon: Star, color: 'text-fuchsia-400', border: 'border-fuchsia-900', bg: 'bg-fuchsia-900/10', label: 'ROLETA' };
        if (act.includes('TICKET')) return { icon: Ticket, color: 'text-purple-400', border: 'border-purple-900', bg: 'bg-purple-900/10', label: 'TICKET' };
        if (act.includes('GIFT')) return { icon: Gift, color: 'text-orange-400', border: 'border-orange-900', bg: 'bg-orange-900/10', label: 'PRESENTE' };
        if (act.includes('USE_ITEM')) return { icon: CheckCircle, color: 'text-cyan-400', border: 'border-cyan-900', bg: 'bg-cyan-900/10', label: 'USOU ITEM' };

        // 🛡️ SEGURANÇA
        if (act.includes('BLOCK')) return { icon: Lock, color: 'text-red-500', border: 'border-red-900', bg: 'bg-red-900/10', label: 'BLOQUEIO' };
        if (act.includes('UNBLOCK')) return { icon: Unlock, color: 'text-green-500', border: 'border-green-900', bg: 'bg-green-900/10', label: 'DESBLOQUEIO' };
        if (act === 'SECURITY_IMPERSONATE') return { icon: AlertTriangle, color: 'text-orange-500', border: 'border-orange-900', bg: 'bg-orange-900/20', label: 'ESPIONAGEM' };
        if (act.includes('LOGIN_FAIL')) return { icon: AlertTriangle, color: 'text-red-400', border: 'border-red-800', bg: 'bg-red-900/20', label: 'FALHA LOGIN' };

        // ⚙️ GESTÃO
        if (act.includes('CREATE')) return { icon: PlusCircle, color: 'text-cyan-400', border: 'border-cyan-900', bg: 'bg-cyan-900/10', label: 'CRIAÇÃO' };
        if (act.includes('UPDATE')) return { icon: UserCog, color: 'text-blue-300', border: 'border-blue-800', bg: 'bg-blue-900/10', label: 'EDIÇÃO' };
        if (act.includes('DELETE')) return { icon: MinusCircle, color: 'text-red-400', border: 'border-red-800', bg: 'bg-red-900/10', label: 'DELEÇÃO' };
        if (act === 'RESET_ACCESS') return { icon: History, color: 'text-yellow-200', border: 'border-yellow-800', bg: 'bg-yellow-900/20', label: 'RESET' };
        
        // DEFAULT
        return { icon: History, color: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900', label: act };
    };

    const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

    return (
        <AdminLayout>
            <PageTransition>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-900/20 border-2 border-green-500 rounded-lg">
                            <History className="text-green-400 w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="font-vt323 text-4xl text-green-400">AUDITORIA GERAL</h1>
                            <p className="font-vt323 text-lg text-slate-500">Monitoramento 100% do Sistema.</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar (Nome, Ação, IP...)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded py-2 pl-10 pr-4 font-mono text-sm focus:border-green-500 outline-none text-white"
                        />
                    </div>
                </div>

                {/* ABAS DE FILTRO */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {[
                        { id: 'ALL', label: 'TUDO', icon: Filter },
                        { id: 'ECONOMY', label: 'ECONOMIA', icon: Coins },
                        { id: 'GAMEPLAY', label: 'JOGO', icon: Star },
                        { id: 'SECURITY', label: 'SEGURANÇA', icon: Lock },
                        { id: 'MANAGEMENT', label: 'GESTÃO', icon: UserCog },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as FilterType)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded border font-press text-[10px] whitespace-nowrap transition-colors",
                                activeFilter === tab.id
                                    ? "bg-green-600 text-white border-green-500"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-slate-500 animate-pulse font-press text-xs">CARREGANDO LOGS DO SERVIDOR...</div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded font-mono">
                                NENHUM REGISTRO ENCONTRADO
                            </div>
                        ) : (
                            filteredLogs.map(log => {
                                const style = getActionStyle(log.action);
                                const Icon = style.icon;

                                return (
                                    <PixelCard key={log._id} className={cn("flex flex-col md:flex-row gap-4 p-4 border-l-4 transition-all hover:bg-slate-800/50", style.border, style.bg)}>
                                        <div className="flex items-center gap-4 w-48 shrink-0">
                                            <div className={cn("p-2 rounded bg-black/50 border border-white/10", style.color)}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <p className={cn("font-press text-[10px]", style.color)}>{style.label}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{formatDate(log.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-vt323 text-xl text-white uppercase">{log.user?.nome || 'SISTEMA'}</span>
                                                <span className="text-slate-600">➔</span>
                                                {log.target ? (
                                                    <span className="font-vt323 text-xl text-yellow-500 uppercase">{log.target.nome}</span>
                                                ) : (
                                                    <span className="font-vt323 text-xl text-slate-500">SISTEMA</span>
                                                )}
                                            </div>
                                            <p className="font-mono text-xs text-slate-400">{log.details}</p>
                                            {log.ip && <p className="text-[9px] text-slate-600 mt-1 font-mono">IP: {log.ip}</p>}
                                        </div>
                                    </PixelCard>
                                );
                            })
                        )}
                    </div>
                )}
            </PageTransition>
        </AdminLayout>
    );
}