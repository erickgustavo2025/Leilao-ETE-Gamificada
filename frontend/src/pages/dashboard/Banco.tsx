import { useState, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, TrendingUp, AlertTriangle, CheckCircle, ArrowRightLeft, Lock, 
  CreditCard as IconCard, Crown, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { CreditCard } from '../../components/features/CreditCard'; 
import { PageTransition } from '../../components/layout/PageTransition';
import { useGameSound } from '../../hooks/useGameSound';
import { cn } from '../../utils/cn';

// ========================
// HOOK: Detectar Mobile
// ========================
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// ========================
// COMPONENTE: Partícula (Só Desktop)
// ========================
const FloatingParticle = memo(({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-yellow-400/30"
    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
    animate={{ y: [0, -30, 0], opacity: [0, 0.5, 0] }}
    transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
));
FloatingParticle.displayName = 'FloatingParticle';

// ========================
// TIPAGEM
// ========================
interface BankData {
  saldo: number;
  availableLimit: number;
  activeLoan: any;
  creditLimit: number;
  transactions: any[];
  vipStatus?: {
    hasVip: boolean;
    hasRankVip: boolean;
    rankUses: number;
    rankMax: number;
    hasInventoryVip: boolean;
    inventoryCount: number;
  };
}

export function Banco() {
    const { user, refreshUser } = useAuth();
    const { playSuccess, playError } = useGameSound();
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();

    const [loanAmount, setLoanAmount] = useState('');
    const [selectedSource, setSelectedSource] = useState<'RANK' | 'ITEM' | null>(null);

    // ========================
    // QUERY: Dados Bancários
    // ========================
    const { 
      data: bankData, 
      isLoading,
      isError 
    } = useQuery({
      queryKey: ['bank'],
      queryFn: async () => {
        const res = await api.get('/bank');
        // Garantir que transactions seja um array
        const safeData: BankData = {
          ...res.data,
          transactions: Array.isArray(res.data.transactions) ? res.data.transactions : []
        };
        return safeData;
      },
      staleTime: 30000, // 30s
      retry: 2
    });

    // ========================
    // MUTATION 1: Pegar Empréstimo
    // ========================
    const takeLoanMutation = useMutation({
      mutationFn: async ({ amount, vipSource }: { amount: number; vipSource: 'RANK' | 'ITEM' }) => {
        await api.post('/bank/loan', { amount, vipSource });
      },
      onSuccess: (_, variables) => {
        playSuccess();
        toast.success(`Empréstimo realizado usando ${variables.vipSource === 'RANK' ? 'Rank' : 'Mochila'}!`);
        setLoanAmount('');
        setSelectedSource(null);
        queryClient.invalidateQueries({ queryKey: ['bank'] });
        refreshUser();
      },
      onError: (error: any) => {
        playError();
        toast.error(error.response?.data?.error || "Erro ao pegar empréstimo.");
      }
    });

    // ========================
    // MUTATION 2: Pagar Empréstimo
    // ========================
    const payLoanMutation = useMutation({
      mutationFn: async () => {
        await api.post('/bank/pay');
      },
      onSuccess: () => {
        playSuccess();
        toast.success("Dívida quitada! Nome limpo.");
        queryClient.invalidateQueries({ queryKey: ['bank'] });
        refreshUser();
      },
      onError: (error: any) => {
        playError();
        toast.error(error.response?.data?.error || "Erro ao pagar.");
      }
    });

    // ========================
    // HANDLERS
    // ========================
    const handleTakeLoan = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!selectedSource) return toast.warning("Selecione a forma de pagamento (Rank ou Mochila).");
      
      const valor = parseInt(loanAmount);
      if (!valor || valor < 100) return toast.warning("Mínimo de 100 PC$.");
      if (bankData && valor > bankData.availableLimit) return toast.error("Valor acima do limite!");

      takeLoanMutation.mutate({ amount: valor, vipSource: selectedSource });
    };

    const handlePayLoan = () => {
      if (!confirm("Pagar a fatura total agora?")) return;
      payLoanMutation.mutate();
    };

    // ========================
    // ERROR HANDLING
    // ========================
    if (isError) {
      toast.error("Erro ao carregar dados do banco.");
    }

    if (isLoading || !bankData) {
        return (
            <div className="h-screen flex items-center justify-center text-white font-press">
                <Loader2 className="animate-spin mr-2"/> ACESSANDO COFRE...
            </div>
        );
    }

    const renderRightPanel = () => {
        // 1. Tem dívida? (Pagar)
        if (bankData.activeLoan) {
            return (
                <PixelCard className="border-red-500 bg-slate-900/80">
                    <h2 className="font-vt323 text-3xl text-red-500 mb-4 flex items-center gap-2">
                        <AlertTriangle size={24}/> FATURA ABERTA
                    </h2>
                    
                    <div className="bg-red-950/30 p-4 rounded border border-red-900 mb-4 text-center">
                        <p className="font-mono text-xs text-red-300">TOTAL A PAGAR</p>
                        <p className="font-vt323 text-5xl text-white">{bankData.activeLoan.valorDevido} PC$</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-2">Vencimento: {new Date(bankData.activeLoan.dataVencimento).toLocaleDateString()}</p>
                    </div>

                    <PixelButton 
                        onClick={handlePayLoan} 
                        isLoading={payLoanMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-vt323 text-xl"
                        disabled={(user?.saldoPc || 0) < bankData.activeLoan.valorDevido}
                    >
                        <CheckCircle size={20} className="mr-2"/> PAGAR FATURA
                    </PixelButton>
                     {(user?.saldoPc || 0) < bankData.activeLoan.valorDevido && (
                        <p className="text-center text-[10px] text-red-400 mt-2 font-mono">SALDO INSUFICIENTE</p>
                    )}
                </PixelCard>
            );
        }

        // 2. Não tem dívida, mas tem VIP? Libera Escolha
        if (bankData.vipStatus?.hasVip) {
            const { hasRankVip, rankUses, rankMax, hasInventoryVip, inventoryCount } = bankData.vipStatus;

            return (
                <PixelCard className="border-yellow-500 bg-slate-900/80">
                    <h2 className="font-vt323 text-3xl text-yellow-500 mb-4 flex items-center gap-2">
                        <TrendingUp size={24}/> EMPRÉSTIMO
                    </h2>
                    
                    <p className="font-mono text-[10px] text-slate-400 mb-2">SELECIONE A GARANTIA VIP:</p>

                    {/* SELEÇÃO DE FONTE (GRID DE 2 OPÇÕES) */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        
                        {/* OPÇÃO 1: RANK */}
                        <div 
                            onClick={() => (hasRankVip && rankUses > 0) && setSelectedSource('RANK')}
                            className={cn(
                                "border p-2 rounded cursor-pointer transition-all flex flex-col items-center text-center gap-1",
                                selectedSource === 'RANK' ? "bg-purple-900/40 border-purple-400 ring-1 ring-purple-400" : "bg-slate-950 border-slate-700 hover:border-purple-800",
                                (!hasRankVip || rankUses <= 0) && "opacity-40 cursor-not-allowed grayscale"
                            )}
                        >
                            <Crown size={20} className="text-purple-400" />
                            <span className="font-press text-[8px] text-purple-200">RANK SKILL</span>
                            <span className="font-mono text-xs text-slate-400">
                                {hasRankVip ? `${rankUses}/${rankMax}` : '---'}
                            </span>
                        </div>

                        {/* OPÇÃO 2: MOCHILA */}
                        <div 
                            onClick={() => (hasInventoryVip) && setSelectedSource('ITEM')}
                            className={cn(
                                "border p-2 rounded cursor-pointer transition-all flex flex-col items-center text-center gap-1",
                                selectedSource === 'ITEM' ? "bg-blue-900/40 border-blue-400 ring-1 ring-blue-400" : "bg-slate-950 border-slate-700 hover:border-blue-800",
                                !hasInventoryVip && "opacity-40 cursor-not-allowed grayscale"
                            )}
                        >
                            <Briefcase size={20} className="text-blue-400" />
                            <span className="font-press text-[8px] text-blue-200">MOCHILA</span>
                            <span className="font-mono text-xs text-slate-400">
                                {hasInventoryVip ? `${inventoryCount}x` : '0x'}
                            </span>
                        </div>

                    </div>
                    
                    <div className="bg-slate-950 p-4 rounded border border-slate-700 mb-4">
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                            <span>LIMITE (1/3):</span>
                            <span className="text-green-400">{bankData.availableLimit} PC$</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span>JUROS (7 DIAS):</span>
                            <span className="text-red-400">15%</span>
                        </div>
                    </div>

                    <form onSubmit={handleTakeLoan}>
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 font-vt323 text-2xl">PC$</span>
                            <input 
                                type="number" 
                                value={loanAmount}
                                onChange={e => setLoanAmount(e.target.value)}
                                className="w-full bg-black border border-slate-600 rounded pl-10 pr-4 py-3 text-white font-vt323 text-3xl outline-none focus:border-yellow-500 placeholder-slate-700"
                                placeholder="0"
                                max={bankData.availableLimit}
                            />
                        </div>
                        <PixelButton 
                            type="submit" 
                            isLoading={takeLoanMutation.isPending} 
                            disabled={!selectedSource}
                            className={cn(
                                "w-full text-black font-vt323 text-xl transition-colors",
                                selectedSource ? "bg-yellow-600 hover:bg-yellow-500" : "bg-slate-700 cursor-not-allowed text-slate-400"
                            )}
                        >
                            {selectedSource ? "SOLICITAR CRÉDITO" : "SELECIONE A FONTE"}
                        </PixelButton>
                    </form>
                </PixelCard>
            );
        }

        // 3. Sem VIP (Bloqueado)
        return (
             <PixelCard className="border-slate-700 bg-slate-900/50 opacity-80 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-950/60 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                    <div className="bg-slate-800 p-4 rounded-full mb-4 border border-slate-600">
                        <Lock size={32} className="text-slate-400" />
                    </div>
                    <h3 className="font-press text-xs text-slate-300 mb-2">ACESSO RESTRITO</h3>
                    <p className="font-vt323 text-xl text-slate-400">Você precisa do <span className="text-yellow-500">VIP Card</span> na mochila para solicitar crédito.</p>
                </div>
                
                <div className="blur-sm select-none pointer-events-none">
                      <h2 className="font-vt323 text-3xl text-slate-600 mb-4 flex items-center gap-2"><TrendingUp size={24}/> EMPRÉSTIMO</h2>
                      <div className="bg-slate-950 p-8 rounded border border-slate-800 mb-4"></div>
                      <div className="h-12 bg-slate-800 rounded"></div>
                </div>
            </PixelCard>
        );
    };

    return (
        <PageTransition className="min-h-screen p-4 pb-24 md:pl-28 pt-6 space-y-6">
            
            {/* Background Otimizado */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={cn(
                  "absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-900/10 rounded-full blur-[100px]",
                  !isMobile && "animate-pulse"
                )} />
            </div>

            {!isMobile && (
                <div className="fixed inset-0 pointer-events-none">
                  {[...Array(10)].map((_, i: number) => (
                    <FloatingParticle key={i} delay={i * 0.5} />
                  ))}
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <IconCard size={32} className="text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="font-vt323 text-5xl text-yellow-500 drop-shadow-md leading-none">ETE BANK</h1>
                        <p className="font-mono text-xs text-slate-400">CRÉDITO & INVESTIMENTOS</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center"
                >
                    <CreditCard user={user} />
                    <p className="text-[10px] font-mono text-slate-500 mt-4 animate-pulse flex items-center gap-2">
                        <ArrowRightLeft size={12} /> CLIQUE NO CARTÃO PARA VIRAR
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {renderRightPanel()}
                </div>
            </div>
        </PageTransition>
    );
}