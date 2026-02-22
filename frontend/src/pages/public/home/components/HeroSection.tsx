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

// ── Título com glitch (a animação linda que não mexemos) ──────
const UltraGlitchTitle = ({ text }: { text: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
        className="relative group cursor-default select-none"
    >
        {/* Glow por baixo — só desktop (blur pesado) */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 hidden md:block"
            style={{ filter: 'blur(100px)' }}
        />

        <h1 className="font-press text-4xl sm:text-5xl md:text-7xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-tight relative z-10 drop-shadow-2xl">
            {text}
        </h1>
        {/* Layers de glitch — só ativam no hover/tap, leves */}
        <h1 className="absolute top-0 left-1 text-red-500/60 opacity-0 group-hover:opacity-100 font-press text-4xl sm:text-5xl md:text-7xl lg:text-9xl leading-tight -z-10 animate-glitch-1" aria-hidden>
            {text}
        </h1>
        <h1 className="absolute top-0 -left-1 text-cyan-500/60 opacity-0 group-hover:opacity-100 font-press text-4xl sm:text-5xl md:text-7xl lg:text-9xl leading-tight -z-10 animate-glitch-2" aria-hidden>
            {text}
        </h1>
    </motion.div>
);

// ── Componente principal ──────────────────────────────────────
export function HeroSection() {
    const navigate = useNavigate();
    const { playHover, playClick } = useGameSound();
    const isMobile = useIsMobile();

    // Mouse tracking — só inicializa listeners em desktop
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 30 });

    const tiltX = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [15, -15]);
    const tiltY = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-15, 15]);

    useEffect(() => {
        // Não registra listener de mouse em mobile — economiza bateria e CPU
        if (isMobile) return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile, mouseX, mouseY]);

    return (
        <section
            className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 overflow-hidden"
            // perspective 3D só faz sentido com mouse tracking — remove em mobile
            style={isMobile ? undefined : { perspective: '2000px' }}
        >
            {/* Elementos orbitais — hidden em mobile mesmo (lg:block + opacity) */}
            {!isMobile && (
                <>
                    <motion.div style={{ x: -200, rotateY: tiltY }} className="absolute left-10 top-40 opacity-5 hidden lg:block">
                        <CircuitBoard size={200} className="text-white" />
                    </motion.div>
                    <motion.div style={{ x: 200, rotateY: tiltY }} className="absolute right-10 bottom-40 opacity-5 hidden lg:block">
                        <Hexagon size={200} className="text-white" />
                    </motion.div>
                </>
            )}

            {/* Wrapper com efeito 3D só em desktop */}
            <motion.div
                style={isMobile ? undefined : { rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' }}
                className="relative"
            >
                {/* Badge "Sistema Online" */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                        </span>
                        <span className="font-mono text-xs text-pink-300 tracking-widest">SISTEMA ONLINE • TEMPORADA 2026</span>
                    </div>
                </motion.div>

                {/* TÍTULO PRINCIPAL — a animação linda que preservamos */}
                <UltraGlitchTitle text="ETE GAMIFICADA" />

                {/* Subtítulo */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 flex items-center justify-center gap-4 flex-wrap"
                >
                    <div className="h-[1px] w-10 md:w-20 bg-gradient-to-r from-transparent to-pink-500" />
                    <span className="font-vt323 text-lg md:text-2xl lg:text-4xl text-slate-300 tracking-[0.2em] md:tracking-[0.3em]">
                        ESTUDE • EVOLUA • CONQUISTE
                    </span>
                    <div className="h-[1px] w-10 md:w-20 bg-gradient-to-l from-transparent to-pink-500" />
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                    className="mt-12 md:mt-16"
                >
                    <button
                        onClick={() => { playClick(); navigate('/login'); }}
                        onMouseEnter={isMobile ? undefined : playHover}
                        className="relative px-8 md:px-12 py-4 md:py-5 font-press text-sm md:text-lg lg:text-xl text-white overflow-hidden rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        <Play className="inline-block mr-3 fill-white w-4 h-4 md:w-5 md:h-5" />
                        INICIAR JORNADA
                        <ChevronRight className="inline-block ml-2 w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </motion.div>
            </motion.div>
        </section>
    );
}
