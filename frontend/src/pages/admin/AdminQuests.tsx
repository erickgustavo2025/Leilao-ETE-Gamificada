// ARQUIVO: frontend/src/pages/admin/AdminQuests.tsx
// ─────────────────────────────────────────────────────────────────
// 🔌 PONTOS DE INTEGRAÇÃO COM O BACKEND CONECTADOS COM REACT QUERY
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import {
    Plus, Scroll, Key, Copy, Check, X,
    Eye, Trash2, ToggleLeft, ToggleRight,
    Clock, Calendar, Flame, Trophy, Search,
    Loader2, Shield,
    Gift, Users, Sword, Package, Trash, Crown, Zap
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────
type QuestType = 'DIARIA' | 'SEMANAL' | 'EVENTO' | 'MENSAL' | 'CAMPANHA' | 'FUNCIONALIDADE';
type ValidationType = 'SECRET_CODE' | 'MANUAL_ADMIN';
type QuestStatus = 'active' | 'inactive' | 'expired';
type ItemCategory = 'CONSUMIVEL' | 'PERMANENTE' | 'TICKET' | 'BUFF';

interface QuestKey {
    code: string;
    usedBy?: string;   // nome do aluno
    usedAt?: string;   // ISO date
}

interface RewardItem {
    itemId: string;    // ID real do StoreItem
    name: string;
    category: ItemCategory;
    validityDays: number;
    sendToClassroom: boolean;
}

interface StoreItem {
    _id: string;
    nome: string;
    tipo: 'ITEM' | 'BUFF';
    validadeDias: number;
}

interface Quest {
    _id: string;
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    validationType: ValidationType;
    status: QuestStatus;
    expiresAt?: string;
    createdAt: string;
    keys: QuestKey[];
    usedCount: number;
    rewardItems?: RewardItem[];
}

interface FormState {
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    validationType: ValidationType;
    expiresAt: string;
    generateKeysCount: number;
    rewardItems: RewardItem[];
}

// ─────────────────────────────────────────────────────────────────
// CONFIG VISUAL POR TIPO
// ─────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<QuestType, { label: string; icon: any; color: string; border: string; bg: string }> = {
    DIARIA: { label: 'DIARIA', icon: Clock, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    SEMANAL: { label: 'SEMANAL', icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    EVENTO: { label: 'EVENTO', icon: Flame, color: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
    MENSAL: { label: 'MENSAL', icon: Trophy, color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
    CAMPANHA: { label: 'CAMPANHA', icon: Crown, color: 'text-fuchsia-400', border: 'border-fuchsia-500/50', bg: 'bg-fuchsia-500/10' },
    FUNCIONALIDADE: { label: 'FUNCIONALIDADE', icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500/70 transition-colors placeholder:text-slate-700 font-mono';
const selectCls = `${inputCls} cursor-pointer`;

function FormField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block font-press text-[9px] text-slate-500 uppercase mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function timeLeft(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const h = Math.floor(diff / 3600000);
    if (h >= 48) return `${Math.floor(h / 24)}d`;
    return `${h}h`;
}

function StatusDot({ status }: { status: QuestStatus }) {
    return (
        <span className={cn('inline-block w-2 h-2 rounded-full', {
            'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]': status === 'active',
            'bg-slate-600': status === 'inactive',
            'bg-red-500': status === 'expired',
        })} />
    );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Modal de Chaves
// ─────────────────────────────────────────────────────────────────
function KeysModal({ quest, onClose }: { quest: Quest; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'used' | 'free'>('all');
    const [copied, setCopied] = useState<string | null>(null);

    const filtered = (quest.keys || []).filter(k => {
        const matchSearch = k.code.toLowerCase().includes(search.toLowerCase())
            || (k.usedBy || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ? true : filter === 'used' ? !!k.usedBy : !k.usedBy;
        return matchSearch && matchFilter;
    });

    const usedCount = (quest.keys || []).filter(k => !!k.usedBy).length;
    const freeCount = (quest.keys || []).length - usedCount;

    function copyCode(code: string) {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1800);
    }

    function copyAllFree() {
        const freeCodes = (quest.keys || []).filter(k => !k.usedBy).map(k => k.code).join('\n');
        navigator.clipboard.writeText(freeCodes);
        toast.success(`${freeCount} códigos copiados!`);
    }

    function handlePrint() {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`
            <html><head><title>Chaves — ${quest.title}</title>
            <style>body{font-family:monospace;padding:24px}h2{margin-bottom:16px}
            table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px 12px;text-align:left}
            .used{color:#999;text-decoration:line-through}.badge{font-size:10px;padding:2px 6px;border-radius:4px}
            .free{background:#d1fae5;color:#065f46}.taken{background:#fee2e2;color:#991b1b}
            </style></head><body>
            <h2>Missão: ${quest.title}</h2>
            <p>Total: ${quest.keys.length} | Usadas: ${usedCount} | Livres: ${freeCount}</p>
            <table><thead><tr><th>Código</th><th>Status</th><th>Usado por</th></tr></thead><tbody>
            ${quest.keys.map(k => `
                <tr class="${k.usedBy ? 'used' : ''}">
                    <td>${k.code}</td>
                    <td><span class="badge ${k.usedBy ? 'taken' : 'free'}">${k.usedBy ? 'USADA' : 'LIVRE'}</span></td>
                    <td>${k.usedBy || '—'}</td>
                </tr>`).join('')}
            </tbody></table></body></html>
        `);
        w.print();
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#07071a] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                            <Key size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-vt323 text-2xl text-white leading-none">{quest.title}</h3>
                            <p className="font-press text-[7px] text-slate-500 uppercase mt-1">Gerenciamento de Chaves</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-black/20 border-b border-white/5 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Buscar código ou aluno..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white text-xs font-mono outline-none focus:border-slate-600"
                        />
                    </div>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
                        {(['all', 'free', 'used'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg font-press text-[7px] transition-all',
                                    filter === f ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'
                                )}
                            >
                                {f === 'all' ? 'TODAS' : f === 'free' ? 'LIVRES' : 'USADAS'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar" style={{ height: '400px' }}>
                    {filtered.length === 0 && (
                        <div className="py-20 text-center">
                            <Key size={32} className="text-slate-800 mx-auto mb-2 opacity-20" />
                            <p className="font-vt323 text-xl text-slate-600">Nenhum código encontrado.</p>
                        </div>
                    )}
                    {filtered.map((k, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                'flex items-center justify-between p-3 rounded-xl border transition-all',
                                k.usedBy ? 'bg-black/20 border-slate-800/50 opacity-60' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <code className={cn('font-mono text-sm font-bold', k.usedBy ? 'text-slate-600 line-through' : 'text-yellow-400')}>
                                    {k.code}
                                </code>
                                {k.usedBy && (
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                                        <Users size={10} className="text-red-400" />
                                        <span className="font-press text-[6px] text-red-400 uppercase">{k.usedBy}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!k.usedBy && (
                                    <button
                                        onClick={() => copyCode(k.code)}
                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-yellow-400 transition-colors"
                                    >
                                        {copied === k.code ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="font-press text-[6px] text-slate-600 uppercase mb-1">Livres</p>
                            <p className="font-vt323 text-xl text-green-400 leading-none">{freeCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-press text-[6px] text-slate-600 uppercase mb-1">Usadas</p>
                            <p className="font-vt323 text-xl text-red-400 leading-none">{usedCount}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white font-press text-[8px]">IMPRIMIR</button>
                        <button onClick={copyAllFree} disabled={freeCount === 0} className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-press text-[8px] disabled:opacity-30">COPIAR LIVRES</button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Painel de Criação
// ─────────────────────────────────────────────────────────────────
function CreatePanel({ onClose, onSave }: { onClose: () => void; onSave: (form: FormState) => Promise<void> }) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        title: '',
        description: '',
        type: 'DIARIA',
        rewardPc: 50,
        validationType: 'SECRET_CODE',
        expiresAt: '',
        generateKeysCount: 30,
        rewardItems: [],
    });

    // Buscar itens oficiais do banco
    const { data: availableItems = [] } = useQuery<StoreItem[]>({
        queryKey: ['admin', 'store-items'],
        queryFn: async () => {
            const res = await api.get('/inventory/items'); // Rota getAllItems no inventoryController
            return res.data;
        }
    });

    const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }));

    // Prazos Inteligentes
    useEffect(() => {
        const now = new Date();
        let future = new Date();
        if (form.type === 'DIARIA') future.setHours(now.getHours() + 24);
        else if (form.type === 'SEMANAL') future.setDate(now.getDate() + 7);
        else if (form.type === 'MENSAL') future.setMonth(now.getMonth() + 1);
        else return;

        const iso = future.toISOString().slice(0, 16);
        set('expiresAt', iso);
    }, [form.type]);

    const addItem = () => {
        const newItem: RewardItem = { itemId: '', name: '', category: 'CONSUMIVEL', validityDays: 90, sendToClassroom: false };
        set('rewardItems', [...form.rewardItems, newItem]);
    };

    const updateItem = (idx: number, field: keyof RewardItem, val: any) => {
        const items = [...form.rewardItems];

        // Lógica de Autofill ao selecionar o item
        if (field === 'itemId') {
            const selected = availableItems.find(i => i._id === val);
            if (selected) {
                items[idx] = {
                    ...items[idx],
                    itemId: val,
                    name: selected.nome,
                    category: selected.tipo === 'BUFF' ? 'BUFF' : 'CONSUMIVEL',
                    validityDays: selected.validadeDias || 90
                };
            }
        } else {
            items[idx] = { ...items[idx], [field]: val };
        }

        set('rewardItems', items);
    };

    const removeItem = (idx: number) => {
        set('rewardItems', form.rewardItems.filter((_, i) => i !== idx));
    };

    async function handleSave() {
        if (!form.title.trim()) return toast.error('Título é obrigatório');
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[301] bg-[#0a0a1f] border-l border-white/10 shadow-2xl flex flex-col"
            >
                <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-purple-900/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                            <Plus size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-vt323 text-2xl text-white leading-none">Nova Missão</h3>
                            <p className="font-press text-[7px] text-slate-500 uppercase mt-1">Configuração de Desafio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <FormField label="TITULO DA MISSAO">
                        <input type="text" className={inputCls} placeholder="Ex: Presença de Ouro" value={form.title} onChange={e => set('title', e.target.value)} />
                    </FormField>

                    <FormField label="DESCRICAO / OBJETIVO">
                        <textarea className={cn(inputCls, 'min-h-[80px] resize-none')} placeholder="O que o aluno precisa fazer?" value={form.description} onChange={e => set('description', e.target.value)} />
                    </FormField>

                    <FormField label="TIPO DE MISSAO">
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(TYPE_CFG) as QuestType[]).map(t => {
                                const cfg = TYPE_CFG[t];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => set('type', t)}
                                        className={cn(
                                            'flex items-center gap-2 p-3 rounded-xl border transition-all',
                                            form.type === t ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-700 bg-black/30 hover:border-slate-600 text-slate-500'
                                        )}
                                    >
                                        <cfg.icon size={14} />
                                        <span className="font-press text-[8px]">{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </FormField>

                    <div className="grid grid-cols-1 gap-4">
                        <FormField label="RECOMPENSA PC$">
                            <div className="relative">
                                <Gift size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" />
                                <input type="number" className={cn(inputCls, 'pl-9')} min={0} value={form.rewardPc} onChange={e => set('rewardPc', Number(e.target.value))} />
                            </div>
                        </FormField>
                    </div>

                    <FormField label="EXPIRA EM">
                        <input type="datetime-local" className={selectCls} value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
                    </FormField>

                    <FormField label="METODO DE VALIDACAO">
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { val: 'SECRET_CODE', label: 'CODIGO SECRETO', icon: Key, color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
                                { val: 'MANUAL_ADMIN', label: 'MANUAL ADMIN', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
                            ] as const).map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => set('validationType', opt.val)}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                                        form.validationType === opt.val ? `${opt.border} ${opt.bg}` : 'border-slate-700 bg-black/30 hover:border-slate-600'
                                    )}
                                >
                                    <opt.icon size={16} className={form.validationType === opt.val ? opt.color : 'text-slate-600'} />
                                    <span className={cn('font-press text-[7px] text-center leading-tight', form.validationType === opt.val ? opt.color : 'text-slate-600')}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </FormField>

                    {form.validationType === 'SECRET_CODE' && (
                        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <Key size={13} className="text-yellow-400" />
                                <span className="font-press text-[9px] text-yellow-400">GERADOR DE CHAVES</span>
                            </div>
                            <FormField label="QUANTAS CHAVES UNICAS GERAR?">
                                <input type="number" min={1} max={500} className={inputCls} value={form.generateKeysCount} onChange={e => set('generateKeysCount', Number(e.target.value))} />
                            </FormField>
                        </div>
                    )}

                    {/* ── RECOMPENSA DE ITENS ── */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package size={14} className="text-purple-400" />
                                <span className="font-press text-[9px] text-purple-400">RECOMPENSA DE ITENS</span>
                            </div>
                            <button onClick={addItem} className="p-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {form.rewardItems.map((item, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 relative group">
                                    <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 transition-colors">
                                        <Trash size={14} />
                                    </button>

                                    <FormField label="SELECIONAR ITEM">
                                        <select
                                            className={selectCls}
                                            value={item.itemId}
                                            onChange={e => updateItem(idx, 'itemId', e.target.value)}
                                        >
                                            <option value="">Selecione um item...</option>
                                            {availableItems.map(i => (
                                                <option key={i._id} value={i._id}>{i.nome}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <div className={cn('w-4 h-4 rounded border flex items-center justify-center transition-all', item.sendToClassroom ? 'bg-purple-600 border-purple-500' : 'border-slate-700 bg-black/20')}>
                                            {item.sendToClassroom && <Check size={10} className="text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={item.sendToClassroom} onChange={e => updateItem(idx, 'sendToClassroom', e.target.checked)} />
                                        <span className="font-press text-[7px] text-slate-400 uppercase">Enviar para Mochila da Turma?</span>
                                    </label>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-5 border-t border-white/5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-press text-[9px]">CANCELAR</button>
                    <button onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-press text-[9px] disabled:opacity-40">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : 'CRIAR MISSAO'}
                    </button>
                </div>
            </motion.div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export function AdminQuests() {
    const queryClient = useQueryClient();

    // 🔌 FETCH DATA COM O TRADUTOR RESTAURADO
    const { data: quests = [], isLoading } = useQuery<Quest[]>({
        queryKey: ['admin', 'quests'],
        queryFn: async () => {
            const res = await api.get('/admin/quests');

            return res.data.map((q: any) => ({
                ...q,
                _id: q._id,
                status: q.isActive ? 'active' : 'inactive',
                validationType: q.validationMethod, // Conserta o botão MANUAL/CÓDIGO
                rewardPc: q.rewards?.pc || 0,       // Devolve o número do PC$
                // Mapeia o array de chaves para o botão do olhinho voltar a funcionar
                keys: (q.validCodes || []).map((c: any) => ({
                    code: c.code,
                    usedBy: c.isUsed ? 'Resgatado' : undefined
                })),
                usedCount: (q.validCodes || []).filter((c: any) => c.isUsed).length
            }));
        }
    });

    const [showCreate, setShowCreate] = useState(false);
    const [keysTarget, setKeysTarget] = useState<Quest | null>(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | QuestType>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | QuestStatus>('ALL');

    const filtered = useMemo(() => quests.filter(q => {
        const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'ALL' || q.type === filterType;
        const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
        return matchSearch && matchType && matchStatus;
    }), [quests, search, filterType, filterStatus]);

    const totalActive = quests.filter(q => q.status === 'active').length;
    const totalKeys = quests.reduce((acc, q) => acc + (q.keys?.length || 0), 0);
    const totalUsed = quests.reduce((acc, q) => acc + (q.usedCount || 0), 0);

    const createMutation = useMutation({
        mutationFn: (form: FormState) => api.post('/admin/quests', form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'quests'] });
            toast.success('Missão criada com sucesso!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao criar missão')
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/admin/quests/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'quests'] });
            toast.success('Status atualizado.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/quests/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'quests'] });
            toast.success('Missão removida.');
        }
    });

    return (
        <AdminLayout>
            <PageTransition>
                <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sword size={18} className="text-purple-400" />
                                <span className="font-press text-[9px] text-purple-400 uppercase tracking-widest">GERENCIAMENTO</span>
                            </div>
                            <h1 className="font-vt323 text-4xl text-white leading-none">Quadro de Missões</h1>
                        </div>
                        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-press text-[9px] shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                            <Plus size={14} /> NOVA MISSAO
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'ATIVAS', value: totalActive, color: 'text-green-400', icon: CheckCircle2 },
                            { label: 'TOTAL', value: quests.length, color: 'text-slate-300', icon: Scroll },
                            { label: 'CHAVES', value: totalKeys, color: 'text-yellow-400', icon: Key },
                            { label: 'COMPLECOES', value: totalUsed, color: 'text-purple-400', icon: Users },
                        ].map(stat => (
                            <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-center shrink-0">
                                    <stat.icon size={16} className={stat.color} />
                                </div>
                                <div>
                                    <p className="font-press text-[7px] text-slate-600 uppercase">{stat.label}</p>
                                    <p className={cn('font-vt323 text-2xl leading-none', stat.color)}>{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input type="text" placeholder="Buscar missão..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm font-mono outline-none focus:border-slate-600 placeholder:text-slate-700" />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {(['ALL', 'DIARIA', 'SEMANAL', 'EVENTO', 'MENSAL', 'CAMPANHA', 'FUNCIONALIDADE'] as const).map(t => {
                                const cfg = t !== 'ALL' ? TYPE_CFG[t] : null;
                                return (
                                    <button key={t} onClick={() => setFilterType(t)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border font-press text-[8px] transition-all', filterType === t ? (cfg ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-white/20 bg-white/10 text-white') : 'border-slate-700 text-slate-500')}>
                                        {cfg && <cfg.icon size={10} />}
                                        {t === 'ALL' ? 'TODOS' : cfg?.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 🚀 FILTRO DE STATUS RESTAURADO */}
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="bg-black/40 border border-slate-700 rounded-xl px-3 py-2 text-white text-[10px] font-press outline-none focus:border-purple-500 cursor-pointer"
                        >
                            <option value="ALL">TODOS STATUS</option>
                            <option value="active">ATIVAS</option>
                            <option value="inactive">INATIVAS</option>
                            <option value="expired">EXPIRADAS</option>
                        </select>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="hidden md:grid grid-cols-[1fr_100px_90px_110px_120px_100px] gap-3 px-4 py-3 border-b border-white/5">
                            {['TITULO', 'TIPO', 'PC$', 'VALIDACAO', 'CHAVES', 'ACOES'].map(h => (
                                <span key={h} className="font-press text-[8px] text-slate-600 uppercase">{h}</span>
                            ))}
                        </div>

                        <div className="divide-y divide-white/5">
                            {isLoading ? (
                                <div className="text-center py-20"><Loader2 size={32} className="text-purple-500 animate-spin mx-auto mb-3" /></div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16"><p className="font-vt323 text-2xl text-slate-700">Nenhuma missão encontrada.</p></div>
                            ) : (
                                filtered.map((quest, i) => {
                                    const cfg = TYPE_CFG[quest.type];
                                    const freeKeys = (quest.keys || []).filter(k => !k.usedBy).length;
                                    return (
                                        <motion.div key={quest._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cn('px-4 py-4 hover:bg-white/2 transition-colors grid grid-cols-1 md:grid-cols-[1fr_100px_90px_110px_120px_100px] gap-3 items-center', quest.status === 'inactive' && 'opacity-50')}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <StatusDot status={quest.status} />
                                                <div className="min-w-0">
                                                    <p className="font-vt323 text-xl text-white leading-none truncate">{quest.title}</p>
                                                    <p className="font-poppins text-[10px] text-slate-500 truncate mt-0.5">{quest.description}</p>
                                                    {quest.expiresAt && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock size={10} className="text-orange-400" />
                                                            <span className="font-mono text-[9px] text-orange-400">{timeLeft(quest.expiresAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div><span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-press text-[8px]', cfg.bg, cfg.border, cfg.color)}><cfg.icon size={9} />{cfg.label}</span></div>
                                            <div><div className="flex items-center gap-1"><Gift size={11} className="text-yellow-400" /><span className="font-vt323 text-lg text-yellow-400">{quest.rewardPc}</span></div></div>
                                            <div>{quest.validationType === 'SECRET_CODE' ? <div className="flex items-center gap-1.5 text-yellow-400"><Key size={12} /><span className="font-press text-[7px]">CODIGO</span></div> : <div className="flex items-center gap-1.5 text-blue-400"><Shield size={12} /><span className="font-press text-[7px]">MANUAL</span></div>}</div>
                                            <div>
                                                {quest.validationType === 'SECRET_CODE' ? (
                                                    <button onClick={() => setKeysTarget(quest)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-press text-[8px]"><Key size={11} />{freeKeys}/{quest.keys.length}<Eye size={10} /></button>
                                                ) : <div className="flex items-center gap-1.5 text-slate-500"><Users size={11} /><span className="font-mono text-[10px]">{quest.usedCount} ok</span></div>}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => toggleMutation.mutate(quest._id)} className={cn('p-2 rounded-lg border transition-all', quest.status === 'active' ? 'border-green-500/30 bg-green-500/10' : 'border-slate-700 bg-slate-800/40')}>{quest.status === 'active' ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} className="text-slate-500" />}</button>
                                                <button onClick={() => { if (confirm('Deletar?')) deleteMutation.mutate(quest._id) }} className="p-2 rounded-lg border border-red-900/30 bg-red-950/20 text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showCreate && <CreatePanel onClose={() => setShowCreate(false)} onSave={async (f) => { await createMutation.mutateAsync(f); }} />}
                    {keysTarget && <KeysModal quest={keysTarget} onClose={() => setKeysTarget(null)} />}
                </AnimatePresence>
            </PageTransition>
        </AdminLayout>
    );
}

function CheckCircle2(props: any) { return <Check size={props.size} className={props.className} />; }
