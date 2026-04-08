import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ClipboardList, Users, CheckCircle2,
    BarChart3, Plus, Loader2, Search,
    Filter, ToggleLeft, ToggleRight, Trash2
} from 'lucide-react';
import { api } from '../../api/axios-config';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { toast } from 'sonner';
import { CreateSurveyModal } from './components/CreateSurveyModal';

interface SurveyRecord {
    _id: string;
    title: string;
    description: string;
    isActive: boolean;
    rewardAmount: number;
    createdAt: string;
    responsesCount?: number;
}

export function AdminSurveys() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: surveys, isLoading } = useQuery<SurveyRecord[]>({
        queryKey: ['admin', 'surveys'],
        queryFn: async () => {
            const res = await api.get('/surveys/list');
            return res.data;
        }
    });

    // Mutação para criar nova pesquisa
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/surveys/create', data),
        onSuccess: () => {
            toast.success('Laboratório Ativado: Pesquisa lançada com sucesso!');
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'surveys'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Falha ao lançar pesquisa científica.');
        }
    });

    // Mutação para alternar status
    const toggleMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/surveys/toggle/${id}`),
        onSuccess: (res) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['admin', 'surveys'] });
        },
        onError: () => {
            toast.error('Erro ao alternar status da pesquisa.');
        }
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <p className="font-press text-[10px] text-purple-400 mt-4">Sincronizando Laboratório de Pesquisa...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                                <ClipboardList size={24} className="text-purple-400" />
                            </div>
                            <h1 className="font-vt323 text-5xl text-white leading-none">Gestão de Pesquisas</h1>
                        </div>
                        <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            Coleta de Dados e Validação Científica (Jovem Cientista)
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-press text-[10px] rounded-2xl hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                    >
                        <Plus size={16} />
                        NOVA PESQUISA
                    </button>
                </div>

                {/* Status Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatusCard 
                        title="Participação Total" 
                        value={surveys?.reduce((acc, s) => acc + (s.responsesCount || 0), 0) || 0} 
                        icon={Users} 
                        color="blue" 
                    />
                    <StatusCard 
                        title="Pesquisas Ativas" 
                        value={surveys?.filter(s => s.isActive).length || 0} 
                        icon={CheckCircle2} 
                        color="emerald" 
                    />
                    <StatusCard 
                        title="Impacto Projetado" 
                        value="87%" 
                        icon={BarChart3} 
                        color="purple" 
                    />
                </div>

                {/* Lista de Pesquisas */}
                <div className="bg-black/40 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Filtrar por título..." 
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white font-mono text-sm focus:border-purple-500 outline-none"
                            />
                        </div>
                        <button className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
                            <Filter size={18} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/30 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                                    <th className="px-6 py-4">Pesquisa</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Respostas</th>
                                    <th className="px-6 py-4">Premiação</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {surveys?.map((s) => (
                                    <tr key={s._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="text-white font-vt323 text-xl">{s.title}</p>
                                                <p className="text-slate-500 font-mono text-[10px] truncate max-w-xs">{s.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button 
                                                onClick={() => toggleMutation.mutate(s._id)}
                                                className={`flex items-center gap-2 group/btn px-3 py-1 rounded-full border transition-all ${
                                                s.isActive 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-slate-800/10 text-slate-500 border-slate-800'
                                            }`}>
                                                {s.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                <span className="font-press text-[8px]">{s.isActive ? 'ATIVA' : 'INATIVA'}</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-press text-[10px]">{s.responsesCount || 0}</span>
                                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min((s.responsesCount || 0) * 2, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-yellow-400 font-vt323 text-xl">{s.rewardAmount} PC$</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => window.location.href = `/admin/analytics`}
                                                    className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <BarChart3 size={18} />
                                                </button>
                                                <button className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CreateSurveyModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={(data) => createMutation.mutate(data)}
                isSaving={createMutation.isPending}
            />
        </AdminLayout>
    );
}

function StatusCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };

    return (
        <div className={`p-6 bg-black/40 border rounded-[1.5rem] backdrop-blur-sm ${colors[color].split(' ').slice(2).join(' ')}`}>
            <div className="flex items-center justify-between mb-2">
                <Icon size={20} className={colors[color].split(' ')[0]} />
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none pt-1">Dados Síncronos</span>
            </div>
            <p className="text-3xl font-vt323 text-white">{value}</p>
            <p className="font-press text-[8px] text-slate-500 uppercase tracking-tight mt-1">{title}</p>
        </div>
    );
}
