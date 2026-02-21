// frontend/src/pages/public/home/components/FloatingShapes.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Triangle, Square, Circle } from 'lucide-react';

const FloatingShapes = React.memo(() => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Triângulo Rosa (Rotação Lenta) */}
            <motion.div
                animate={{ rotate: 360, y: [0, 20, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 right-[10%] opacity-10 hidden xl:block"
            >
                <Triangle size={60} className="text-pink-500" strokeWidth={1} />
            </motion.div>

            {/* Quadrado Ciano (Rotação Inversa) */}
            <motion.div
                animate={{ rotate: -360, y: [0, -30, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-40 left-[5%] opacity-10 hidden xl:block"
            >
                <Square size={50} className="text-cyan-500" strokeWidth={1} />
            </motion.div>

            {/* Círculo Roxo (Pulsante) */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
                <Circle size={400} className="text-purple-500" strokeWidth={0.5} />
            </motion.div>
        </div>
    );
});

export default FloatingShapes;