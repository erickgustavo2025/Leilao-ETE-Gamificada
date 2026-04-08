import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ShoppingCart, AlertCircle,  } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { PageTransition } from '../../components/layout/PageTransition';
import { useGameSound } from '../../hooks/useGameSound';
import { useAuth } from '../../contexts/AuthContext';

interface Disciplina {
    _id: string;
    nome: string;
    professor: string;
    ano: string;
    curso: string;
    precoN1: number;
    precoN2: number;
    ativa: boolean;
    comprasN1: number; // Info vinda do backend
    comprasN2: number; // Info vinda do backend
}

export function LojaNotas() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { playSuccess, playError, playClick } = useGameSound();
    const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);

    const { data: disciplinas = [], isLoading } = useQuery({
        queryKey: ['notas', 'disciplinas'],
        queryFn: async () => {
            const res = await api.get('/notas/me');
            return res.data;
        }
    });

    const comprarMutation = useMutation({
        mutationFn: async (data: { disciplinaId: string; tipo: 'n1' | 'n2' }) => {
            const res = await api.post('/notas/comprar', data);
            return res.data;
        },
        onSuccess: (data) => {
            playSuccess();
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['notas', 'disciplinas'] });
            queryClient.invalidateQueries({ queryKey: ['auth-user'] });
            setSelectedDisciplina(null);
        },
        onError: (err: any) => {
            playError();
            toast.error(err.response?.data?.error || 'Erro ao comprar ponto.');
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-press text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        LOJA DE NOTAS
                    </h1>
                    <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
                        Compre pontos para suas disciplinas usando PC$
                    </p>
                </div>

                {/* Saldo */}
                <PixelCard className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-press text-slate-400 uppercase">Seu Saldo</p>
                            <p className="text-3xl font-mono font-bold text-blue-400">{user?.saldoPc.toLocaleString()} PC$</p>
                        </div>
                        <ShoppingCart className="text-blue-400 opacity-50" size={40} />
                    </div>
                </PixelCard>

                {/* Disciplinas Grid */}
                <div className="space-y-4">
                    <h2 className="font-press text-sm text-slate-400 uppercase ml-2">Disciplinas Disponíveis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {disciplinas.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <AlertCircle className="mx-auto mb-4 text-slate-500" />
                                <p className="text-slate-400 font-mono">Nenhuma disciplina disponível para seu curso/ano.</p>
                            </div>
                        ) : (
                            disciplinas.map((d: Disciplina) => (
                                <PixelCard
                                    key={d._id}
                                    className={`p-6 space-y-4 cursor-pointer transition-all ${
                                        selectedDisciplina === d._id
                                            ? 'border-blue-400 bg-blue-500/10'
                                            : 'border-slate-700 hover:border-slate-600'
                                    }`}
                                    onClick={() => setSelectedDisciplina(selectedDisciplina === d._id ? null : d._id)}
                                >
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-press text-white text-sm">{d.nome}</h3>
                                            <BookOpen size={16} className="text-slate-600" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase">
                                            Prof: {d.professor}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono">
                                            {d.ano}º ano • {d.curso}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                        <div className={`p-1.5 rounded bg-slate-800/50 border ${d.comprasN1 >= 2 ? 'border-amber-500/50 text-amber-400' : 'border-slate-700 text-slate-400'}`}>
                                            N1: {d.comprasN1}/2
                                        </div>
                                        <div className={`p-1.5 rounded bg-slate-800/50 border ${d.comprasN2 >= 2 ? 'border-amber-500/50 text-amber-400' : 'border-slate-700 text-slate-400'}`}>
                                            N2: {d.comprasN2}/2
                                        </div>
                                    </div>

                                    {selectedDisciplina === d._id && (
                                        <div className="space-y-3 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <PixelButton
                                                        variant="primary"
                                                        className="text-[10px] py-2 w-full"
                                                        disabled={comprarMutation.isPending || (user?.saldoPc || 0) < d.precoN1 || d.comprasN1 >= 2}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            playClick();
                                                            comprarMutation.mutate({ disciplinaId: d._id, tipo: 'n1' });
                                                        }}
                                                    >
                                                        {d.precoN1} PC$
                                                    </PixelButton>
                                                    <p className="text-[8px] text-center text-slate-500 uppercase font-press">Comprar N1</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <PixelButton
                                                        variant="primary"
                                                        className="text-[10px] py-2 w-full"
                                                        disabled={comprarMutation.isPending || (user?.saldoPc || 0) < d.precoN2 || d.comprasN2 >= 2}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            playClick();
                                                            comprarMutation.mutate({ disciplinaId: d._id, tipo: 'n2' });
                                                        }}
                                                    >
                                                        {d.precoN2} PC$
                                                    </PixelButton>
                                                    <p className="text-[8px] text-center text-slate-500 uppercase font-press">Comprar N2</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </PixelCard>
                            ))
                        )}
                    </div>
                </div>

                {/* Info */}
                <PixelCard className="p-6 bg-slate-900/50 border-amber-500/30 space-y-4">
                    <h3 className="font-press text-xs text-amber-400 flex items-center gap-2">
                        <AlertCircle size={14} /> REGRAS DA LOJA
                    </h3>
                    <div className="space-y-2 text-[10px] text-slate-400 font-mono leading-relaxed">
                        <p>• Selecione uma disciplina e escolha entre N1 (Atividades) ou N2 (Prova).</p>
                        <p>• Limite de compra: <strong>Máximo de 2 pontos</strong> de cada tipo por matéria.</p>
                        <p>• Requisito: Badge <strong>PODE_COMPRAR_NOTAS</strong> ativa em seu perfil.</p>
                        <p>• Os pontos são adicionados instantaneamente ao seu histórico acadêmico.</p>
                    </div>
                </PixelCard>
            </div>
        </PageTransition>
    );
}
