import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, CircuitBoard, CreditCard as CardIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { type User } from '../../contexts/AuthContext';

// ✅ Interface atualizada para aceitar o User do contexto
interface CreditCardProps {
    user: User | null;
}

export function CreditCard({ user }: CreditCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Dados extraídos do User
    const userName = user?.nome || 'ESTUDANTE';
    const balance = user?.saldoPc || 0;
    const matricula = user?.matricula || '0000';
    const role = user?.role || 'student';
    const isVip = user?.isVip || false;

    // Formatação
    const formattedNumber = `XXXX XXXX XXXX ${matricula.slice(-4)}`;

    // Define cor baseado no cargo (Mantendo a lógica nova com o visual antigo)
    const getCardGradient = () => {
        if (role === 'admin' || role === 'dev') return 'from-red-900 via-red-800 to-black border-red-500/50';
        if (isVip) return 'from-yellow-900 via-yellow-700 to-black border-yellow-500/50';
        // Padrão
        return 'from-slate-900 via-slate-800 to-black border-yellow-500/50';
    };

    const getTextColor = () => {
        if (role === 'admin' || role === 'dev') return 'text-red-500';
        return 'text-yellow-500';
    };

    // Simulação de dados do Verso (já que o user não tem esses dados diretos ainda)
    const creditLimit = user?.maxPcAchieved ? Math.floor(user.maxPcAchieved * 0.5) : 1000;
    const loan = null; // Por enquanto null para mostrar "LIVRE"

    return (
        <div className="perspective-1000 w-full h-56 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* =======================
                    FRENTE (SALDO)
                   ======================= */}
                <div className={cn(
                    "absolute inset-0 backface-hidden rounded-xl p-6 overflow-hidden flex flex-col justify-between border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                    "bg-gradient-to-br",
                    getCardGradient()
                )}>
                    {/* Pattern de Fundo */}
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] pointer-events-none" />
                    
                    <div className="flex justify-between items-start z-10">
                        <div className="flex flex-col">
                            <h3 className={cn("font-vt323 text-2xl tracking-widest", getTextColor())}>ETE BANK</h3>
                            <p className={cn("font-mono text-[8px] opacity-50", getTextColor())}>MEMBER SINCE 2026</p>
                        </div>
                        <Wifi className={cn("rotate-90 opacity-50", getTextColor())} size={24} />
                    </div>

                    <div className="flex items-center gap-4 my-2 z-10">
                        <div className={cn("w-12 h-9 rounded border flex items-center justify-center relative overflow-hidden bg-opacity-20", 
                            role === 'admin' ? "bg-red-500/20 border-red-500/40" : "bg-yellow-600/20 border-yellow-600/40")}>
                            <CircuitBoard className={cn("w-full h-full opacity-50", role === 'admin' ? "text-red-500" : "text-yellow-600")} />
                        </div>
                        <div className="flex flex-col">
                             <p className="font-mono text-[8px] text-slate-400">SALDO ATUAL</p>
                             <p className="font-vt323 text-3xl text-white tracking-widest text-shadow-glow">
                                {balance.toLocaleString()} PC$
                             </p>
                        </div>
                    </div>

                    <div className="z-10 mt-auto flex justify-between items-end">
                        <p className="font-mono text-xs text-slate-300 uppercase tracking-widest shadow-black drop-shadow-md truncate max-w-[180px]">
                            {userName}
                        </p>
                        <div className="opacity-50">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <div className={cn("w-5 h-5 rounded-full", role === 'admin' ? "bg-red-500/50" : "bg-yellow-500/50")} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* =======================
                    VERSO (LIMITES)
                   ======================= */}
                <div 
                    className={cn(
                        "absolute inset-0 backface-hidden rounded-xl p-6 flex flex-col justify-between border-2 shadow-xl",
                        "bg-gradient-to-br from-slate-900 via-black to-slate-900 border-slate-700"
                    )}
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="w-full h-8 bg-black absolute top-4 left-0" />

                    <div className="mt-10 z-10">
                        <div className="flex justify-between items-center mb-2">
                             {/* 🔥 CORREÇÃO DE FONTE: "STATUS" ok, mas palavras com acento usam font-mono ou vt323 */}
                             <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">STATUS DA CONTA</span>
                             <span className={cn(
                                 "text-[10px] px-2 py-0.5 rounded font-bold font-mono", // Font mono para aceitar acentos
                                 loan ? "bg-red-500 text-white animate-pulse" : "bg-green-500 text-black"
                             )}>
                                 {loan ? "EM DÉBITO" : "LIVRE"} 
                             </span>
                        </div>

                        {loan ? (
                            <div className="bg-red-950/50 p-2 rounded border border-red-800">
                                <p className="font-mono text-[10px] text-red-300">FATURA ABERTA</p>
                                <p className="font-vt323 text-3xl text-white">0 PC$</p>
                            </div>
                        ) : (
                            <div className="bg-green-900/20 p-2 rounded border border-green-800">
                                {/* "DISPONÍVEL" tem acento -> font-mono */}
                                <p className="font-mono text-[10px] text-green-400">LIMITE DISPONÍVEL</p>
                                <p className="font-vt323 text-3xl text-white">{creditLimit.toLocaleString()} PC$</p>
                                <p className="font-mono text-[8px] text-green-600 mt-1">Juros: 15% a.s.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center z-10 mt-auto pt-2 border-t border-white/5">
                         <div className="flex items-center gap-2">
                            <CardIcon className="text-slate-600 w-5 h-5" />
                            <p className="font-mono text-[10px] text-slate-500">{formattedNumber}</p>
                         </div>
                         <p className="font-press text-[8px] text-slate-600">CVV 777</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}