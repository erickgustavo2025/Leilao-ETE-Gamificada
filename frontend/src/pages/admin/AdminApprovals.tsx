import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { 
    CheckCircle2, XCircle, Loader2, User, 
    Scroll, Clock, Package, Gift 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingApproval {
    _id: string;
    studentName: string;
    studentMatricula: string;
    questTitle: string;
    requestedAt: string;
    rewards: {
        pc: number;
        items: Array<{ name: string; quantity: number }>;
    };
}

export default function AdminApprovals() {
    const queryClient = useQueryClient();

    const { data: approvals = [], isLoading } = useQuery<PendingApproval[]>({
        queryKey: ['admin', 'approvals'],
        queryFn: async () => {
            const response = await api.get('/admin/quests/approvals');
            return response.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/admin/quests/approvals/${id}/approve`);
        },
        onSuccess: () => {
            toast.success('Missão aprovada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Erro ao aprovar missão.');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/admin/quests/approvals/${id}/reject`);
        },
        onSuccess: () => {
            toast.success('Missão rejeitada.');
            queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Erro ao rejeitar missão.');
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
                    <Scroll className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="font-press text-xl text-white">APROVAÇÕES</h1>
                    <p className="font-vt323 text-slate-400 text-lg">Validação manual de missões enviadas pelos alunos</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
                    <p className="font-press text-[10px] text-slate-500">CARREGANDO FILA...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {approvals.map((item) => (
                            <motion.div
                                key={item._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors">
                                            <User size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white text-lg">{item.studentName}</h3>
                                                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                                    #{item.studentMatricula}
                                                </span>
                                            </div>
                                            <p className="font-vt323 text-blue-400 text-xl mb-2">{item.questTitle}</p>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                    <Clock size={14} />
                                                    {new Date(item.requestedAt).toLocaleString('pt-BR')}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-yellow-500 text-xs font-press">
                                                    <Gift size={14} />
                                                    {item.rewards.pc} PC$
                                                </div>
                                                {item.rewards.items.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-press">
                                                        <Package size={14} />
                                                        {item.rewards.items.length} ITENS
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => rejectMutation.mutate(item._id)}
                                            disabled={rejectMutation.isPending || approveMutation.isPending}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-press text-[10px] transition-all disabled:opacity-50"
                                        >
                                            {rejectMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                            REJEITAR
                                        </button>
                                        <button
                                            onClick={() => approveMutation.mutate(item._id)}
                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 rounded-xl font-press text-[10px] transition-all disabled:opacity-50"
                                        >
                                            {approveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                            APROVAR
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {approvals.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl">
                            <Scroll size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="font-vt323 text-2xl text-slate-500">Nenhuma solicitação pendente no momento.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
