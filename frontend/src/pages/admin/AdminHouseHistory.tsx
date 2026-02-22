// ARQUIVO: frontend/src/pages/admin/components/AdminHouseHistory.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { getImageUrl } from '../../utils/imageHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { Trophy, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HouseHistoryItem {
    _id: string;
    nome: string;
    anosAtivos: string;
    anoEntrada: number;
    anoSaida: number;
    vitorias: number;
    imagemUrl: string;
    ordem: number;
}

interface HouseHistoryForm {
    nome: string;
    anoEntrada: number;
    anoSaida: number;
    vitorias: number;
    imagemUrl: string;
    ordem: number;
}

const EMPTY_FORM: HouseHistoryForm = {
    nome: '',
    anoEntrada: 2024,
    anoSaida: 2026,
    vitorias: 1,
    imagemUrl: '',
    ordem: 0
};

export function AdminHouseHistory() {
    const queryClient = useQueryClient();
    const [editingItem, setEditingItem] = useState<HouseHistoryItem | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<HouseHistoryForm>({ ...EMPTY_FORM });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ── GET ──────────────────────────────────────────
    const { data: houses = [], isLoading } = useQuery<HouseHistoryItem[]>({
        queryKey: ['houseHistory'],
        queryFn: async () => {
            const res = await api.get('/house-history');
            return res.data as HouseHistoryItem[];
        },
        staleTime: 1000 * 30
    });

    // ── CREATE ────────────────────────────────────────
    const createMutation = useMutation<HouseHistoryItem, Error, HouseHistoryForm>({
        mutationFn: async (data) => {
            const res = await api.post('/house-history', data);
            return res.data as HouseHistoryItem;
        },
        onSuccess: () => {
            toast.success('Casa adicionada ao Hall da Fama!');
            queryClient.invalidateQueries({ queryKey: ['houseHistory'] });
            setShowForm(false);
            setForm({ ...EMPTY_FORM });
        },
        onError: () => toast.error('Erro ao criar casa.')
    });

    // ── UPDATE ────────────────────────────────────────
    const updateMutation = useMutation<HouseHistoryItem, Error, { id: string; data: Partial<HouseHistoryForm> }>({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/house-history/${id}`, data);
            return res.data as HouseHistoryItem;
        },
        onSuccess: () => {
            toast.success('Casa atualizada!');
            queryClient.invalidateQueries({ queryKey: ['houseHistory'] });
            setEditingItem(null);
            setShowForm(false);
            setForm({ ...EMPTY_FORM });
        },
        onError: () => toast.error('Erro ao atualizar.')
    });

    // ── DELETE ────────────────────────────────────────
    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: async (id) => {
            await api.delete(`/house-history/${id}`);
        },
        onSuccess: () => {
            toast.success('Casa removida.');
            queryClient.invalidateQueries({ queryKey: ['houseHistory'] });
            setDeleteConfirm(null);
        },
        onError: () => toast.error('Erro ao remover.')
    });

    const handleOpenCreate = () => {
        setEditingItem(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    };

    const handleOpenEdit = (house: HouseHistoryItem) => {
        setEditingItem(house);
        setForm({
            nome: house.nome,
            anoEntrada: house.anoEntrada,
            anoSaida: house.anoSaida,
            vitorias: house.vitorias,
            imagemUrl: house.imagemUrl,
            ordem: house.ordem
        });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nome.trim()) return toast.warning('Informe o nome da casa.');
        if (form.anoEntrada >= form.anoSaida) return toast.warning('Ano de entrada deve ser menor que ano de saída.');

        if (editingItem) {
            updateMutation.mutate({ id: editingItem._id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const sorted = [...houses].sort((a, b) => b.vitorias - a.vitorias || a.anoEntrada - b.anoEntrada);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-vt323 text-3xl text-yellow-400 flex items-center gap-2">
                        <Trophy size={24} className="text-yellow-500" />
                        HALL DA FAMA
                    </h2>
                    <p className="font-mono text-xs text-slate-500">{houses.length} casas registradas</p>
                </div>
                <PixelButton onClick={handleOpenCreate} className="flex items-center gap-2">
                    <Plus size={14} />
                    Nova Casa
                </PixelButton>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-20 font-press text-xs text-slate-500 animate-pulse">
                    CONSULTANDO ARQUIVOS...
                </div>
            )}

            {/* Grid de casas */}
            {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sorted.map((house, i) => (
                        <motion.div
                            key={house._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <PixelCard className="p-4 flex flex-col gap-3 h-full bg-slate-900/60 border border-white/10 hover:border-yellow-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <img
                                            src={getImageUrl(house.imagemUrl)}
                                            alt={house.nome}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-vt323 text-xl text-white uppercase leading-tight truncate">{house.nome}</h3>
                                        <p className="font-mono text-[10px] text-slate-500">{house.anosAtivos}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                        <Trophy size={12} className="text-yellow-400" />
                                        <span className="font-press text-[10px] text-yellow-400">{house.vitorias}x</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-500">Vitórias</span>
                                </div>

                                <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => handleOpenEdit(house)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-all font-press text-[9px] uppercase"
                                    >
                                        <Pencil size={11} /> Editar
                                    </button>
                                    {deleteConfirm === house._id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => deleteMutation.mutate(house._id)}
                                                disabled={deleteMutation.isPending}
                                                className="px-2 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-400 transition-all"
                                            >
                                                <Check size={12} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(house._id)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </PixelCard>
                        </motion.div>
                    ))}

                    {houses.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-20 text-slate-500 font-vt323 text-2xl">
                            NENHUMA CASA REGISTRADA.<br />
                            <span className="text-lg">Clique em "Nova Casa" para começar.</span>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════
                MODAL DE FORMULÁRIO
            ══════════════════ */}
            <AnimatePresence>
                {showForm && (
                    <div
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <PixelCard className="p-6 bg-slate-900 border-2 border-yellow-500/40" style={{ boxShadow: '0 0 40px rgba(234,179,8,0.15)' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-vt323 text-2xl text-yellow-400">
                                        {editingItem ? `EDITAR: ${editingItem.nome}` : 'NOVA CASA LENDÁRIA'}
                                    </h3>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Nome */}
                                    <div>
                                        <label className="font-press text-[10px] text-slate-400 uppercase block mb-1">Nome da Casa *</label>
                                        <input
                                            type="text"
                                            value={form.nome}
                                            onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                                            placeholder="Ex: ALPHA LUPI"
                                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 font-press text-xs text-white placeholder-slate-600 focus:border-yellow-500/50 focus:outline-none uppercase"
                                            required
                                        />
                                    </div>

                                    {/* Anos */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="font-press text-[10px] text-slate-400 uppercase block mb-1">Ano Entrada *</label>
                                            <input
                                                type="number"
                                                value={form.anoEntrada}
                                                onChange={e => setForm(p => ({ ...p, anoEntrada: Number(e.target.value) }))}
                                                min={2019}
                                                max={2030}
                                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 font-mono text-sm text-white focus:border-yellow-500/50 focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="font-press text-[10px] text-slate-400 uppercase block mb-1">Ano Saída *</label>
                                            <input
                                                type="number"
                                                value={form.anoSaida}
                                                onChange={e => setForm(p => ({ ...p, anoSaida: Number(e.target.value) }))}
                                                min={2020}
                                                max={2030}
                                                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 font-mono text-sm text-white focus:border-yellow-500/50 focus:outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Vitórias */}
                                    <div>
                                        <label className="font-press text-[10px] text-slate-400 uppercase block mb-1">
                                            Vitórias na Taça
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={0}
                                                max={15}
                                                value={form.vitorias}
                                                onChange={e => setForm(p => ({ ...p, vitorias: Number(e.target.value) }))}
                                                className="flex-1 accent-yellow-400"
                                            />
                                            <div className="w-12 text-center bg-black border border-yellow-500/30 rounded-lg py-1 font-vt323 text-2xl text-yellow-400">
                                                {form.vitorias}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Imagem */}
                                    <div>
                                        <label className="font-press text-[10px] text-slate-400 uppercase block mb-1">URL da Imagem</label>
                                        <input
                                            type="text"
                                            value={form.imagemUrl}
                                            onChange={e => setForm(p => ({ ...p, imagemUrl: e.target.value }))}
                                            placeholder="/uploads/3badm.2021.png"
                                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-slate-600 focus:border-yellow-500/50 focus:outline-none"
                                        />
                                        <p className="font-mono text-[9px] text-slate-600 mt-1">
                                            Deixe vazio para usar imagem padrão. Use o caminho /uploads/nome.png
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    {form.imagemUrl && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                                            <img
                                                src={getImageUrl(form.imagemUrl)}
                                                alt="preview"
                                                className="w-12 h-12 object-contain"
                                                onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'}
                                            />
                                            <div>
                                                <p className={cn("font-vt323 text-xl text-white")}>{form.nome || 'NOME DA CASA'}</p>
                                                <p className="font-mono text-[10px] text-slate-500">{form.anoEntrada} - {form.anoSaida} · {form.vitorias}x 🏆</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botões */}
                                    <div className="flex gap-3 pt-2">
                                        <PixelButton
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowForm(false)}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </PixelButton>
                                        <PixelButton
                                            type="submit"
                                            className="flex-1"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                        >
                                            {editingItem ? 'Salvar Alterações' : 'Adicionar ao Hall'}
                                        </PixelButton>
                                    </div>
                                </form>
                            </PixelCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
