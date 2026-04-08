import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookMarked, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';

interface Disciplina {
    _id: string;
    nome: string;
    professor: string;
    ano: string;
    curso: 'DS' | 'ADM' | 'COMUM';
    precoN1: number;
    precoN2: number;
    ativa: boolean;
}

export function AdminDisciplinas() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Disciplina>>({
        nome: '',
        professor: '',
        ano: '1',
        curso: 'COMUM',
        precoN1: 1000,
        precoN2: 1200,
        ativa: true
    });

    // Buscar disciplinas
    const { data: disciplinas = [], isLoading } = useQuery({
        queryKey: ['admin', 'disciplinas'],
        queryFn: async () => {
            const res = await api.get('/admin/economy/disciplinas');
            return res.data;
        }
    });

    // Criar disciplina
    const createMutation = useMutation({
        mutationFn: async (data: Partial<Disciplina>) => {
            const res = await api.post('/admin/economy/disciplinas', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Disciplina criada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao criar disciplina.');
        }
    });

    // Atualizar disciplina
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Disciplina>) => {
            const res = await api.put(`/admin/economy/disciplinas/${editingId}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Disciplina atualizada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao atualizar disciplina.');
        }
    });

    // Deletar disciplina
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/admin/economy/disciplinas/${id}`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Disciplina removida com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'disciplinas'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao remover disciplina.');
        }
    });

    const resetForm = () => {
        setFormData({
            nome: '',
            professor: '',
            ano: '1',
            curso: 'COMUM',
            precoN1: 1000,
            precoN2: 1200,
            ativa: true
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (d: Disciplina) => {
        setFormData(d);
        setEditingId(d._id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <AdminLayout>
            <PageTransition>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookMarked className="text-indigo-400" size={32} />
                            <h1 className="text-3xl font-press text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                                MERCADO DE NOTAS
                            </h1>
                        </div>
                        <PixelButton
                            variant="primary"
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} /> NOVA DISCIPLINA
                        </PixelButton>
                    </div>

                    {/* Form Modal */}
                    {isFormOpen && (
                        <PixelCard className="p-6 bg-slate-900/80 border-indigo-500/50 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-press text-lg text-indigo-400">
                                    {editingId ? 'EDITAR DISCIPLINA' : 'NOVA DISCIPLINA'}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nome */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Nome da Disciplina</label>
                                        <input
                                            type="text"
                                            value={formData.nome || ''}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: Programação Web"
                                            required
                                        />
                                    </div>

                                    {/* Professor */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Professor</label>
                                        <input
                                            type="text"
                                            value={formData.professor || ''}
                                            onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="Ex: João Silva"
                                            required
                                        />
                                    </div>

                                    {/* Ano */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Ano</label>
                                        <select
                                            value={formData.ano || '1'}
                                            onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="1">1º Ano</option>
                                            <option value="2">2º Ano</option>
                                            <option value="3">3º Ano</option>
                                        </select>
                                    </div>

                                    {/* Curso */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Curso</label>
                                        <select
                                            value={formData.curso || 'COMUM'}
                                            onChange={(e) => setFormData({ ...formData, curso: e.target.value as any })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="COMUM">Comum</option>
                                            <option value="DS">Desenvolvimento de Software</option>
                                            <option value="ADM">Administração</option>
                                        </select>
                                    </div>

                                    {/* Preço N1 */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Preço N1 (Atividades) PC$</label>
                                        <input
                                            type="number"
                                            value={formData.precoN1 || 1000}
                                            onChange={(e) => setFormData({ ...formData, precoN1: parseInt(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                            min="100"
                                            step="100"
                                        />
                                    </div>

                                    {/* Preço N2 */}
                                    <div>
                                        <label className="text-xs font-press text-slate-400 uppercase block mb-2">Preço N2 (Prova) PC$</label>
                                        <input
                                            type="number"
                                            value={formData.precoN2 || 1200}
                                            onChange={(e) => setFormData({ ...formData, precoN2: parseInt(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                            min="100"
                                            step="100"
                                        />
                                    </div>
                                </div>

                                {/* Ativa */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="ativa"
                                        checked={formData.ativa ?? true}
                                        onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="ativa" className="text-xs font-press text-slate-400 uppercase cursor-pointer">
                                        Disciplina Ativa
                                    </label>
                                </div>

                                {/* Botões */}
                                <div className="flex gap-3 pt-4">
                                    <PixelButton variant="primary" type="submit" className="flex-1">
                                        {editingId ? 'ATUALIZAR' : 'CRIAR'}
                                    </PixelButton>
                                    <PixelButton
                                        variant="secondary"
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1"
                                    >
                                        CANCELAR
                                    </PixelButton>
                                </div>
                            </form>
                        </PixelCard>
                    )}

                    {/* Tabela de Disciplinas */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : disciplinas.length === 0 ? (
                        <PixelCard className="p-12 text-center space-y-4">
                            <AlertCircle className="mx-auto text-slate-500" size={32} />
                            <p className="text-slate-400 font-mono">Nenhuma disciplina cadastrada ainda.</p>
                        </PixelCard>
                    ) : (
                        <div className="space-y-3">
                            {disciplinas.map((d: Disciplina) => (
                                <PixelCard
                                    key={d._id}
                                    className={`p-4 flex items-center justify-between ${
                                        d.ativa ? 'border-indigo-500/30' : 'border-slate-700/50 opacity-60'
                                    }`}
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-press text-white text-sm">{d.nome}</h3>
                                            {!d.ativa && (
                                                <span className="text-[8px] font-press text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                                    INATIVA
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                            Prof: {d.professor} • {d.ano}º ano • {d.curso}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                            N1: {d.precoN1} PC$ • N2: {d.precoN2} PC$
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            title="Editar"
                                            onClick={() => handleEdit(d)}
                                            className="p-2 hover:bg-blue-500/20 rounded transition-colors text-blue-400"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            title="Remover"
                                            onClick={() => {
                                                if (window.confirm('Certeza que deseja remover esta disciplina?')) {
                                                    deleteMutation.mutate(d._id);
                                                }
                                            }}
                                            className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </PixelCard>
                            ))}
                        </div>
                    )}
                </div>
            </PageTransition>
        </AdminLayout>
    );
}
