import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <motion.div
            // 🔥 OTIMIZAÇÃO: Apenas opacidade. Sem transformações de posição (x/y) ou escala.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            
            // ⚠️ IMPORTANTE: Não usamos 'exit' aqui.
            // O 'exit' força o React a manter a página velha na memória junto com a nova.
            // Remover isso libera a memória instantaneamente na troca de rota.
            
            className={className}
        >
            {children}
        </motion.div>
    );
}