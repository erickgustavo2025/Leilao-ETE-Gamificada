import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit2, Trash2, ShieldCheck, X, BookOpen, GraduationCap, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';

interface Vinculo {
    disciplinaId: string;
    nomeDisciplina?: string;
    ano: string;
    curso: string;
    turmas: string[];
    isRedacao?: boolean;
}

interface Professor {
    _id: string;
    nome: string;
    usuario: string;
    role: string;
    disciplinas: Vinculo[];
    ativo: boolean;
}

export function AdminProfessors() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        usuario: '',
        senha: '',
        ativo: true,
        disciplinas: [] as Vinculo[]
    });

    // --- BUSCAR DADOS ---
    const { data: professors = [], isLoading: loadingProfessors } = useQuery({
        queryKey: ['admin', 'professors'],
        queryFn: async () => {
            const res = await api.get('/admin/professors');
            return res.data;
        }
    });

    const { data: disciplinas = [] } = useQuery({
        queryKey: ['admin', 'disciplinas'],
        queryFn: async () => {
            const res = await api.get('/admin/economy/disciplinas');
            return res.data;
        }
    });

    // --- MUTAÇÕES ---
    const mutationOptions = {
        onSuccess: (data: any) => {
            toast.success(data.message || 'Sucesso!');
            queryClient.invalidateQueries({ queryKey: ['admin', 'professors'] });
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Ocorreu um erro.');
        }
    };

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/admin/professors', data),
        ...mutationOptions
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/admin/professors/${editingId}`, data),
        ...mutationOptions
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/professors/${id}`),
        onSuccess: () => {
            toast.success('Professor removido.');
            queryClient.invalidateQueries({ queryKey: ['admin', 'professors'] });
        }
    });

    // --- HANDLERS ---
    const resetForm = () => {
        setFormData({ nome: '', usuario: '', senha: '', ativo: true, disciplinas: [] });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (p: Professor) => {
        setFormData({
            nome: p.nome,
            usuario: p.usuario,
            senha: '', // Não mostramos a senha antiga
            ativo: p.ativo,
            disciplinas: p.disciplinas
        });
        setEditingId(p._id);
        setIsFormOpen(true);
    };

    const addVinculo = () => {
        setFormData({
            ...formData,
            disciplinas: [...formData.disciplinas, { disciplinaId: '', ano: '1', curso: 'COMUM', turmas: [], isRedacao: false }]
        });
    };

    const removeVinculo = (index: number) => {
        const list = [...formData.disciplinas];
        list.splice(index, 1);
        setFormData({ ...formData, disciplinas: list });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            if (!formData.senha) return toast.error('Defina uma senha inicial.');
            createMutation.mutate(formData);
        }
    };

    return (
        <AdminLayout>
            <PageTransition>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-purple-400" size={32} />
                            <div>
                                <h1 className="text-2xl md:text-3xl font-press text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                    GESTÃO DE DOCENTES
                                </h1>
                                <p className="text-[10px] font-press text-slate-500 uppercase mt-1">Fase 1: Módulo Pedagógico PJC</p>
                            </div>
                        </div>
                        <PixelButton
                            variant="primary"
                            onClick={() => { resetForm(); setIsFormOpen(true); }}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} /> NOVO PROFESSOR
                        </PixelButton>
                    </div>

                    {/* Form Modal (Glassmorphism SSS+) */}
                    {isFormOpen && (
                        <PixelCard className="p-4 md:p-8 bg-slate-950/90 border-purple-500/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={resetForm} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Nome Completo */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-press text-slate-400 uppercase">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-all"
                                            placeholder="EX: MARIA SOUZA"
                                            required
                                        />
                                    </div>

                                    {/* Usuário (ID) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-press text-slate-400 uppercase">Usuário de Acesso</label>
                                        <input
                                            type="text"
                                            value={formData.usuario}
                                            onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-all"
                                            placeholder="ex: prof.maria"
                                            required
                                        />
                                    </div>

                                    {/* Senha */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-press text-slate-400 uppercase">
                                            {editingId ? 'Nova Senha (opcional)' : 'Senha Inicial'}
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.senha}
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-all"
                                            placeholder="••••••••"
                                            required={!editingId}
                                        />
                                    </div>
                                </div>

                                {/* Seção Multidisciplinar */}
                                <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="text-blue-400" size={20} />
                                            <h3 className="text-xs font-press text-blue-400">VÍNCULOS DE DISCIPLINAS</h3>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={addVinculo}
                                            className="text-[10px] font-press text-blue-400 hover:text-blue-200 transition-colors flex items-center gap-2"
                                        >
                                            <Plus size={14} /> ADICIONAR VÍNCULO
                                        </button>
                                    </div>

                                    {formData.disciplinas.length === 0 && (
                                        <p className="text-center py-8 text-slate-500 font-mono text-sm italic">
                                            Nenhuma disciplina vinculada ainda.
                                        </p>
                                    )}

                                    <div className="space-y-4">
                                        {formData.disciplinas.map((vinculo, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black/40 rounded-xl border border-white/5 relative group">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeVinculo(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>

                                                {/* Matéria */}
                                                <div>
                                                    <label className="text-[8px] font-press text-slate-500 mb-1 block">MATÉRIA</label>
                                                    <select
                                                        value={vinculo.disciplinaId}
                                                        onChange={(e) => {
                                                            const list = [...formData.disciplinas];
                                                            list[idx].disciplinaId = e.target.value;
                                                            setFormData({ ...formData, disciplinas: list });
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                                                        required
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {disciplinas.map((d: any) => (
                                                            <option key={d._id} value={d._id}>{d.nome} ({d.ano}º Ano)</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Ano */}
                                                <div>
                                                    <label className="text-[8px] font-press text-slate-500 mb-1 block">ANO</label>
                                                    <select
                                                        value={vinculo.ano}
                                                        onChange={(e) => {
                                                            const list = [...formData.disciplinas];
                                                            list[idx].ano = e.target.value;
                                                            setFormData({ ...formData, disciplinas: list });
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                                                    >
                                                        <option value="1">1º Ano</option>
                                                        <option value="2">2º Ano</option>
                                                        <option value="3">3º Ano</option>
                                                    </select>
                                                </div>

                                                {/* Curso */}
                                                <div>
                                                    <label className="text-[8px] font-press text-slate-500 mb-1 block">CURSO</label>
                                                    <select
                                                        value={vinculo.curso}
                                                        onChange={(e) => {
                                                            const list = [...formData.disciplinas];
                                                            list[idx].curso = e.target.value;
                                                            setFormData({ ...formData, disciplinas: list });
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                                                    >
                                                        <option value="COMUM">COMUM / BÁSICO</option>
                                                        <option value="DS">TI / WEB</option>
                                                        <option value="ADM">ADMINISTRAÇÃO</option>
                                                        <option value="MKT">MARKETING</option>
                                                    </select>
                                                </div>

                                                {/* Turmas (Input Texto p/ simplificar ex: 3A, 3B) */}
                                                <div>
                                                    <label className="text-[8px] font-press text-slate-500 mb-1 block">TURMAS (SÉRIES)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: 3A, 3B"
                                                        value={vinculo.turmas.join(', ')}
                                                        onChange={(e) => {
                                                            const list = [...formData.disciplinas];
                                                            list[idx].turmas = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                                            setFormData({ ...formData, disciplinas: list });
                                                        }}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                                                        required
                                                    />
                                                </div>

                                                {/* Checkbox Redação */}
                                                <div className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`redacao-${idx}`}
                                                        checked={vinculo.isRedacao || false}
                                                        onChange={(e) => {
                                                            const list = [...formData.disciplinas];
                                                            list[idx].isRedacao = e.target.checked;
                                                            setFormData({ ...formData, disciplinas: list });
                                                        }}
                                                        className="w-4 h-4 accent-purple-500 rounded border-slate-800 bg-slate-900"
                                                    />
                                                    <label htmlFor={`redacao-${idx}`} className="text-[8px] font-press text-purple-400 cursor-pointer uppercase">
                                                        Módulo de Redação
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <PixelButton 
                                        variant="primary" 
                                        type="submit" 
                                        className="flex-1"
                                        isLoading={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR PROFESSOR'}
                                    </PixelButton>
                                    <PixelButton variant="secondary" onClick={resetForm} className="flex-1">CANCELAR</PixelButton>
                                </div>
                            </form>
                        </PixelCard>
                    )}

                    {/* Lista de Professores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingProfessors ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                            </div>
                        ) : professors.length === 0 ? (
                            <PixelCard className="col-span-full p-20 text-center space-y-4">
                                <Users className="mx-auto text-slate-700" size={48} />
                                <p className="font-press text-xs text-slate-500 uppercase tracking-widest">Nenhum docente registrado</p>
                            </PixelCard>
                        ) : (
                            professors.map((prof: Professor) => (
                                <PixelCard key={prof._id} className="p-6 bg-slate-900/40 border-purple-500/20 group hover:border-purple-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                                                <GraduationCap className="text-purple-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-press text-xs text-white">{prof.nome}</h3>
                                                <p className="text-[10px] text-slate-500 font-mono mt-1">ID: @{prof.usuario}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(prof)} className="p-2 hover:bg-white/5 rounded-lg text-blue-400"><Edit2 size={16} /></button>
                                            <button 
                                                onClick={() => window.confirm('Deletar este professor?') && deleteMutation.mutate(prof._id)}
                                                className="p-2 hover:bg-white/5 rounded-lg text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-press text-slate-500 border-b border-white/5 pb-2">
                                            <span>MÓDULO CIENTÍFICO</span>
                                            <LayoutDashboard size={12} />
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {prof.disciplinas.length === 0 ? (
                                                <span className="text-[10px] italic text-slate-600">Sem vínculos</span>
                                            ) : (
                                                prof.disciplinas.map((v, i) => (
                                                    <div key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[9px] text-blue-300 font-press">
                                                        {v.nomeDisciplina || 'MATÉRIA'} ({v.turmas.join('/')})
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className={`text-[8px] font-press px-2 py-1 rounded ${prof.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {prof.ativo ? 'STATUS: ATIVO' : 'STATUS: INATIVO'}
                                        </span>
                                        <button className="text-[10px] font-press text-slate-500 hover:text-white transition-colors">
                                            RESETAR SENHA
                                        </button>
                                    </div>
                                </PixelCard>
                            ))
                        )}
                    </div>
                </div>
            </PageTransition>
        </AdminLayout>
    );
}
