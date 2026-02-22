// frontend/src/pages/public/home/components/CustomCursor.tsx
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Verifica se é desktop (touch devices não precisam de cursor customizado)
        const check = () => {
            const isTouch = window.matchMedia('(hover: none)').matches;
            setIsDesktop(!isTouch && window.innerWidth >= 768);
        };
        check();
        window.addEventListener('resize', check, { passive: true });
        return () => window.removeEventListener('resize', check);
    }, []);

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);
    const smoothX = useSpring(mouseX, { stiffness: 500, damping: 28 });
    const smoothY = useSpring(mouseY, { stiffness: 500, damping: 28 });

    useEffect(() => {
        // Não registra o listener se for mobile/touch
        if (!isDesktop) return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isDesktop, mouseX, mouseY]);

    // Não renderiza nada em touch devices
    if (!isDesktop) return null;

    return (
        <>
            {/* Ponto Principal (Rápido) */}
            <motion.div
                className="fixed w-4 h-4 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full"
                style={{ left: mouseX, top: mouseY, translateX: '-50%', translateY: '-50%' }}
            />
            {/* Rastro (Suave) */}
            <motion.div
                className="fixed w-12 h-12 pointer-events-none z-[9998] rounded-full border border-pink-500/50"
                style={{ left: smoothX, top: smoothY, translateX: '-50%', translateY: '-50%' }}
            />
        </>
    );
}
