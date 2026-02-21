// frontend/src/pages/public/home/components/CustomCursor.tsx
import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    // Suavização para o "rastro"
    const smoothX = useSpring(mouseX, { stiffness: 500, damping: 28 });
    const smoothY = useSpring(mouseY, { stiffness: 500, damping: 28 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <>
            {/* Ponto Principal (Rápido) */}
            <motion.div
                className="fixed w-4 h-4 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full hidden md:block"
                style={{ left: mouseX, top: mouseY, translateX: '-50%', translateY: '-50%' }}
            />
            {/* Rastro (Suave) */}
            <motion.div
                className="fixed w-12 h-12 pointer-events-none z-[9998] rounded-full border border-pink-500/50 hidden md:block"
                style={{ left: smoothX, top: smoothY, translateX: '-50%', translateY: '-50%' }}
            />
        </>
    );
}