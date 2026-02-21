import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { Gavel, AlertTriangle, MinusCircle, Users, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AdminPunishments() {
    const [type, setType] = useState('PUNIÇÃO');
    const [targetScope, setTargetScope] = useState<'TURMA' | 'TODAS'>('TURMA');
    const [houseSerie, setHouseSerie] = useState('');
    const [reason, setReason] = useState('');
    const [points, setPoints] = useState(0);

    // ✅ GET Classes
    const { data: classes = [] } = useQuery<string[]>({
        queryKey: ['admin', 'classes-list'],
        queryFn: async () => {
            const res = await api.get('/admin/classes');
            return res.data.map((c: any) => c.serie || c.name || c.turma);
        }
    });

    // ✅ Mutation para aplicar punição
    const punishMutation = useMutation({
        mutationFn: async (payload: { type: string; houseSerie: string; reason: string; points: number }) => {
            await api.post('/house/punish', payload);
        },
        onSuccess: () => {
            toast.success('Decreto publicado com sucesso no Grande Salão!');
            setReason('');
            setPoints(0);
        },
        onError: () => {
            toast.error('Erro ao publicar decreto.');
        }
    });

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Se for uma turma específica, precisa selecionar. Se for todas, ignora.
        if (targetScope === 'TURMA' && !houseSerie) {
            return toast.warning('Selecione uma turma alvo!');
        }
        if (!reason) {
            return toast.warning('Descreva o motivo/decreto!');
        }

        const finalHouseSerie = targetScope === 'TODAS' ? 'TODAS' : houseSerie;

        punishMutation.mutate({ 
            type, 
            houseSerie: finalHouseSerie, 
            reason, 
            points: type === 'PUNIÇÃO' ? points : 0 // Garante que avisos não tirem pontos sem querer
        });
    };

    return (
        <AdminLayout>
            <PageTransition>
                <div className="space-y-6 max-w-2xl mx-auto pb-20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-900/30 rounded-lg border border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                            <Gavel className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h1 className="font-vt323 text-4xl text-white tracking-wider uppercase">Tribunal da ETE</h1>
                            <p className="font-mono text-[10px] text-slate-400 uppercase">Aplique punições, decretos e avisos às casas</p>
                        </div>
                    </div>

                    <PixelCard className="p-6 border-red-900/50 bg-slate-900/80">
                        <form onSubmit={handleApply} className="space-y-6">
                            
                            {/* TIPO DE AÇÃO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-slate-500 uppercase block">NATUREZA DO ATO</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PUNIÇÃO', 'DECRETO', 'AVISO'].map(t => (
                                        <button
                                            type="button"
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={cn(
                                                "p-3 rounded border-2 font-press text-[10px] transition-all",
                                                type === t 
                                                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ESCOPO (TURMA vs ESCOLA INTEIRA) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-slate-500 uppercase block">ALVO DO DECRETO</label>
                                <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTargetScope('TURMA')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-press transition-colors",
                                            targetScope === 'TURMA' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-400"
                                        )}
                                    >
                                        <Users size={14}/> UMA TURMA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetScope('TODAS')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-press transition-colors",
                                            targetScope === 'TODAS' ? "bg-red-900/50 text-red-400" : "text-slate-500 hover:text-slate-400"
                                        )}
                                    >
                                        <Globe size={14}/> ESCOLA INTEIRA
                                    </button>
                                </div>
                            </div>

                            {/* SELETOR DE SALA ALVO (Oculto se for Escola Inteira) */}
                            {targetScope === 'TURMA' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-mono text-slate-500 mb-1 block uppercase">SELECIONE A TURMA</label>
                                    <select 
                                        value={houseSerie}
                                        onChange={e => setHouseSerie(e.target.value)}
                                        className="w-full bg-slate-950 border-2 border-slate-700 rounded p-3 text-white font-vt323 text-xl focus:border-red-500 outline-none transition-colors"
                                    >
                                        <option value="">-- Clique para selecionar --</option>
                                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* MOTIVO */}
                            <div>
                                <label className="text-[10px] font-mono text-slate-500 mb-1 block uppercase">
                                    MENSAGEM DO DECRETO / MOTIVO
                                </label>
                                <textarea 
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder={type === 'PUNIÇÃO' ? "Ex: Uso indevido de magia nos corredores..." : "Escreva o comunicado aqui..."}
                                    className="w-full bg-slate-950 border-2 border-slate-700 rounded p-3 text-slate-300 font-mono text-sm h-28 resize-none focus:border-red-500 outline-none transition-colors"
                                />
                            </div>

                            {/* PONTOS (Só aparece se for Punição) */}
                            {type === 'PUNIÇÃO' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <label className="text-[10px] font-mono text-red-400 mb-1 flex items-center gap-1 uppercase">
                                        <MinusCircle size={14} /> PONTOS A REMOVER
                                    </label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={points || ''}
                                        placeholder="Ex: 50"
                                        onChange={e => setPoints(Number(e.target.value))}
                                        className="w-full bg-red-900/10 border-2 border-red-800/50 rounded p-3 text-red-400 font-vt323 text-3xl focus:border-red-500 outline-none transition-colors"
                                    />
                                    {targetScope === 'TODAS' && points > 0 && (
                                        <p className="text-[10px] text-red-500 font-mono mt-2 animate-pulse">
                                            ⚠️ ALERTA: Você está prestes a remover {points} pontos de TODAS AS CASAS simultaneamente!
                                        </p>
                                    )}
                                </div>
                            )}

                            <PixelButton 
                                type="submit" 
                                isLoading={punishMutation.isPending}
                                className={cn(
                                    "w-full py-4 text-white shadow-lg",
                                    type === 'PUNIÇÃO' ? "bg-red-600 hover:bg-red-500 shadow-red-600/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                                )}
                            >
                                <AlertTriangle size={18} className="mr-2" />
                                {targetScope === 'TODAS' ? `PUBLICAR PARA A ESCOLA INTEIRA` : `PUBLICAR NO QUADRO DA TURMA`}
                            </PixelButton>

                        </form>
                    </PixelCard>
                </div>
            </PageTransition>
        </AdminLayout>
    );
}