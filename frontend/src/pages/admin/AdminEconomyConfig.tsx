import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';

interface Disciplina {
    _id: string;
    nome: string;
    professor: string;
    ano: string;
    curso: string;
    precoN1: number;
    precoN2: number;
    ativa: boolean;
}

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
    const [activeTab, setActiveTab] = useState<'disciplinas' | 'ranks'>('disciplinas');
    const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);

    // Disciplinas
    const { data: disciplinas = [], isLoading: loadingDisciplinas } = useQuery({
        queryKey: ['admin', 'disciplinas'],
        queryFn: async () => {
            const res = await api.get('/admin/economy/disciplinas');
            return res.data;
        }
    });

    const createDisciplinaMutation = useMutation({
        mutationFn: (data) => api.post('/admin/economy/disciplinas', data),
        onSuccess: () => {
            toast.success('Disciplina criada!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
            setEditingDisciplina(null);
        },
        onError: () => toast.error('Erro ao criar disciplina.')
    });

    const updateDisciplinaMutation = useMutation({
        mutationFn: (data: any) => api.put(`/admin/economy/disciplinas/${data._id}`, data),
        onSuccess: () => {
            toast.success('Disciplina atualizada!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
            setEditingDisciplina(null);
        },
        onError: () => toast.error('Erro ao atualizar disciplina.')
    });

    const deleteDisciplinaMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/economy/disciplinas/${id}`),
        onSuccess: () => {
            toast.success('Disciplina removida!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
        },
        onError: () => toast.error('Erro ao remover disciplina.')
    });

    // Ranks
    const { data: ranks = [], isLoading: loadingRanks } = useQuery({
        queryKey: ['admin', 'ranks'],
        queryFn: async () => {
            const res = await api.get('/admin/economy/ranks');
            return res.data;
        }
    });

    const updateRankMutation = useMutation({
        mutationFn: (data: any) => api.put(`/admin/economy/ranks/${data._id}`, data),
        onSuccess: () => {
            toast.success('Rank atualizado!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'ranks'] });
            setEditingRank(null);
        },
        onError: () => toast.error('Erro ao atualizar rank.')
    });

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-press text-white">CONFIGURAÇÃO DE ECONOMIA</h1>
                    <p className="text-slate-400 font-mono text-sm uppercase">Gerencie disciplinas e progressão de ranks</p>
                </div>

                {/* Abas */}
                <div className="flex gap-4 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('disciplinas')}
                        className={`px-4 py-2 font-press text-sm uppercase transition-colors ${
                            activeTab === 'disciplinas'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Disciplinas
                    </button>
                    <button
                        onClick={() => setActiveTab('ranks')}
                        className={`px-4 py-2 font-press text-sm uppercase transition-colors ${
                            activeTab === 'ranks'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Ranks
                    </button>
                </div>

                {/* TAB: DISCIPLINAS */}
                {activeTab === 'disciplinas' && (
                    <div className="space-y-6">
                        <PixelButton
                            variant="primary"
                            onClick={() => setEditingDisciplina({} as Disciplina)}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} /> NOVA DISCIPLINA
                        </PixelButton>

                        {editingDisciplina && (
                            <DisciplinaForm
                                disciplina={editingDisciplina}
                                onSave={(data) => {
                                    if (data._id) {
                                        updateDisciplinaMutation.mutate(data);
                                    } else {
                                        createDisciplinaMutation.mutate(data);
                                    }
                                }}
                                onCancel={() => setEditingDisciplina(null)}
                            />
                        )}

                        <div className="grid gap-4">
                            {loadingDisciplinas ? (
                                <p className="text-slate-400">Carregando...</p>
                            ) : disciplinas.length === 0 ? (
                                <p className="text-slate-500">Nenhuma disciplina cadastrada.</p>
                            ) : (
                                disciplinas.map((d: Disciplina) => (
                                    <PixelCard key={d._id} className="p-4 flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-press text-white">{d.nome}</p>
                                            <p className="text-xs text-slate-400 font-mono">
                                                {d.professor} | {d.ano}º {d.curso} | N1: {d.precoN1} PC$ | N2: {d.precoN2} PC$
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingDisciplina(d)}
                                                className="p-2 hover:bg-slate-800 rounded transition-colors"
                                            >
                                                <Edit2 size={16} className="text-blue-400" />
                                            </button>
                                            <button
                                                onClick={() => deleteDisciplinaMutation.mutate(d._id)}
                                                className="p-2 hover:bg-slate-800 rounded transition-colors"
                                            >
                                                <Trash2 size={16} className="text-red-400" />
                                            </button>
                                        </div>
                                    </PixelCard>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: RANKS */}
                {activeTab === 'ranks' && (
                    <div className="space-y-4">
                        {loadingRanks ? (
                            <p className="text-slate-400">Carregando...</p>
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
                )}
            </div>
        </AdminLayout>
    );
}

function DisciplinaForm({ disciplina, onSave, onCancel }: any) {
    const [formData, setFormData] = useState(disciplina);

    return (
        <PixelCard className="p-6 space-y-4 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Nome da Disciplina"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
                <input
                    type="text"
                    placeholder="Professor"
                    value={formData.professor || ''}
                    onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
                <select
                    value={formData.ano || '1'}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                    <option value="1">1º Ano</option>
                    <option value="2">2º Ano</option>
                    <option value="3">3º Ano</option>
                </select>
                <select
                    value={formData.curso || 'COMUM'}
                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                    <option value="COMUM">Comum</option>
                    <option value="ADM">ADM</option>
                    <option value="DS">DS</option>
                </select>
                <input
                    type="number"
                    placeholder="Preço N1"
                    value={formData.precoN1 || 1000}
                    onChange={(e) => setFormData({ ...formData, precoN1: parseInt(e.target.value) })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
                <input
                    type="number"
                    placeholder="Preço N2"
                    value={formData.precoN2 || 1200}
                    onChange={(e) => setFormData({ ...formData, precoN2: parseInt(e.target.value) })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
            </div>
            <div className="flex gap-2 justify-end">
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

function RankForm({ rank, isEditing, onEdit, onSave, onCancel }: any) {
    const [formData, setFormData] = useState(rank);

    if (!isEditing) {
        return (
            <PixelCard className="p-4 flex justify-between items-center">
                <div className="flex-1">
                    <p className="font-press text-white">{rank.name}</p>
                    <p className="text-xs text-slate-400 font-mono">Min: {rank.min} PC$</p>
                </div>
                <button onClick={onEdit} className="p-2 hover:bg-slate-800 rounded">
                    <Edit2 size={16} className="text-blue-400" />
                </button>
            </PixelCard>
        );
    }

    return (
        <PixelCard className="p-4 space-y-4 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-4">
                <input
                    type="text"
                    placeholder="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
                <input
                    type="number"
                    placeholder="Mínimo de PC$"
                    value={formData.min}
                    onChange={(e) => setFormData({ ...formData, min: parseInt(e.target.value) })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                />
            </div>
            <div className="flex gap-2 justify-end">
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
