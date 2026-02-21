import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MinusCircle, LogOut, Search, Loader2, AlertCircle, CheckSquare, Users } from 'lucide-react';
import { toast } from 'sonner'; 
import { PixelCard } from '../../components/ui/PixelCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { useGameSound } from '../../hooks/useGameSound'; 
import { PageTransition } from '../../components/layout/PageTransition';

interface Student {
    _id: string;
    nome: string;
    matricula: string;
    saldoPc: number;
    isBlocked: boolean;
}

export function MonitorDashboard() {
    const { user } = useAuth();
    const { playSuccess, playError } = useGameSound(); 
    const queryClient = useQueryClient();

    // Estados de UI
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // 🔥 NOVO: Múltipla Seleção
    const [pointsAction, setPointsAction] = useState<'add' | 'remove' | null>(null);
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    // ==================== QUERIES ====================
    const { 
        data: students = [], 
        isLoading,
        isError 
    } = useQuery({
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

    // ==================== HANDLERS DE SELEÇÃO ====================
    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        // Se já selecionou todos os visíveis, limpa. Senão, seleciona todos.
        const visibleIds = filteredStudents.filter(s => !s.isBlocked).map(s => s._id);
        if (selectedIds.size === visibleIds.length && visibleIds.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(visibleIds));
        }
    };

    const handleQuickAction = (studentId: string, action: 'add' | 'remove') => {
        setSelectedIds(new Set([studentId]));
        setPointsAction(action);
    };

    // ==================== MUTATIONS ====================
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
                    description: `${variables.amount} PC$ para ${variables.studentIds.length} aluno(s)`,
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

    // ==================== HANDLERS DO FORM ====================
    async function handlePointsSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selectedIds.size === 0 || !pointsAction) return;

        await pointsMutation.mutateAsync({
            studentIds: Array.from(selectedIds),
            action: pointsAction,
            amount: Number(amount),
            reason
        });
    }

    function closeModal() {
        setPointsAction(null);
        setAmount('');
        setReason('');
        setSelectedIds(new Set()); // Limpa a seleção após a ação
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

                {/* PAINEL DE AÇÃO EM LOTE */}
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
                        {selectedIds.size} aluno(s) selecionado(s) para ação em massa.
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
                        
                        return (
                            <PixelCard 
                                key={student._id} 
                                onClick={() => !student.isBlocked && toggleStudent(student._id)}
                                className={cn(
                                    "flex flex-col justify-between p-4 border-l-4 transition-all group cursor-pointer",
                                    isSelected ? "border-l-yellow-500 bg-slate-800/80" : "border-l-slate-700 hover:border-l-slate-500 bg-slate-900/50"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="overflow-hidden flex gap-3 items-center">
                                        {/* Checkbox Visual */}
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                            isSelected ? "border-yellow-500 bg-yellow-500" : "border-slate-600 bg-slate-800"
                                        )}>
                                            {isSelected && <CheckSquare size={14} className="text-black" />}
                                        </div>

                                        <div>
                                            <h3 className={cn("font-vt323 text-2xl leading-none mb-1 uppercase truncate", student.isBlocked ? "text-red-400 line-through" : "text-white")}>
                                                {student.nome}
                                            </h3>
                                            <span className="text-[10px] text-slate-500 font-mono bg-black px-2 py-0.5 rounded inline-block">
                                                {student.matricula}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={cn("font-press text-sm whitespace-nowrap ml-2", student.saldoPc < 0 ? "text-red-400" : "text-green-400")}>
                                        {student.saldoPc} $
                                    </span>
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

            {/* MODAL DE CONFIRMAÇÃO LOTE/UNICO */}
            {pointsAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <PixelCard className={cn("w-full max-w-md p-6 border-l-8 shadow-2xl", pointsAction === 'add' ? "border-l-green-500" : "border-l-red-500")}>
                        <h2 className="font-vt323 text-3xl text-white mb-1">
                            {pointsAction === 'add' ? 'DAR PONTOS' : 'APLICAR MULTA'}
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Você está prestes a aplicar esta ação em <span className="text-white font-bold">{selectedIds.size} aluno(s)</span>.
                        </p>

                        <form onSubmit={handlePointsSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-press text-slate-500 mb-1">QUANTIDADE (PC$ POR ALUNO)</label>
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
                                <button type="button" onClick={closeModal} className="flex-1 py-3 border-2 border-slate-700 text-slate-400 font-press text-xs hover:bg-slate-800 transition-colors">
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