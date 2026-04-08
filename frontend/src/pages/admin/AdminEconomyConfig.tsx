import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';

interface Rank {
    _id: string;
    rankId: string;
    name: string;
    min: number;
    color: string;
    border: string;
}

export function AdminEconomyConfig() {
    const queryClient = useQueryClient();
    const [editingRank, setEditingRank] = useState<Rank | null>(null);

    // Ranks
    const { data: ranks = [], isLoading: loadingRanks } = useQuery({
        queryKey: ['admin', 'ranks'],
        queryFn: async () => {
            const res = await api.get('/admin/economy/ranks');
            return res.data;
        }
    });

    const updateRankMutation = useMutation({
        mutationFn: (data: Rank) => api.put(`/admin/economy/ranks/${data._id}`, data),
        onSuccess: () => {
            toast.success('Rank atualizado!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'ranks'] });
            setEditingRank(null);
        },
        onError: () => toast.error('Erro ao atualizar rank.')
    });

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pt-6">
                <div className="flex items-center gap-3">
                    <Sliders className="text-orange-400" size={32} />
                    <div>
                        <h1 className="text-2xl font-press text-white">ECONOMIA (CONFIG)</h1>
                        <p className="text-slate-400 font-mono text-sm uppercase">Gerencie os patamares de progressão e limites do servidor</p>
                    </div>
                </div>

                {/* TAB: RANKS */}
                <div className="space-y-4 pt-4">
                    <h2 className="font-press text-lg text-indigo-400 border-b border-slate-800 pb-2">HIERARQUIA E RANKS</h2>
                    {loadingRanks ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        ranks.map((r: Rank) => (
                            <RankForm
                                key={r._id}
                                rank={r}
                                isEditing={editingRank?._id === r._id}
                                onEdit={() => setEditingRank(r)}
                                onSave={(data) => {
                                    updateRankMutation.mutate(data);
                                }}
                                onCancel={() => setEditingRank(null)}
                            />
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function RankForm({ rank, isEditing, onEdit, onSave, onCancel }: { rank: Rank, isEditing: boolean, onEdit: () => void, onSave: (r: Rank) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState<Rank>(rank);

    if (!isEditing) {
        return (
            <PixelCard className="p-4 flex justify-between items-center border-l-4" style={{ borderLeftColor: rank.color }}>
                <div className="flex-1">
                    <p className="font-press text-white" style={{ color: rank.color }}>{rank.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">Pontuação Mínima: <span className="text-yellow-400">{rank.min} PC$</span></p>
                </div>
                <button onClick={onEdit} className="p-2 hover:bg-slate-800 rounded transition-colors" title="Editar Limite">
                    <Edit2 size={18} className="text-blue-400" />
                </button>
            </PixelCard>
        );
    }

    return (
        <PixelCard className="p-4 space-y-4 bg-slate-900/50 border-indigo-500/30">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] uppercase font-press text-slate-500 mb-1 block">Nome do Rank</label>
                    <input
                        type="text"
                        placeholder="Nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-press text-slate-500 mb-1 block">Min. PC$ (Requisito)</label>
                    <input
                        type="number"
                        placeholder="Mínimo de PC$"
                        value={formData.min}
                        onChange={(e) => setFormData({ ...formData, min: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:border-indigo-500 outline-none transition-colors"
                    />
                </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
                <PixelButton variant="secondary" onClick={onCancel}>
                    CANCELAR
                </PixelButton>
                <PixelButton variant="primary" onClick={() => onSave(formData)}>
                    SALVAR
                </PixelButton>
            </div>
        </PixelCard>
    );
}
