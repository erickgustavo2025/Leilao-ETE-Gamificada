// ARQUIVO: frontend/src/pages/admin/AdminQuests.tsx
// ─────────────────────────────────────────────────────────────────
// 🔌 PONTOS DE INTEGRAÇÃO COM O BACKEND estão marcados com 🔌
// ─────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import {
    Plus, Scroll, Key, Copy, Check, X, ChevronDown,
    Eye, EyeOff, Trash2, ToggleLeft, ToggleRight,
    Clock, Calendar, Flame, Crown, Search,
    Loader2, Shield, AlertTriangle, Printer,
    Gift, Hash, Users, CheckCircle2, XCircle,
    Filter, RefreshCw, Sword,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────
type QuestType       = 'DIARIA' | 'SEMANAL' | 'EVENTO' | 'EPICA';
type ValidationType  = 'SECRET_CODE' | 'MANUAL_ADMIN';
type QuestStatus     = 'active' | 'inactive' | 'expired';

interface QuestKey {
    code: string;
    usedBy?: string;   // nome do aluno
    usedAt?: string;   // ISO date
}

interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    rewardXp: number;
    validationType: ValidationType;
    status: QuestStatus;
    expiresAt?: string;
    createdAt: string;
    keys: QuestKey[];         // vazio se MANUAL_ADMIN
    usedCount: number;        // quantos alunos já completaram
    targetCount?: number;     // capacidade máxima (= keys.length)
}

interface FormState {
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    rewardXp: number;
    validationType: ValidationType;
    expiresAt: string;
    generateKeysCount: number;
}

// ─────────────────────────────────────────────────────────────────
// MOCK DATA — substituir por useQuery
// 🔌 BACKEND: GET /api/admin/quests
// ─────────────────────────────────────────────────────────────────
const MOCK_QUESTS: Quest[] = [
    {
        id: 'q1', title: 'Presença Impecável', description: 'Chegue no horário em todas as aulas do dia.',
        type: 'DIARIA', rewardPc: 30, rewardXp: 10, validationType: 'SECRET_CODE',
        status: 'active', expiresAt: new Date(Date.now() + 18 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), usedCount: 12,
        keys: [
            { code: 'PRES-A1B2', usedBy: 'Pedro Alves',   usedAt: new Date().toISOString() },
            { code: 'PRES-C3D4', usedBy: 'Ana Souza',     usedAt: new Date().toISOString() },
            { code: 'PRES-E5F6' },
            { code: 'PRES-G7H8' },
            { code: 'PRES-I9J0' },
            { code: 'PRES-K1L2', usedBy: 'João Lima',     usedAt: new Date().toISOString() },
            { code: 'PRES-M3N4' },
            { code: 'PRES-O5P6' },
        ],
    },
    {
        id: 'q2', title: 'Guardião do Saber', description: 'Tire nota acima de 7 em todas as avaliações da semana.',
        type: 'SEMANAL', rewardPc: 150, rewardXp: 50, validationType: 'SECRET_CODE',
        status: 'active', expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(), usedCount: 4,
        keys: [
            { code: 'SABER-ZZ01' },
            { code: 'SABER-ZZ02', usedBy: 'Maria Costa', usedAt: new Date().toISOString() },
            { code: 'SABER-ZZ03' },
            { code: 'SABER-ZZ04', usedBy: 'Lucas Neto',  usedAt: new Date().toISOString() },
            { code: 'SABER-ZZ05' },
        ],
    },
    {
        id: 'q3', title: 'Colaborador do Dia', description: 'Ajude um colega de turma com alguma atividade.',
        type: 'DIARIA', rewardPc: 20, rewardXp: 15, validationType: 'MANUAL_ADMIN',
        status: 'active', expiresAt: new Date(Date.now() + 6 * 3600000).toISOString(),
        createdAt: new Date().toISOString(), usedCount: 7, keys: [],
    },
    {
        id: 'q4', title: 'EVENTO: Gincana Científica', description: 'Participe da gincana e contribua com pelo menos 3 respostas corretas.',
        type: 'EVENTO', rewardPc: 500, rewardXp: 200, validationType: 'SECRET_CODE',
        status: 'active', expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(), usedCount: 0,
        keys: Array.from({ length: 30 }, (_, i) => ({ code: `GINCA-${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2,5).toUpperCase()}` })),
    },
    {
        id: 'q5', title: 'Missão Elite — Rank Ouro', description: 'Complete o desafio épico do rank Ouro.',
        type: 'EPICA', rewardPc: 0, rewardXp: 0, validationType: 'SECRET_CODE',
        status: 'inactive', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), usedCount: 2,
        keys: [{ code: 'ELITE-OURO-001' }, { code: 'ELITE-OURO-002', usedBy: 'Felipe Dias', usedAt: new Date().toISOString() }],
    },
];

// ─────────────────────────────────────────────────────────────────
// CONFIG VISUAL POR TIPO
// ─────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<QuestType, { label: string; icon: any; color: string; border: string; bg: string }> = {
    DIARIA:  { label: 'DIARIA',   icon: Clock,    color: 'text-blue-400',   border: 'border-blue-500/50',   bg: 'bg-blue-500/10'   },
    SEMANAL: { label: 'SEMANAL',  icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    EVENTO:  { label: 'EVENTO',   icon: Flame,    color: 'text-rose-400',   border: 'border-rose-500/50',   bg: 'bg-rose-500/10'   },
    EPICA:   { label: 'EPICA',    icon: Crown,    color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
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

    const filtered = quest.keys.filter(k => {
        const matchSearch = k.code.toLowerCase().includes(search.toLowerCase())
            || (k.usedBy || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ? true : filter === 'used' ? !!k.usedBy : !k.usedBy;
        return matchSearch && matchFilter;
    });

    const usedCount  = quest.keys.filter(k => !!k.usedBy).length;
    const freeCount  = quest.keys.length - usedCount;
    const usedPct    = quest.keys.length > 0 ? Math.round((usedCount / quest.keys.length) * 100) : 0;

    function copyCode(code: string) {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1800);
    }

    function copyAllFree() {
        const freeCodes = quest.keys.filter(k => !k.usedBy).map(k => k.code).join('\n');
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-[#07071a] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <Key size={16} className="text-yellow-400" />
                        </div>
                        <div>
                            <p className="font-press text-[9px] text-slate-500 uppercase">CHAVES DA MISSAO</p>
                            {/* COM ACENTO → font-vt323 */}
                            <h3 className="font-vt323 text-2xl text-white leading-none">{quest.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Stats bar */}
                <div className="p-4 border-b border-white/5 space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 size={12} className="text-green-400" />
                            <span className="font-press text-[8px] text-green-400">{freeCount} LIVRES</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                            <XCircle size={12} className="text-red-400" />
                            <span className="font-press text-[8px] text-red-400">{usedCount} USADAS</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                            <Hash size={12} className="text-slate-400" />
                            <span className="font-press text-[8px] text-slate-400">{quest.keys.length} TOTAL</span>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={copyAllFree}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-press text-[8px] text-slate-300 transition-colors"
                            >
                                <Copy size={11} /> COPIAR LIVRES
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-press text-[8px] text-slate-300 transition-colors"
                            >
                                <Printer size={11} /> IMPRIMIR
                            </button>
                        </div>
                    </div>

                    {/* Barra de uso */}
                    <div>
                        <div className="flex justify-between font-mono text-[9px] text-slate-600 mb-1">
                            <span>Uso das chaves</span>
                            <span>{usedPct}%</span>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${usedPct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Buscar código ou aluno..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded-lg py-2 pl-8 pr-3 text-white text-xs font-mono outline-none focus:border-slate-500 placeholder:text-slate-700"
                            />
                        </div>
                        {(['all','free','used'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'px-3 py-2 rounded-lg border font-press text-[8px] transition-all',
                                    filter === f
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                        : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                )}
                            >
                                {f === 'all' ? 'TODOS' : f === 'free' ? 'LIVRES' : 'USADAS'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de chaves */}
                <div className="overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '380px' }}>
                    {filtered.length === 0 && (
                        <div className="text-center py-10">
                            <p className="font-vt323 text-2xl text-slate-700">Nenhuma chave encontrada.</p>
                        </div>
                    )}
                    {filtered.map((key, i) => (
                        <motion.div
                            key={key.code}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                                key.usedBy
                                    ? 'border-red-900/30 bg-red-950/20 opacity-60'
                                    : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
                            )}
                        >
                            {/* Status indicator */}
                            <div className={cn('w-2 h-2 rounded-full shrink-0', key.usedBy ? 'bg-red-500' : 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]')} />

                            {/* Código */}
                            <code className={cn('flex-1 font-mono text-sm tracking-widest', key.usedBy ? 'text-slate-600 line-through' : 'text-yellow-300')}>
                                {key.code}
                            </code>

                            {/* Quem usou */}
                            {key.usedBy && (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Users size={11} />
                                    <span className="font-mono text-[10px]">{key.usedBy}</span>
                                </div>
                            )}

                            {/* Botão copiar */}
                            {!key.usedBy && (
                                <button
                                    onClick={() => copyCode(key.code)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                >
                                    {copied === key.code
                                        ? <Check size={13} className="text-green-400" />
                                        : <Copy size={13} />
                                    }
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Painel de Criação (slide-in)
// ─────────────────────────────────────────────────────────────────
function CreatePanel({ onClose, onSave }: { onClose: () => void; onSave: (form: FormState) => Promise<void> }) {
    const [form, setForm] = useState<FormState>({
        title: '', description: '', type: 'DIARIA', rewardPc: 50, rewardXp: 20,
        validationType: 'SECRET_CODE', expiresAt: '', generateKeysCount: 30,
    });
    const [saving, setSaving] = useState(false);

    function set<K extends keyof FormState>(key: K, val: FormState[K]) {
        setForm(prev => ({ ...prev, [key]: val }));
    }

    async function handleSave() {
        if (!form.title.trim()) { toast.error('Título obrigatório.'); return; }
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } finally {
            setSaving(false);
        }
    }

    const cfg = TYPE_CFG[form.type];

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Painel lateral */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-[300] w-full max-w-md bg-[#07071a] border-l border-slate-700/60 flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header do painel */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg border', cfg.bg, cfg.border)}>
                            <cfg.icon size={16} className={cfg.color} />
                        </div>
                        <div>
                            <p className="font-press text-[9px] text-slate-500 uppercase">NOVA MISSAO</p>
                            <p className={cn('font-press text-[10px]', cfg.color)}>{form.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Formulário (scrollável) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Tipo — seletor visual */}
                    <FormField label="TIPO DA MISSAO">
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(TYPE_CFG) as QuestType[]).map(t => {
                                const c = TYPE_CFG[t];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => set('type', t)}
                                        className={cn(
                                            'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                                            form.type === t
                                                ? `${c.border} ${c.bg}`
                                                : 'border-slate-700 bg-black/30 hover:border-slate-600'
                                        )}
                                    >
                                        <c.icon size={14} className={form.type === t ? c.color : 'text-slate-600'} />
                                        <span className={cn('font-press text-[8px]', form.type === t ? c.color : 'text-slate-600')}>
                                            {c.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </FormField>

                    <FormField label="TITULO">
                        <input
                            type="text"
                            className={inputCls}
                            placeholder="Ex: Presença Impecável"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            maxLength={60}
                        />
                    </FormField>

                    <FormField label="DESCRICAO">
                        <textarea
                            rows={3}
                            className={cn(inputCls, 'resize-none')}
                            placeholder="Descreva o que o aluno precisa fazer..."
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </FormField>

                    {/* Recompensas */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="RECOMPENSA PC$">
                            <input
                                type="number"
                                className={inputCls}
                                min={0}
                                value={form.rewardPc}
                                onChange={e => set('rewardPc', Number(e.target.value))}
                            />
                        </FormField>
                        <FormField label="RECOMPENSA XP">
                            <input
                                type="number"
                                className={inputCls}
                                min={0}
                                value={form.rewardXp}
                                onChange={e => set('rewardXp', Number(e.target.value))}
                            />
                        </FormField>
                    </div>

                    <FormField label="EXPIRA EM (OPCIONAL)">
                        <input
                            type="datetime-local"
                            className={selectCls}
                            value={form.expiresAt}
                            onChange={e => set('expiresAt', e.target.value)}
                        />
                    </FormField>

                    {/* Método de validação */}
                    <FormField label="METODO DE VALIDACAO">
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { val: 'SECRET_CODE',  label: 'CODIGO SECRETO', icon: Key,    color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
                                { val: 'MANUAL_ADMIN', label: 'MANUAL ADMIN',   icon: Shield, color: 'text-blue-400',   border: 'border-blue-500/50',   bg: 'bg-blue-500/10'   },
                            ] as const).map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => set('validationType', opt.val)}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                                        form.validationType === opt.val
                                            ? `${opt.border} ${opt.bg}`
                                            : 'border-slate-700 bg-black/30 hover:border-slate-600'
                                    )}
                                >
                                    <opt.icon size={16} className={form.validationType === opt.val ? opt.color : 'text-slate-600'} />
                                    <span className={cn('font-press text-[7px] text-center leading-tight', form.validationType === opt.val ? opt.color : 'text-slate-600')}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </FormField>

                    {/* ── GERADOR DE CHAVES (aparece somente se SECRET_CODE) ── */}
                    <AnimatePresence>
                        {form.validationType === 'SECRET_CODE' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Key size={13} className="text-yellow-400" />
                                        <span className="font-press text-[9px] text-yellow-400">GERADOR DE CHAVES</span>
                                    </div>
                                    <FormField label="QUANTAS CHAVES UNICAS GERAR?">
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            className={inputCls}
                                            value={form.generateKeysCount}
                                            onChange={e => set('generateKeysCount', Number(e.target.value))}
                                        />
                                    </FormField>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5">
                                        <AlertTriangle size={12} className="text-yellow-600 shrink-0 mt-0.5" />
                                        <p className="font-poppins text-[10px] text-slate-500 leading-relaxed">
                                            O backend irá gerar <strong className="text-yellow-400">{form.generateKeysCount}</strong> chaves únicas e aleatórias.
                                            Cada aluno usa uma chave. O payload enviado inclui o campo <code className="text-yellow-300 bg-black/40 px-1 rounded">generateKeysCount</code>.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Preview do payload — útil para o CTO */}
                    <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer font-press text-[8px] text-slate-700 hover:text-slate-500 select-none list-none">
                            <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                            PREVIEW DO PAYLOAD (DEV)
                        </summary>
                        <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-slate-800 text-[9px] font-mono text-green-400 overflow-x-auto leading-relaxed">
{JSON.stringify({
    title: form.title || '...',
    description: form.description || '...',
    type: form.type,
    rewardPc: form.rewardPc,
    rewardXp: form.rewardXp,
    validationType: form.validationType,
    expiresAt: form.expiresAt || null,
    ...(form.validationType === 'SECRET_CODE' ? { generateKeysCount: form.generateKeysCount } : {}),
}, null, 2)}
                        </pre>
                    </details>
                </div>

                {/* Footer fixo */}
                <div className="shrink-0 p-5 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 font-press text-[9px] transition-colors"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.title.trim()}
                        className={cn(
                            'flex-1 py-3 rounded-xl font-press text-[9px] flex items-center justify-center gap-2 transition-all',
                            'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed',
                        )}
                        style={{ boxShadow: form.title ? '0 0 20px rgba(168,85,247,0.35)' : undefined }}
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <><Plus size={13} /> CRIAR MISSAO</>}
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
    // 🔌 BACKEND: substituir por useQuery({ queryKey: ['admin','quests'], queryFn: () => api.get('/admin/quests') })
    const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);

    const [showCreate, setShowCreate]   = useState(false);
    const [keysTarget, setKeysTarget]   = useState<Quest | null>(null);
    const [search, setSearch]           = useState('');
    const [filterType, setFilterType]   = useState<'ALL' | QuestType>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | QuestStatus>('ALL');

    const filtered = useMemo(() => quests.filter(q => {
        const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
        const matchType   = filterType === 'ALL'   || q.type === filterType;
        const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
        return matchSearch && matchType && matchStatus;
    }), [quests, search, filterType, filterStatus]);

    // Stats para o header
    const totalActive = quests.filter(q => q.status === 'active').length;
    const totalKeys   = quests.reduce((acc, q) => acc + q.keys.length, 0);
    const totalUsed   = quests.reduce((acc, q) => acc + q.usedCount, 0);

    // ── 🔌 Handler de criar (mock)
    async function handleCreate(form: FormState) {
        // 🔌 BACKEND: await api.post('/admin/quests', form)
        await new Promise(r => setTimeout(r, 800));
        toast.success(`Missão "${form.title}" criada! ${form.validationType === 'SECRET_CODE' ? `${form.generateKeysCount} chaves geradas.` : ''}`);
    }

    // ── 🔌 Handler de toggle status
    function handleToggle(id: string) {
        // 🔌 BACKEND: await api.patch(`/admin/quests/${id}/toggle`)
        setQuests(prev => prev.map(q =>
            q.id === id ? { ...q, status: q.status === 'active' ? 'inactive' : 'active' } : q
        ));
        toast.success('Status atualizado.');
    }

    // ── 🔌 Handler de deletar
    function handleDelete(id: string) {
        if (!confirm('Deletar esta missão permanentemente?')) return;
        // 🔌 BACKEND: await api.delete(`/admin/quests/${id}`)
        setQuests(prev => prev.filter(q => q.id !== id));
        toast.success('Missão removida.');
    }

    return (
        <AdminLayout>
            <PageTransition>
                <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

                    {/* ── HEADER ── */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sword size={18} className="text-purple-400" />
                                <span className="font-press text-[9px] text-purple-400 uppercase tracking-widest">GERENCIAMENTO</span>
                            </div>
                            {/* COM ACENTO → font-vt323 */}
                            <h1 className="font-vt323 text-4xl text-white leading-none">Quadro de Missões</h1>
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-press text-[9px] transition-all shrink-0"
                            style={{ boxShadow: '0 0 20px rgba(168,85,247,0.35)' }}
                        >
                            <Plus size={14} /> NOVA MISSAO
                        </button>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'ATIVAS',     value: totalActive,       color: 'text-green-400',  icon: CheckCircle2 },
                            { label: 'TOTAL',      value: quests.length,     color: 'text-slate-300',  icon: Scroll       },
                            { label: 'CHAVES',     value: totalKeys,         color: 'text-yellow-400', icon: Key          },
                            { label: 'COMPLECOES', value: totalUsed,         color: 'text-purple-400', icon: Users        },
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

                    {/* ── FILTROS ── */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Busca */}
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Buscar missão..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm font-mono outline-none focus:border-slate-600 placeholder:text-slate-700"
                            />
                        </div>

                        {/* Tipo */}
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                            {(['ALL', 'DIARIA', 'SEMANAL', 'EVENTO', 'EPICA'] as const).map(t => {
                                const cfg = t !== 'ALL' ? TYPE_CFG[t] : null;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-2 rounded-xl border font-press text-[8px] whitespace-nowrap transition-all shrink-0',
                                            filterType === t
                                                ? (cfg ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-white/20 bg-white/10 text-white')
                                                : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                        )}
                                    >
                                        {cfg && <cfg.icon size={10} />}
                                        {t === 'ALL' ? 'TODOS' : cfg?.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status */}
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="bg-black/40 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-slate-600 cursor-pointer"
                        >
                            <option value="ALL">Todos os status</option>
                            <option value="active">Ativa</option>
                            <option value="inactive">Inativa</option>
                            <option value="expired">Expirada</option>
                        </select>
                    </div>

                    {/* ── TABELA / GRID DE MISSÕES ── */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">

                        {/* Header da tabela */}
                        <div className="hidden md:grid grid-cols-[1fr_100px_90px_110px_120px_100px] gap-3 px-4 py-3 border-b border-white/5">
                            {['TITULO', 'TIPO', 'PC$', 'VALIDACAO', 'CHAVES', 'ACOES'].map(h => (
                                <span key={h} className="font-press text-[8px] text-slate-600 uppercase">{h}</span>
                            ))}
                        </div>

                        {/* Linhas */}
                        <div className="divide-y divide-white/5">
                            {filtered.length === 0 && (
                                <div className="text-center py-16">
                                    <Scroll size={32} className="text-slate-800 mx-auto mb-3" />
                                    <p className="font-vt323 text-2xl text-slate-700">Nenhuma missão encontrada.</p>
                                </div>
                            )}
                            {filtered.map((quest, i) => {
                                const cfg = TYPE_CFG[quest.type];
                                const freeKeys = quest.keys.filter(k => !k.usedBy).length;
                                return (
                                    <motion.div
                                        key={quest.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={cn(
                                            'px-4 py-4 hover:bg-white/2 transition-colors',
                                            'grid grid-cols-1 md:grid-cols-[1fr_100px_90px_110px_120px_100px] gap-3 items-center',
                                            quest.status === 'inactive' && 'opacity-50'
                                        )}
                                    >
                                        {/* Título + descrição */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <StatusDot status={quest.status} />
                                            <div className="min-w-0">
                                                {/* COM ACENTO → font-vt323 */}
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

                                        {/* Tipo */}
                                        <div>
                                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-press text-[8px]', cfg.bg, cfg.border, cfg.color)}>
                                                <cfg.icon size={9} />{cfg.label}
                                            </span>
                                        </div>

                                        {/* Recompensa */}
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <Gift size={11} className="text-yellow-400" />
                                                <span className="font-vt323 text-lg text-yellow-400">{quest.rewardPc}</span>
                                            </div>
                                            <span className="font-mono text-[9px] text-slate-600">{quest.rewardXp} XP</span>
                                        </div>

                                        {/* Método */}
                                        <div>
                                            {quest.validationType === 'SECRET_CODE' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Key size={12} className="text-yellow-400" />
                                                    <span className="font-press text-[7px] text-yellow-400">CODIGO</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={12} className="text-blue-400" />
                                                    <span className="font-press text-[7px] text-blue-400">MANUAL</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chaves / progresso */}
                                        <div>
                                            {quest.validationType === 'SECRET_CODE' && quest.keys.length > 0 ? (
                                                <button
                                                    onClick={() => setKeysTarget(quest)}
                                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 transition-all group"
                                                >
                                                    <Key size={11} className="text-yellow-400" />
                                                    <span className="font-press text-[8px] text-yellow-400">{freeKeys}/{quest.keys.length}</span>
                                                    <Eye size={10} className="text-yellow-400/50 group-hover:text-yellow-400 transition-colors" />
                                                </button>
                                            ) : quest.validationType === 'MANUAL_ADMIN' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={11} className="text-slate-500" />
                                                    <span className="font-mono text-[10px] text-slate-500">{quest.usedCount} ok</span>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-[10px] text-slate-700">—</span>
                                            )}
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleToggle(quest.id)}
                                                className={cn('p-2 rounded-lg border transition-all', quest.status === 'active'
                                                    ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                                                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                                                )}
                                                title={quest.status === 'active' ? 'Desativar' : 'Ativar'}
                                            >
                                                {quest.status === 'active'
                                                    ? <ToggleRight size={14} className="text-green-400" />
                                                    : <ToggleLeft size={14} className="text-slate-500" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDelete(quest.id)}
                                                className="p-2 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-900/30 transition-colors"
                                                title="Deletar"
                                            >
                                                <Trash2 size={13} className="text-red-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rodapé */}
                    <p className="font-mono text-[10px] text-slate-700 text-center">
                        {filtered.length} de {quests.length} missões exibidas
                    </p>
                </div>
            </PageTransition>

            {/* ── MODAIS / PAINÉIS ── */}
            <AnimatePresence>
                {showCreate && (
                    <CreatePanel
                        key="create"
                        onClose={() => setShowCreate(false)}
                        onSave={handleCreate}
                    />
                )}
                {keysTarget && (
                    <KeysModal
                        key="keys"
                        quest={keysTarget}
                        onClose={() => setKeysTarget(null)}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
