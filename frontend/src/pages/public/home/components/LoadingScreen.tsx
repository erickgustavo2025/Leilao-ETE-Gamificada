import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Componente Híbrido: Aceita progresso externo ou simula sozinho
export function UltraLoadingScreen({ progress: externalProgress }: { progress?: number }) {
    const [localProgress, setLocalProgress] = useState(0);
    const [text, setText] = useState('INICIALIZANDO');

    // Usa o progresso externo (se passado) ou o local (simulado)
    const displayProgress = externalProgress !== undefined ? externalProgress : localProgress;

    // Lógica de Simulação Automática (Fallback)
    useEffect(() => {
        if (externalProgress === undefined) {
            const interval = setInterval(() => {
                setLocalProgress(prev => {
                    const next = prev + Math.random() * 15;
                    if (next >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return next;
                });
            }, 200);
            return () => clearInterval(interval);
        }
    }, [externalProgress]);

    // Atualiza os textos conforme o progresso
    useEffect(() => {
        if(displayProgress > 20) setText('CARREGANDO ASSETS');
        if(displayProgress > 50) setText('CONECTANDO SERVIDOR');
        if(displayProgress > 80) setText('PREPARANDO AMBIENTE');
        if(displayProgress >= 100) setText('BEM-VINDO');
    }, [displayProgress]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col items-center justify-center touch-none px-4">
            
            {/* Logo Central (Responsiva) */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8">
                 <img 
                    src="/assets/etegamificada.png" 
                    alt="Logo"
                    className="w-full h-full object-contain animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.4)]" 
                 />
            </div>

            {/* Texto de Status (Responsivo) */}
            <h1 className="font-press text-lg md:text-2xl text-white mb-6 text-center tracking-wider animate-pulse">
                {text}
            </h1>

            {/* Barra de Progresso (Responsiva) */}
            <div className="w-full max-w-[250px] md:max-w-md h-2 md:h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                    className="h-full bg-gradient-to-r from-pink-600 to-purple-600 shadow-[0_0_15px_rgba(236,72,153,0.6)]" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${displayProgress}%` }} 
                    transition={{ ease: "easeOut" }}
                />
            </div>

            {/* Porcentagem */}
            <p className="mt-3 font-mono text-[10px] md:text-xs text-slate-500 tracking-widest">
                {Math.round(displayProgress)}%
            </p>
        </div>
    );
}