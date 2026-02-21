import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { 
    Trophy, Store, Eye, EyeOff, Gavel, 
    TrendingUp, TrendingDown, X, Shield 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { queryKeys } from '../../utils/queryKeys';
import { getImageUrl } from '../../utils/imageHelper';

interface House {
    _id: string;
    serie: string;
    pontuacaoAtual: number;
    cor?: string;
    logo?: string;
}

export function AdminHouse() {
    const queryClient = useQueryClient();

    // Controle de Interface
    const [activeYear, setActiveYear] = useState('1'); 
    const [selectedHouse, setSelectedHouse] = useState<House | null>(null); 

    // Formulário do Modal
    const [points, setPoints] = useState<number>(0);
    const [reason, setReason] = useState<string>('');

    // ✅ GET CONFIGURAÇÕES
    const { data: config = { houseCupVisible: true, becoDiagonalOpen: true } } = useQuery({
        queryKey: queryKeys.admin.config,
        queryFn: async () => {
            const res = await api.get('/admin/config');
            return {
                houseCupVisible: res.data.houseCupVisible ?? true,
                becoDiagonalOpen: res.data.becoDiagonalOpen ?? true
            };
        }
    });

    // ✅ GET LEADERBOARD
    const { data: houses = [], isLoading: loadingHouses } = useQuery<House[]>({
        queryKey: queryKeys.admin.house.leaderboard,
        queryFn: async () => {
            const res = await api.get('/house/leaderboard');
            return res.data;
        }
    });

    // ✅ TOGGLE CONFIG Mutation
    const toggleConfigMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
            const formData = new FormData();
            formData.append(key, String(value));
            await api.put('/admin/config', formData);
        },
        onMutate: async ({ key, value }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.admin.config });
            const previous = queryClient.getQueryData(queryKeys.admin.config);

            queryClient.setQueryData(queryKeys.admin.config, (old: any) => ({
                ...old,
                [key]: value
            }));

            return { previous };
        },
        onError: (_err: any, _vars: any, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.admin.config, context.previous);
            }
            toast.error("Erro ao salvar configuração.");
        },
        onSuccess: () => {
            toast.success("Configuração salva!");
        }
    });

    // ✅ MANAGE POINTS Mutation
    const managePointsMutation = useMutation({
        mutationFn: async (payload: { turma: string; valor: number; motivo: string; tipo: string }) => {
            await api.post('/house/points', payload);
        },
        onSuccess: (_data: any, vars: any) => {
            toast.success(vars.valor > 0 ? "Pontos adicionados!" : "Punição aplicada!");
            setSelectedHouse(null);
            setPoints(0);
            setReason('');
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.house.leaderboard }); 
        },
        onError: (_err: any) => {
            toast.error("Erro ao atualizar pontos.");
        }
    });

    // 🏆 ENVIAR PONTOS
    const handleManagePoints = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHouse || points === 0 || !reason.trim()) {
            return toast.warning("Preencha pontos e motivo.");
        }

        managePointsMutation.mutate({
            turma: selectedHouse.serie,
            valor: points,
            motivo: reason,
            tipo: points > 0 ? 'BONUS' : 'PUNICAO'
        });
    };

    const filteredHouses = houses.filter(h => h.serie.trim().startsWith(activeYear));

    // 🔥 FILTRO INTELIGENTE PARA CORES ESCURAS (Modal)
    let rawModalColor = selectedHouse?.cor || '#eab308';
    const isModalBlack = rawModalColor.toLowerCase() === '#000000' || rawModalColor.toLowerCase() === 'black';
    const modalColor = isModalBlack ? '#94a3b8' : rawModalColor; // Transforma preto em Prata/Chumbo no modo escuro

    return (
        <AdminLayout>
            <PageTransition>
                <div className="space-y-8 pb-20 max-w-6xl mx-auto">
                    
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="font-vt323 text-4xl text-white flex items-center gap-2 uppercase tracking-widest">
                                <Trophy className="text-yellow-500" /> CONTROLE DA TAÇA
                            </h1>
                            <p className="font-mono text-xs text-slate-400">Gestão Suprema das Casas e Pontuações.</p>
                        </div>
                    </div>

                    {/* 1. PAINEL DE CONTROLE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PixelCard className={cn("p-6 flex items-center justify-between border-l-4 transition-all", 
                            config.houseCupVisible ? "border-l-green-500 bg-slate-900" : "border-l-red-500 bg-slate-900/50 grayscale")}>
                            <div>
                                <h3 className="font-press text-sm text-white mb-1 flex items-center gap-2">
                                    {config.houseCupVisible ? <Eye size={18}/> : <EyeOff size={18}/>} 
                                    RANKING: {config.houseCupVisible ? 'VISÍVEL' : 'OCULTO'}
                                </h3>
                                <p className="text-[10px] font-mono text-slate-400">
                                    {config.houseCupVisible ? "Todos podem ver quem está ganhando." : "Modo Suspense ativado."}
                                </p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={config.houseCupVisible} 
                                onChange={() => toggleConfigMutation.mutate({ key: 'houseCupVisible', value: !config.houseCupVisible })} 
                                className="accent-green-500 scale-150 cursor-pointer" 
                            />
                        </PixelCard>

                        <PixelCard className={cn("p-6 flex items-center justify-between border-l-4 transition-all", 
                            config.becoDiagonalOpen ? "border-l-blue-500 bg-slate-900" : "border-l-red-500 bg-slate-900/50 grayscale")}>
                            <div>
                                <h3 className="font-press text-sm text-white mb-1 flex items-center gap-2">
                                    <Store size={18}/> BECO: {config.becoDiagonalOpen ? 'ABERTO' : 'FECHADO'}
                                </h3>
                                <p className="text-[10px] font-mono text-slate-400">
                                    {config.becoDiagonalOpen ? "Alunos podem comprar itens." : "Loja fechada para manutenção."}
                                </p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={config.becoDiagonalOpen} 
                                onChange={() => toggleConfigMutation.mutate({ key: 'becoDiagonalOpen', value: !config.becoDiagonalOpen })} 
                                className="accent-blue-500 scale-150 cursor-pointer" 
                            />
                        </PixelCard>
                    </div>

                    {/* 2. GESTÃO DE TURMAS */}
                    <div className="mt-8">
                        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-fit">
                            {['1', '2', '3'].map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setActiveYear(year)}
                                    className={cn(
                                        "px-6 py-2 font-press text-xs rounded transition-all",
                                        activeYear === year 
                                            ? "bg-yellow-500 text-black shadow-lg" 
                                            : "text-slate-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {year}º ANO
                                </button>
                            ))}
                        </div>

                        {loadingHouses ? (
                            <div className="text-center py-20 text-slate-500 font-press animate-pulse">CARREGANDO CASAS...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredHouses.map((house) => {
                                    const globalRank = houses.indexOf(house) + 1;
                                    
                                    // 🔥 FILTRO INTELIGENTE PARA CORES ESCURAS (Cards)
                                    let rawColor = house.cor || '#eab308'; 
                                    const isBlack = rawColor.toLowerCase() === '#000000' || rawColor.toLowerCase() === 'black';
                                    const houseColor = isBlack ? '#94a3b8' : rawColor; // Transforma o preto em Prata/Chumbo

                                    return (
                                        <motion.div 
                                            key={house._id} 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            onClick={() => setSelectedHouse(house)}
                                            className="h-full"
                                        >
                                            <PixelCard 
                                                className="p-0 overflow-hidden cursor-pointer transition-all border-l-4 h-full flex flex-col group relative bg-gradient-to-b from-slate-900/80 to-[#0a0a0f]"
                                                style={{ borderLeftColor: houseColor }}
                                            >
                                                {/* Efeito Brilho Fundo Dinâmico */}
                                                <div 
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" 
                                                    style={{ backgroundColor: houseColor }}
                                                />

                                                <div className="p-5 flex-1 flex flex-col relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        
                                                        {/* 🔥 BRASÃO DA CASA COLORIDO 🔥 */}
                                                        <div 
                                                            className="w-14 h-14 rounded-xl bg-black border-2 flex items-center justify-center p-1.5 relative overflow-hidden transition-colors"
                                                            style={{ borderColor: `${houseColor}80`, boxShadow: `0 0 10px ${houseColor}30` }}
                                                        >
                                                            {house.logo ? (
                                                                <img 
                                                                    src={getImageUrl(house.logo)} 
                                                                    alt={house.serie} 
                                                                    className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform" 
                                                                    onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'} 
                                                                />
                                                            ) : (
                                                                <Shield size={24} style={{ color: houseColor }} />
                                                            )}
                                                        </div>

                                                        {/* 🔥 BADGE NEON DINÂMICO 🔥 */}
                                                        <span 
                                                            className="font-press text-[10px] px-2 py-1.5 rounded border shadow-sm backdrop-blur-md"
                                                            style={{ 
                                                                backgroundColor: `${houseColor}20`, // Fundo 20% transparente
                                                                color: houseColor, // Texto na cor da casa
                                                                borderColor: `${houseColor}50` // Borda 50% transparente
                                                            }}
                                                        >
                                                            #{globalRank}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="mt-auto">
                                                        <h3 
                                                            className="font-vt323 text-3xl text-white mb-1 transition-colors"
                                                            style={{ textShadow: `0 0 15px ${houseColor}80` }}
                                                        >
                                                            {house.serie}
                                                        </h3>
                                                        <p className="font-mono text-[10px] text-slate-500 mb-2 uppercase tracking-widest">Saldo Atual</p>
                                                        <div 
                                                            className="font-vt323 text-4xl bg-black/60 border p-2 rounded-lg text-center"
                                                            style={{ 
                                                                color: houseColor, 
                                                                borderColor: `${houseColor}40`, 
                                                                boxShadow: `inset 0 0 20px ${houseColor}15` 
                                                            }}
                                                        >
                                                            {house.pontuacaoAtual}
                                                        </div>
                                                    </div>
                                                </div>
                                            </PixelCard>
                                        </motion.div>
                                    );
                                })}
                                {filteredHouses.length === 0 && (
                                    <div className="col-span-full py-10 text-center text-slate-500 font-mono">
                                        Nenhuma turma encontrada para o {activeYear}º ano.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. MODAL DE AÇÃO (PONTOS) */}
                    <AnimatePresence>
                        {selectedHouse && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedHouse(null)}>
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="w-full max-w-md"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Modal Dinâmico com a cor da casa */}
                                    <PixelCard 
                                        className="p-0 overflow-hidden border-2 bg-slate-900"
                                        style={{ 
                                            borderColor: modalColor, 
                                            boxShadow: `0 0 50px ${modalColor}30` 
                                        }}
                                    >
                                        {/* Modal Header */}
                                        <div 
                                            className="p-6 border-b flex justify-between items-center relative overflow-hidden"
                                            style={{ 
                                                background: `linear-gradient(to right, ${modalColor}30, #0f172a)`,
                                                borderBottomColor: `${modalColor}40`
                                            }}
                                        >
                                            {/* Marca d'agua */}
                                            {selectedHouse.logo && (
                                                <div className="absolute right-0 top-0 opacity-10 w-40 h-40 -translate-y-1/4 translate-x-1/4 pointer-events-none">
                                                    <img src={getImageUrl(selectedHouse.logo)} className="w-full h-full object-cover blur-sm" />
                                                </div>
                                            )}
                                            
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div 
                                                    className="w-12 h-12 rounded-full bg-black border-2 flex items-center justify-center p-1 shrink-0"
                                                    style={{ borderColor: modalColor, boxShadow: `0 0 10px ${modalColor}50` }}
                                                >
                                                    {selectedHouse.logo ? (
                                                        <img src={getImageUrl(selectedHouse.logo)} className="w-full h-full object-contain" onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'} />
                                                    ) : (
                                                        <Shield size={20} style={{ color: modalColor }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-press text-lg text-white">GERENCIAR <span style={{ color: modalColor }}>{selectedHouse.serie}</span></h3>
                                                    <p className="font-mono text-xs mt-1" style={{ color: `${modalColor}90` }}>Saldo: {selectedHouse.pontuacaoAtual} PC$</p>
                                                </div>
                                            </div>

                                            <button onClick={() => setSelectedHouse(null)} className="relative z-10 text-slate-400 hover:text-white bg-black/40 p-2 rounded-full transition-colors"><X size={16} /></button>
                                        </div>

                                        {/* Modal Body */}
                                        <form onSubmit={handleManagePoints} className="p-6 space-y-6">
                                            <div>
                                                <label className="text-[10px] font-press text-slate-400 block mb-2 uppercase">Alteração de Pontos</label>
                                                <div className="relative group">
                                                    <input 
                                                        type="number" 
                                                        autoFocus
                                                        value={points || ''} 
                                                        placeholder="Ex: 50 ou -20"
                                                        onChange={e => setPoints(Number(e.target.value))}
                                                        className={cn(
                                                            "w-full bg-black border-2 p-5 font-vt323 text-5xl rounded-xl outline-none text-center transition-colors shadow-inner", 
                                                            points > 0 ? "border-green-500 text-green-400" : points < 0 ? "border-red-500 text-red-400" : "border-slate-700 text-white"
                                                        )}
                                                        style={{ focusVisible: { borderColor: modalColor } } as any}
                                                    />
                                                    {points > 0 && <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={32} />}
                                                    {points < 0 && <TrendingDown className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={32} />}
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-3 text-center">
                                                    Use <span className="text-green-400 font-bold">positivos</span> para premiar e <span className="text-red-400 font-bold">negativos</span> para punir.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-press text-slate-400 block mb-2 uppercase">Motivo (Obrigatório)</label>
                                                <textarea 
                                                    value={reason}
                                                    onChange={e => setReason(e.target.value)}
                                                    placeholder="Ex: Tarefa concluída, indisciplina..."
                                                    className="w-full bg-black border-2 border-slate-700 p-4 text-white font-mono text-sm rounded-xl outline-none min-h-[100px] resize-none transition-colors"
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <PixelButton 
                                                    type="button"
                                                    onClick={() => setSelectedHouse(null)}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700"
                                                >
                                                    CANCELAR
                                                </PixelButton>
                                                <PixelButton 
                                                    type="submit" 
                                                    isLoading={managePointsMutation.isPending}
                                                    disabled={points === 0 || !reason.trim()}
                                                    className={cn(
                                                        "flex-[2] shadow-lg", 
                                                        points >= 0 ? "bg-green-600 hover:bg-green-500 shadow-green-600/20" : "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                                                    )}
                                                >
                                                    <Gavel size={18} className="mr-2" />
                                                    CONFIRMAR
                                                </PixelButton>
                                            </div>
                                        </form>
                                    </PixelCard>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                </div>
            </PageTransition>
        </AdminLayout>
    );
}