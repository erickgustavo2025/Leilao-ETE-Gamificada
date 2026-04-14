import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, X, Search, Copy, Check, Eye, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../utils/cn';
import { Quest, QuestKey } from '../AdminQuests';

interface KeysModalProps {
    quest: Quest;
    onClose: () => void;
}

function KeyRow({ k, copied, copyCode }: { k: QuestKey; copied: string | null; copyCode: (code: string) => void }) {
    if (!k) return null;

    return (
        <div className="px-1 py-1">
            <div
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
        </div>
    );
}

export function KeysModal({ quest, onClose }: KeysModalProps) {
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

                <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <Key size={32} className="text-slate-800 mx-auto mb-2 opacity-20" />
                            <p className="font-vt323 text-xl text-slate-600">Nenhum código encontrado.</p>
                        </div>
                    ) : (
                        filtered.map((k, idx) => (
                            <KeyRow key={idx} k={k} copied={copied} copyCode={copyCode} />
                        ))
                    )}
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
