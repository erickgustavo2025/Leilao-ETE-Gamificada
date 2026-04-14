// frontend/src/pages/public/home/components/HeroSection.tsx
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Play, ChevronRight, Hexagon, CircuitBoard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameSound } from '../../../../hooks/useGameSound';

// ── Detecção de mobile ────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < 768;
    });
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check, { passive: true });
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
};

// ── Título com glitch ─────────────────────────────────────────
const UltraGlitchTitle = ({ text }: { text: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
        className="relative group cursor-default select-none"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 hidden md:block"
            style={{ filter: 'blur(100px)' }}
        />
        <h1 className="font-press text-4xl sm:text-5xl md:text-7xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-tight relative z-10 drop-shadow-2xl">
            {text}
        </h1>
    </motion.div>
);

export function HeroSection() {
    const navigate = useNavigate();
    const { playHover, playClick } = useGameSound();
    const isMobile = useIsMobile();

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 30 });

    const tiltX = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [10, -10]);
    const tiltY = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-10, 10]);

    useEffect(() => {
        if (isMobile) return;
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile, mouseX, mouseY]);

    return (
        <section className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-visible select-none">
            {/* Decorativos Orbitais */}
            {!isMobile && (
                <>
                    <motion.div style={{ x: -200, rotateY: tiltY }} className="absolute left-10 top-40 opacity-5 hidden lg:block pointer-events-none">
                        <CircuitBoard size={200} className="text-white" />
                    </motion.div>
                    <motion.div style={{ x: 200, rotateY: tiltY }} className="absolute right-10 bottom-40 opacity-5 hidden lg:block pointer-events-none">
                        <Hexagon size={200} className="text-white" />
                    </motion.div>
                </>
            )}

            {/* AREA 3D: Título e Badge */}
            <motion.div
                style={isMobile ? undefined : { rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' }}
                className="relative z-20 pointer-events-none" // pointer-events-none aqui para não atrapalhar o clique no botão que está embaixo
            >
                <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl">
                        <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                        </span>
                        <span className="font-mono text-xs text-pink-300 tracking-widest uppercase">SISTEMA ONLINE • ESTADO ESTÁVEL</span>
                    </div>
                </motion.div>

                <UltraGlitchTitle text="ETE GAMIFICADA" />

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                    <div className="h-[1px] w-10 md:w-20 bg-gradient-to-r from-transparent to-pink-500" />
                    <span className="font-vt323 text-lg md:text-2xl lg:text-4xl text-slate-300 tracking-[0.2em] md:tracking-[0.3em] uppercase">
                        ESTUDE • EVOLUA • CONQUISTE
                    </span>
                    <div className="h-[1px] w-10 md:w-20 bg-gradient-to-l from-transparent to-pink-500" />
                </motion.div>
            </motion.div>

            {/* ÁREA ESTÁVEL: BOTÃO DE AÇÃO (Fora do Tilt para ser 100% clicável) */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="mt-12 md:mt-16 relative z-50" // Z-50 garante que está no topo
            >
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        playClick();
                        navigate('/login');
                    }}
                    onMouseEnter={() => !isMobile && playHover()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative px-8 md:px-12 py-4 md:py-5 font-press text-sm md:text-lg lg:text-xl text-white rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] cursor-pointer active:brightness-125 transition-all duration-200"
                >
                    <Play className="inline-block mr-3 fill-white w-4 h-4 md:w-5 md:h-5" />
                    INICIAR JORNADA
                    <ChevronRight className="inline-block ml-2 w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
            </motion.div>
        </section>
    );
}
