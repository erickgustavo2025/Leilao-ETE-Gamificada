import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Coins, ShieldCheck, Loader2, Sparkles, Briefcase, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelButton } from '../ui/PixelButton';
import { useGameSound } from '../../hooks/useGameSound';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
    const { user, updateUser } = useAuth(); // Refresh user logic inside onSuccess usually handles update, but updateUser helps optimistically
    const { playSuccess, playError, playClick } = useGameSound();

    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [targetMatricula, setTargetMatricula] = useState('');
    const [amount, setAmount] = useState('');
    const [password, setPassword] = useState('');
    const [shake, setShake] = useState(false);
    
    // Novo Estado: Escolha de Isenção ('NONE', 'SKILL', 'ITEM')
    const [taxChoice, setTaxChoice] = useState<'NONE' | 'SKILL' | 'ITEM'>('NONE');

    // 👇 HELPER DE BUSCA HÍBRIDO (Código ou Nome)
    const isTaxItem = (item: any) => {
        // 1. Verifica pelo Código da Skill (Novo Padrão)
        if (item.skillCode === 'TRANSF_CONHECIMENTO') return true;
        
        // 2. Verifica pelo Nome (Legado / Item de Loja)
        const clean = (item.name || '').toLowerCase();
        return clean.includes('conhecimento') && (clean.includes('transf') || clean.includes('transferencia'));
    };

    // 👇 HELPER DE CONTAGEM REAL
    const getCount = (isSkillCategory: boolean) => {
        if (!user?.inventory) return 0;
        return user.inventory.reduce((acc, item) => {
            if (isTaxItem(item)) { 
                // Se for Skill, soma as cargas restantes (usesLeft)
                if (isSkillCategory && item.category === 'RANK_SKILL') return acc + (item.usesLeft || 0);
                // Se for Item físico, soma a quantidade (quantity)
                if (!isSkillCategory && item.category !== 'RANK_SKILL') return acc + (item.quantity || 1);
            }
            return acc;
        }, 0);
    };
    
    // Calcula totais reais
    const skillCharges = getCount(true);
    const itemQuantity = getCount(false);

    const hasSkill = skillCharges > 0;
    const hasConsum = itemQuantity > 0;
    
    const handleClose = () => {
        setStep(1);
        setTargetMatricula('');
        setAmount('');
        setPassword('');
        setTaxChoice('NONE'); 
        onClose();
    };

    const triggerShake = () => {
        setShake(true);
        playError();
        setTimeout(() => setShake(false), 500);
    };

    const handleNext = () => {
        playClick();
        const val = parseInt(amount);

        if (!targetMatricula || targetMatricula.length < 3) {
            toast.warning("Digite uma matrícula válida!");
            triggerShake();
            return;
        }
        if (!val || val <= 0) {
            toast.warning("O valor deve ser positivo!");
            triggerShake();
            return;
        }
        if (targetMatricula === user?.matricula) {
            toast.warning("Você não pode transferir para si mesmo (ainda!)");
            triggerShake();
            return;
        }
        
        // Lógica de Taxa Dinâmica
        const currentTax = taxChoice !== 'NONE' ? 0 : 800;
        const totalCost = val + currentTax;
        
        if ((user?.saldoPc || 0) < totalCost) {
            toast.error(`Saldo Insuficiente!`, {
                description: `Você precisa de ${formatCurrency(totalCost)} (Valor + Taxa).`
            });
            triggerShake();
            return;
        }

        setStep(2);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Usa a rota correta do economyController
            const res = await api.post('/economy/transfer', {
                targetMatricula,
                amount: parseInt(amount),
                password,
                useTaxExemption: taxChoice !== 'NONE',
                taxExemptionType: taxChoice !== 'NONE' ? taxChoice : undefined 
            });

            playSuccess();
            toast.success("TRANSFERÊNCIA REALIZADA! 💸", {
                description: taxChoice !== 'NONE'
                    ? `Enviado ${formatCurrency(parseInt(amount))} (TAXA GRÁTIS!)` 
                    : `Enviado ${formatCurrency(parseInt(amount))} (Taxa: 800 PC$)`
            });

            // Atualização Otimista se o backend devolver novo saldo
            if (user && res.data.novoSaldo !== undefined) {
                updateUser({ ...user, saldoPc: res.data.novoSaldo });
            }

            onSuccess(); // Chama refreshUser do pai
            handleClose();

        } catch (error: any) {
            console.error(error);
            playError();
            triggerShake();
            const msg = error.response?.data?.error || error.response?.data?.message || "Erro ao processar transferência.";
            toast.error("FALHA NA OPERAÇÃO ❌", { description: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden rounded-lg z-10"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />

                        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                    <Coins className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="font-vt323 text-3xl text-white leading-none">PIX ETE</h2>
                                    <p className="font-mono text-[10px] text-green-400/80 uppercase tracking-widest">Sistema de Transferência</p>
                                </div>
                            </div>

                            {step === 1 ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xl font-vt323 text-slate-400 mb-1 block">PARA QUEM? (MATRÍCULA)</label>
                                        <input
                                            type="text"
                                            value={targetMatricula}
                                            onChange={(e) => setTargetMatricula(e.target.value)}
                                            placeholder="Ex: 123456"
                                            className="w-full bg-black/50 border-2 border-slate-700 p-3 text-white font-mono text-lg focus:border-green-500 focus:outline-none transition-colors rounded"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xl font-vt323 text-slate-400 mb-1 block">QUANTO? (PC$)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-vt323 text-2xl">PC$</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-black/50 border-2 border-slate-700 pl-12 p-3 text-white font-vt323 text-3xl focus:border-green-500 focus:outline-none transition-colors rounded"
                                            />
                                        </div>
                                    </div>

                                    {/* ÁREA DE ISENÇÃO DE TAXA */}
                                    <div className="pt-2 border-t border-slate-800">
                                        <p className="text-[10px] font-press text-slate-400 mb-2 flex items-center gap-1">
                                            <Sparkles size={10} className="text-yellow-400"/> ISENÇÃO DE TAXA (OPCIONAL)
                                        </p>
                                        
                                        {!hasSkill && !hasConsum ? (
                                            <p className="text-[10px] text-slate-600 italic font-mono bg-black/30 p-2 rounded border border-slate-800 text-center">
                                                Você não possui itens ou habilidades de isenção.
                                                <br/>Taxa atual: <span className="text-red-500 font-bold">800 PC$</span>
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* OPÇÃO 1: SKILL */}
                                                {hasSkill && (
                                                    <div 
                                                        onClick={() => setTaxChoice(taxChoice === 'SKILL' ? 'NONE' : 'SKILL')}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded border cursor-pointer transition-all hover:bg-slate-800",
                                                            taxChoice === 'SKILL' 
                                                                ? "bg-blue-900/30 border-blue-500 text-blue-300 ring-1 ring-blue-500/50" 
                                                                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                        )}
                                                    >
                                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors", taxChoice === 'SKILL' ? "border-blue-400 bg-blue-500" : "border-slate-600 bg-black")}>
                                                            {taxChoice === 'SKILL' ? <div className="w-2 h-2 bg-white rounded-full" /> : <Zap size={10} className="text-slate-500"/>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-vt323 text-lg leading-none text-white">USAR HABILIDADE DE RANK</p>
                                                            <p className="text-[10px] font-mono opacity-70">Total de Cargas: {skillCharges}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* OPÇÃO 2: ITEM CONSUMÍVEL */}
                                                {hasConsum && (
                                                    <div 
                                                        onClick={() => setTaxChoice(taxChoice === 'ITEM' ? 'NONE' : 'ITEM')}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded border cursor-pointer transition-all hover:bg-slate-800",
                                                            taxChoice === 'ITEM' 
                                                                ? "bg-purple-900/30 border-purple-500 text-purple-300 ring-1 ring-purple-500/50" 
                                                                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                        )}
                                                    >
                                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors", taxChoice === 'ITEM' ? "border-purple-400 bg-purple-500" : "border-slate-600 bg-black")}>
                                                            {taxChoice === 'ITEM' ? <div className="w-2 h-2 bg-white rounded-full" /> : <Briefcase size={10} className="text-slate-500"/>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-vt323 text-lg leading-none text-white">USAR ITEM DA MOCHILA</p>
                                                            <p className="text-[10px] font-mono opacity-70">Você tem {itemQuantity} unidade(s).</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <PixelButton onClick={handleNext} className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white flex justify-center items-center gap-2">
                                        CONTINUAR <ArrowRight size={16} />
                                    </PixelButton>
                                </div>
                            ) : (
                                <form onSubmit={handleTransfer} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700 mb-4">
                                        <div className="flex justify-between text-sm font-mono text-slate-400 mb-1">
                                            <span>Enviando:</span>
                                            <span className="text-white">{amount} PC$</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-mono text-slate-400 mb-1">
                                            <span>Taxa:</span>
                                            <span className={taxChoice !== 'NONE' ? "text-purple-400 line-through decoration-2 opacity-70" : "text-red-400"}>
                                                {taxChoice !== 'NONE' ? "0 PC$ (GRÁTIS)" : "800 PC$"}
                                            </span>
                                        </div>
                                        <div className="h-px w-full bg-slate-700 my-2" />
                                        <div className="flex justify-between text-base font-press text-white">
                                            <span>TOTAL:</span>
                                            <span className="text-green-400">{parseInt(amount) + (taxChoice !== 'NONE' ? 0 : 800)} PC$</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-press text-slate-400 mb-1 flex items-center gap-2">
                                            <ShieldCheck size={12} /> CONFIRME SUA SENHA
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-slate-700 p-3 text-white font-mono focus:border-green-500 focus:outline-none transition-colors rounded"
                                            placeholder="••••••"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-2 mt-6">
                                        <PixelButton type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white" disabled={loading}>
                                            VOLTAR
                                        </PixelButton>
                                        <PixelButton type="submit" className="flex-[2] bg-green-600 hover:bg-green-500 text-white flex justify-center items-center gap-2" disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ENVIO 🚀'}
                                        </PixelButton>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}