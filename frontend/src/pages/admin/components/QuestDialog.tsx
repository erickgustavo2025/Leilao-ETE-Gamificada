import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Trophy, Gift, Check, Shield, Key, Package, Trash, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../../api/axios-config';
import { cn } from '../../../utils/cn';
import { QuestType, RewardItem, FormState, BADGE_OPTIONS, TYPE_CFG, StoreItem } from '../questTypes';

interface QuestDialogProps {
    onClose: () => void;
    onSave: (form: FormState) => Promise<void>;
}

const inputCls = 'w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-purple-500/70 transition-colors placeholder:text-slate-700 font-mono';
const selectCls = `${inputCls} cursor-pointer`;

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => {
    return (
        <div className={className}>
            <label className="block font-press text-[9px] text-slate-500 uppercase mb-1.5">{label}</label>
            {children}
        </div>
    );
};

export const QuestDialog: React.FC<QuestDialogProps> = ({ onClose, onSave }) => {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        title: '',
        description: '',
        type: 'DIARIA',
        rewardPc: 50,
        badgeId: '',
        validationType: 'SECRET_CODE',
        expiresAt: '',
        generateKeysCount: 30,
        rewardItems: [],
    });

    const { data: availableItems = [] } = useQuery<StoreItem[]>({
        queryKey: ['admin', 'store-items'],
        queryFn: async () => {
            const res = await api.get('/inventory/items');
            return res.data;
        }
    });

    const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        const now = new Date();
        const future = new Date();
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
        if (field === 'itemId') {
            const selected = availableItems.find(i => i._id === val);
            if (selected) {
                items[idx] = {
                    ...items[idx],
                    itemId: val,
                    name: selected.nome,
                    category: 'CONSUMIVEL',
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
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao salvar missão');
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
                                        type="button"
                                        onClick={() => set('type', t)}
                                        className={cn(
                                            'flex items-center gap-2 p-3 rounded-xl border transition-all',
                                            form.type === t ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-700 bg-black/30 hover:border-slate-600 text-slate-500'
                                        )}
                                    >
                                        <cfg.icon size={14} />
                                        <span className="font-press text-[8px] uppercase tracking-tighter leading-none">{cfg.label}</span>
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

                    <div className="p-4 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20 space-y-3">
                        <div className="flex items-center gap-2">
                            <Trophy size={13} className="text-fuchsia-400" />
                            <span className="font-press text-[9px] text-fuchsia-400">BADGE DE RECOMPENSA (OPCIONAL)</span>
                        </div>
                        <FormField label="SELECIONAR BADGE">
                            <select
                                className={selectCls}
                                value={form.badgeId}
                                onChange={e => set('badgeId', e.target.value)}
                            >
                                <option value="">Nenhuma badge (só PC$ / itens)</option>
                                <optgroup label="── FUNCIONALIDADE ──">
                                    {BADGE_OPTIONS.filter(b => b.group === 'FUNCIONALIDADE').map(b => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="── RANK ──">
                                    {BADGE_OPTIONS.filter(b => b.group === 'RANK').map(b => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </FormField>
                    </div>

                    <FormField label="EXPIRA EM">
                        <input type="datetime-local" className={selectCls} value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
                    </FormField>

                    <FormField label="METODO DE VALIDACAO">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => set('validationType', 'SECRET_CODE')}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                                    form.validationType === 'SECRET_CODE' ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-slate-700 bg-black/30 hover:border-slate-600'
                                )}
                            >
                                <Key size={16} className={form.validationType === 'SECRET_CODE' ? 'text-yellow-400' : 'text-slate-600'} />
                                <span className={cn('font-press text-[7px] text-center leading-tight', form.validationType === 'SECRET_CODE' ? 'text-yellow-400' : 'text-slate-600')}>CODIGO SECRETO</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => set('validationType', 'MANUAL_ADMIN')}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                                    form.validationType === 'MANUAL_ADMIN' ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 bg-black/30 hover:border-slate-600'
                                )}
                            >
                                <Shield size={16} className={form.validationType === 'MANUAL_ADMIN' ? 'text-blue-400' : 'text-slate-600'} />
                                <span className={cn('font-press text-[7px] text-center leading-tight', form.validationType === 'MANUAL_ADMIN' ? 'text-blue-400' : 'text-slate-600')}>MANUAL ADMIN</span>
                            </button>
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

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package size={14} className="text-purple-400" />
                                <span className="font-press text-[9px] text-purple-400">RECOMPENSA DE ITENS</span>
                            </div>
                            <button type="button" onClick={addItem} className="p-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {form.rewardItems.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 relative group">
                                    <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 transition-colors">
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 p-5 border-t border-white/5 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-press text-[9px]">CANCELAR</button>
                    <button type="button" onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-press text-[9px] disabled:opacity-40">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : 'CRIAR MISSAO'}
                    </button>
                </div>
            </motion.div>
        </>
    );
};
