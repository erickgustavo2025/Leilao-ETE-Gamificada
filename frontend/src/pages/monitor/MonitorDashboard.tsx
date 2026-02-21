import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MinusCircle, LogOut, Search, Loader2, AlertCircle, CheckSquare, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PixelCard } from '../../components/ui/PixelCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';

// ─────────────────────────────────────────────────────────────────
// 🔒 Espelha o BUFF_PC_CAP do backend (userController.js)
//    Se mudar no backend, mude aqui também.
// ─────────────────────────────────────────────────────────────────
const BUFF_PC_CAP = 500;

interface ActiveBuff {
    effect: string;
    expiresAt?: string;
}

interface Student {
    _id: string;
    nome: string;
    matricula: string;
    saldoPc: number;
    isBlocked: boolean;
    activeBuffs?: ActiveBuff[];
}

// ─── Helpers de buff ─────────────────────────────────────────────

/** Retorna apenas os buffs que ainda não expiraram */
const getValidBuffs = (student: Student): ActiveBuff[] => {
    const now = new Date();
    return (student.activeBuffs || []).filter(b =>
        !b.expiresAt || new Date(b.expiresAt) > now
    );
};

const hasBuff = (student: Student, effect: string): boolean =>
    getValidBuffs(student).some(b => b.effect === effect);

/** Retorna o multiplicador efetivo do aluno (sem Merlin, que é info do backend) */
const getMultiplier = (student: Student): number => {
    const buffs = getValidBuffs(student);
    if (buffs.some(b => b.effect === 'TRIPLICADOR')) return 3;
    if (buffs.some(b => b.effect === 'DUPLICADOR'))  return 2;
    return 1;
};

/** Badge de buff para exibição no card */
const buffBadge = (student: Student): { emoji: string; color: string } | null => {
    if (hasBuff(student, 'TRIPLICADOR')) return { emoji: '✖️3️⃣', color: 'text-red-400' };
    if (hasBuff(student, 'DUPLICADOR'))  return { emoji: '✖️2️⃣', color: 'text-yellow-400' };
    return null;
};

/**
 * Preview do valor que o aluno vai receber após buff + cap.
 * Retorna null quando não há buff (não precisa de preview).
 */
const calcPreview = (base: number, student: Student): { display: string; capped: boolean } | null => {
    const mult = getMultiplier(student);
    if (mult === 1) return null;
    const raw    = Math.floor(base * mult);
    const final  = Math.min(raw, BUFF_PC_CAP);
    const capped = raw > BUFF_PC_CAP;
    return {
        display: `${mult}x = ${capped ? `${BUFF_PC_CAP} PC$ (cap)` : `${final} PC$`}`,
        capped,
    };
};

export function MonitorDashboard() {
    const { user } = useAuth();
    const { playSuccess, playError } = useGameSound();
    const queryClient = useQueryClient();

    const [searchTerm,   setSearchTerm]   = useState('');
    const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
    const [pointsAction, setPointsAction] = useState<'add' | 'remove' | null>(null);
    const [amount,       setAmount]       = useState('');
    const [reason,       setReason]       = useState('');

    // ==================== QUERY ====================
    const { data: students = [], isLoading, isError } = useQuery({
        queryKey: ['monitorClass'],
        queryFn: async () => {
            const res = await api.get('/users/monitor/class');
            return res.data.students as Student[];
        },
        staleTime: 2 * 60 * 1000,
    });

    // ==================== DERIVAÇÕES ====================
    const filteredStudents = students.filter(s =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.matricula.includes(searchTerm)
    );

    const parsedAmount = parseInt(amount) || 0;

    // Quantos alunos selecionados têm buff (para o aviso no modal)
    const selectedWithBuff = Array.from(selectedIds).filter(id => {
        const s = students.find(st => st._id === id);
        return s && getMultiplier(s) > 1;
    });
    const willCapSomeone = pointsAction === 'add' &&
        selectedWithBuff.some(id => {
            const s = students.find(st => st._id === id)!;
            return Math.floor(parsedAmount * getMultiplier(s)) > BUFF_PC_CAP;
        });

    // ==================== SELEÇÃO ====================
    const toggleStudent = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        const visibleIds = filteredStudents.filter(s => !s.isBlocked).map(s => s._id);
        const allSelected = selectedIds.size === visibleIds.length && visibleIds.length > 0;
        setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
    };

    const handleQuickAction = (studentId: string, action: 'add' | 'remove') => {
        setSelectedIds(new Set([studentId]));
        setPointsAction(action);
    };

    // ==================== MUTATION ====================
    const pointsMutation = useMutation({
        mutationFn: async ({ studentIds, action, amount, reason }: {
            studentIds: string[];
            action: 'add' | 'remove';
            amount: number;
            reason: string;
        }) => {
            return await api.put('/users/points/bulk', {
                studentIds,
                amount,
                amountType: 'PC',
                action,
                description: `[MONITOR ${user?.nome}] ${reason}`
            });
        },
        onSuccess: (_, variables) => {
            playSuccess();
            toast.success(
                variables.action === 'add' ? "PONTOS ENVIADOS!" : "MULTA APLICADA!",
                {
                    description: `${variables.amount} PC$ (base) para ${variables.studentIds.length} aluno(s)`,
                    style: { borderColor: variables.action === 'add' ? '#22c55e' : '#ef4444' }
                }
            );
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['monitorClass'] });
            queryClient.invalidateQueries({ queryKey: ['monitorLogs'] });
        },
        onError: (error: any) => {
            playError();
            toast.error(error.response?.data?.error || 'Erro ao enviar pontos.');
        }
    });

    // ==================== HANDLERS ====================
    async function handlePointsSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selectedIds.size === 0 || !pointsAction) return;

        await pointsMutation.mutateAsync({
            studentIds: Array.from(selectedIds),
            action: pointsAction,
            amount: parsedAmount,
            reason
        });
    }

    function closeModal() {
        setPointsAction(null);
        setAmount('');
        setReason('');
        setSelectedIds(new Set());
    }

    return (
        <PageTransition>
            {/* BUSCA E AÇÕES EM MASSA */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar aluno por nome ou matrícula..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-yellow-500 outline-none transition-all shadow-inner"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-press text-white flex items-center gap-2 transition-colors"
                    >
                        <CheckSquare size={16} className={selectedIds.size > 0 ? "text-yellow-500" : "text-slate-400"} />
                        TODOS
                    </button>
                    <button
                        onClick={() => setPointsAction('add')}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-3 bg-green-900/20 hover:bg-green-600 border border-green-700 rounded-lg text-xs font-press text-green-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <PlusCircle size={16} /> ADD LOTE
                    </button>
                    <button
                        onClick={() => setPointsAction('remove')}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-3 bg-red-900/20 hover:bg-red-600 border border-red-700 rounded-lg text-xs font-press text-red-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <MinusCircle size={16} /> MULTA LOTE
                    </button>
                </div>
            </div>

            {/* AVISO DE SELEÇÃO */}
            {selectedIds.size > 0 && !pointsAction && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
                    <Users size={18} className="text-yellow-500" />
                    <span className="font-mono text-sm text-yellow-400">
                        {selectedIds.size} aluno(s) selecionado(s).
                        {selectedWithBuff.length > 0 && (
                            <span className="text-orange-400 ml-2">
                                ⚡ {selectedWithBuff.length} com buff ativo (cap: {BUFF_PC_CAP} PC$)
                            </span>
                        )}
                    </span>
                </div>
            )}

            {/* LISTA DE ALUNOS */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                    <p className="text-yellow-600 font-press text-xs animate-pulse">CARREGANDO DADOS...</p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-red-800 rounded-xl bg-red-900/10">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <p className="text-red-400 font-press text-sm mb-2">ERRO AO CARREGAR</p>
                    <p className="text-slate-500 font-mono text-xs">Não foi possível buscar a turma.</p>
                </div>
            ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredStudents.map(student => {
                        const isSelected = selectedIds.has(student._id);
                        const badge      = buffBadge(student);
                        // Preview só aparece quando o modal está aberto em modo 'add' E o aluno está selecionado
                        const preview    = (pointsAction === 'add' && isSelected && parsedAmount > 0)
                            ? calcPreview(parsedAmount, student)
                            : null;

                        return (
                            <PixelCard
                                key={student._id}
                                onClick={() => !student.isBlocked && toggleStudent(student._id)}
                                className={cn(
                                    "flex flex-col justify-between p-4 border-l-4 transition-all group cursor-pointer",
                                    isSelected
                                        ? "border-l-yellow-500 bg-slate-800/80"
                                        : "border-l-slate-700 hover:border-l-slate-500 bg-slate-900/50"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="overflow-hidden flex gap-3 items-center">
                                        {/* Checkbox visual */}
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                            isSelected ? "border-yellow-500 bg-yellow-500" : "border-slate-600 bg-slate-800"
                                        )}>
                                            {isSelected && <CheckSquare size={14} className="text-black" />}
                                        </div>
                                        <div>
                                            <h3 className={cn(
                                                "font-vt323 text-2xl leading-none mb-1 uppercase truncate flex items-center gap-2",
                                                student.isBlocked ? "text-red-400 line-through" : "text-white"
                                            )}>
                                                {student.nome}
                                                {/* 🆕 Badge de buff */}
                                                {badge && (
                                                    <span className={cn("text-base leading-none", badge.color)} title="Buff ativo">
                                                        {badge.emoji}
                                                    </span>
                                                )}
                                            </h3>
                                            <span className="text-[10px] text-slate-500 font-mono bg-black px-2 py-0.5 rounded inline-block">
                                                {student.matricula}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right ml-2">
                                        <span className={cn(
                                            "font-press text-sm whitespace-nowrap block",
                                            student.saldoPc < 0 ? "text-red-400" : "text-green-400"
                                        )}>
                                            {student.saldoPc} $
                                        </span>
                                        {/* 🆕 Preview de valor a receber com cap */}
                                        {preview && (
                                            <span className={cn(
                                                "font-mono text-[9px] block mt-0.5",
                                                preview.capped ? "text-orange-400" : "text-green-400"
                                            )}>
                                                {preview.display}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!student.isBlocked ? (
                                    <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleQuickAction(student._id, 'add'); }}
                                            className="flex-1 py-3 bg-green-900/10 text-green-500 border border-green-900/30 hover:bg-green-600 hover:text-black hover:border-green-400 rounded flex items-center justify-center gap-2 transition-all font-bold text-xs"
                                        >
                                            <PlusCircle size={16} /> ADD
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleQuickAction(student._id, 'remove'); }}
                                            className="flex-1 py-3 bg-red-900/10 text-red-500 border border-red-900/30 hover:bg-red-600 hover:text-black hover:border-red-400 rounded flex items-center justify-center gap-2 transition-all font-bold text-xs"
                                        >
                                            <MinusCircle size={16} /> MULTA
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-2 text-center text-[10px] text-red-500 font-press border-t border-red-900/30 flex items-center justify-center gap-2">
                                        <LogOut size={12} /> BLOQUEADO
                                    </div>
                                )}
                            </PixelCard>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500 font-vt323 text-xl">
                    Nenhum aluno encontrado.
                </div>
            )}

            {/* MODAL DE CONFIRMAÇÃO */}
            {pointsAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <PixelCard className={cn(
                        "w-full max-w-md p-6 border-l-8 shadow-2xl",
                        pointsAction === 'add' ? "border-l-green-500" : "border-l-red-500"
                    )}>
                        <h2 className="font-vt323 text-3xl text-white mb-1">
                            {pointsAction === 'add' ? 'DAR PONTOS' : 'APLICAR MULTA'}
                        </h2>
                        <p className="text-slate-400 text-sm mb-4">
                            Para <span className="text-white font-bold">{selectedIds.size} aluno(s)</span>.
                        </p>

                        {/* 🆕 Aviso de cap quando algum aluno selecionado tem buff */}
                        {pointsAction === 'add' && selectedWithBuff.length > 0 && (
                            <div className={cn(
                                "mb-4 p-3 rounded-lg border text-xs font-mono",
                                willCapSomeone
                                    ? "bg-orange-900/20 border-orange-600/50 text-orange-300"
                                    : "bg-yellow-900/10 border-yellow-700/30 text-yellow-400"
                            )}>
                                <Zap size={12} className="inline mr-1" />
                                {selectedWithBuff.length} aluno(s) com buff ativo.
                                {willCapSomeone
                                    ? ` Cap de ${BUFF_PC_CAP} PC$ será aplicado.`
                                    : ` Bônus será aplicado (sem cap ainda).`
                                }
                            </div>
                        )}

                        <form onSubmit={handlePointsSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-press text-slate-500 mb-1">
                                    QUANTIDADE BASE (PC$ POR ALUNO)
                                    {pointsAction === 'add' && (
                                        <span className="text-slate-600 ml-2 font-mono">· cap buff: {BUFF_PC_CAP}</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-black border-2 border-slate-700 p-3 text-white font-vt323 text-2xl focus:border-white outline-none"
                                    placeholder="0"
                                    autoFocus
                                    required
                                    min="1"
                                />
                            </div>

                            {/* 🆕 Tabela de preview por aluno selecionado (quando há buff) */}
                            {pointsAction === 'add' && parsedAmount > 0 && selectedWithBuff.length > 0 && (
                                <div className="bg-black/50 border border-slate-800 rounded p-2 max-h-32 overflow-y-auto space-y-1">
                                    <p className="text-[9px] font-press text-slate-600 mb-1">PREVIEW COM BUFF:</p>
                                    {Array.from(selectedIds).map(id => {
                                        const s = students.find(st => st._id === id);
                                        if (!s) return null;
                                        const p = calcPreview(parsedAmount, s);
                                        if (!p) return (
                                            <div key={id} className="flex justify-between text-[10px] font-mono text-slate-500">
                                                <span className="truncate">{s.nome}</span>
                                                <span>{parsedAmount} PC$</span>
                                            </div>
                                        );
                                        return (
                                            <div key={id} className="flex justify-between text-[10px] font-mono">
                                                <span className={cn("truncate", p.capped ? "text-orange-300" : "text-green-400")}>
                                                    {s.nome}
                                                </span>
                                                <span className={p.capped ? "text-orange-400" : "text-green-400"}>
                                                    {p.display}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-press text-slate-500 mb-1">MOTIVO</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full bg-black border-2 border-slate-700 p-3 text-white font-mono text-sm focus:border-white outline-none"
                                    placeholder="Ex: Comportamento, Participação..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 border-2 border-slate-700 text-slate-400 font-press text-xs hover:bg-slate-800 transition-colors"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={pointsMutation.isPending}
                                    className={cn(
                                        "flex-1 py-3 font-press text-xs text-black transition-transform active:scale-95",
                                        pointsAction === 'add' ? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-400"
                                    )}
                                >
                                    {pointsMutation.isPending ? '...' : 'CONFIRMAR'}
                                </button>
                            </div>
                        </form>
                    </PixelCard>
                </div>
            )}
        </PageTransition>
    );
}
