import { useState, useEffect, useRef, useMemo, } from 'react';
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useMotionValue,
    useMotionTemplate,
    useSpring,
    MotionValue
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2, Trophy, Sparkles, Users, Zap, ExternalLink, Play,
    Shield, Award, ChevronRight, Globe, Target, Sword, Crown,
    Flame, Star, Rocket, CircuitBoard, Radio,
    ChevronDown, ArrowRight, Hexagon, Triangle, Square,
    Heart, Lock, Unlock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useGameSound } from '../../hooks/useGameSound';

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 INTERFACES & TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface EventItem {
    id: string;
    title: string;
    subtitle: string;
    desc: string;
    color: string;
    borderColor: string;
    textColor: string;
    glowColor: string;
    icon: React.ElementType;
    external: boolean;
    link: string;
    stats: { label: string; value: string }[];
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
}

interface StatItem {
    value: string;
    label: string;
    icon: React.ElementType;
    color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 CONSTANTES ÉPICAS
// ═══════════════════════════════════════════════════════════════════════════

const EVENTS: EventItem[] = [
    {
        id: 'taca',
        title: 'TAÇA DAS CASAS',
        subtitle: 'THE ULTIMATE BATTLE',
        desc: 'A competição suprema entre as Casas. Cada ação conta pontos. Cada vitória ecoa na eternidade. A glória espera os dignos.',
        color: 'from-yellow-500 via-amber-500 to-orange-600',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.6)',
        icon: Trophy,
        external: false,
        link: '/login',
        stats: [
            { label: 'Casas Ativas', value: '4' },
            { label: 'Batalhas/Mês', value: '50+' },
            { label: 'Prêmio Final', value: '∞ XP' }
        ]
    },
    {
        id: 'intergil',
        title: 'INTERGIL',
        subtitle: 'SPORTS CHAMPIONSHIP',
        desc: 'O maior evento esportivo do sistema. Placares em tempo real. Estatísticas avançadas. Arena digital.',
        color: 'from-blue-500 via-cyan-500 to-teal-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.6)',
        icon: Zap,
        external: true,
        link: 'http://89.116.73.177:3000',
        stats: [
            { label: 'Modalidades', value: '12' },
            { label: 'Times', value: '32' },
            { label: 'Status', value: 'LIVE' }
        ]
    },
    {
        id: 'leiturarte',
        title: 'LEITURARTE',
        subtitle: 'CREATIVE REALM',
        desc: 'Onde palavras viram poder. Literatura gamificada. Cada página lida, XP acumulado. Arte que pontua.',
        color: 'from-pink-500 via-rose-500 to-red-500',
        borderColor: 'border-pink-500',
        textColor: 'text-pink-400',
        glowColor: 'rgba(236, 72, 153, 0.6)',
        icon: Sparkles,
        external: false,
        link: '/login',
        stats: [
            { label: 'Livros', value: '200+' },
            { label: 'Projetos', value: '150' },
            { label: 'XP/Livro', value: '500' }
        ]
    },
    {
        id: 'gincana',
        title: 'GINCANA ECOLÓGICA',
        subtitle: 'SAVE THE WORLD',
        desc: 'Missões reais com impacto real. Sustentabilidade gamificada. O planeta agradece, seu XP explode.',
        color: 'from-green-500 via-emerald-500 to-lime-500',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        glowColor: 'rgba(34, 197, 94, 0.6)',
        icon: Globe,
        external: false,
        link: '/login',
        stats: [
            { label: 'Missões', value: '75' },
            { label: 'Árvores', value: '1.2K' },
            { label: 'Impacto', value: 'MAX' }
        ]
    }
];

const STATS: StatItem[] = [
    { value: '2.847', label: 'JOGADORES ATIVOS', icon: Users, color: 'from-pink-500 to-rose-600' },
    { value: '156K', label: 'XP DISTRIBUÍDO', icon: Sparkles, color: 'from-purple-500 to-violet-600' },
    { value: '4', label: 'CASAS EM GUERRA', icon: Sword, color: 'from-amber-500 to-orange-600' },
    { value: '∞', label: 'POSSIBILIDADES', icon: Rocket, color: 'from-cyan-500 to-blue-600' }
];

const HOUSES = [
    { name: 'PHOENIX', color: 'from-red-500 to-orange-500', icon: Flame, points: 12450 },
    { name: 'DRAGON', color: 'from-blue-500 to-cyan-500', icon: Shield, points: 11890 },
    { name: 'GRIFFIN', color: 'from-yellow-500 to-amber-500', icon: Crown, points: 11234 },
    { name: 'SERPENT', color: 'from-green-500 to-emerald-500', icon: Target, points: 10876 }
];

const FEATURES = [
    {
        icon: Gamepad2,
        title: 'GAMIFICAÇÃO TOTAL',
        desc: 'Notas viram XP. Presença vira streak. Tudo que você faz na escola te evolui no sistema.',
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600'
    },
    {
        icon: Trophy,
        title: 'RANKING GLOBAL',
        desc: 'Compita com toda a escola. Leaderboards em tempo real. Seja o número 1.',
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-600'
    },
    {
        icon: Shield,
        title: 'SISTEMA DE CASAS',
        desc: 'Junte-se à sua Casa. Lute pelos seus. Cada ponto individual soma pro coletivo.',
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-600'
    },
    {
        icon: Award,
        title: 'LOJA EXCLUSIVA',
        desc: 'Troque PC$ por itens reais. Benefícios escolares. Skins raras. Prêmios épicos.',
        color: 'pink',
        gradient: 'from-pink-500 to-rose-600'
    },
    {
        icon: Zap,
        title: 'MISSÕES DIÁRIAS',
        desc: 'Novas missões todo dia. Complete desafios. Ganhe bônus. Mantenha sua streak.',
        color: 'green',
        gradient: 'from-green-500 to-emerald-600'
    },
    {
        icon: Crown,
        title: 'TÍTULOS & BADGES',
        desc: 'Conquiste títulos lendários. Exiba suas badges. Prove seu valor.',
        color: 'orange',
        gradient: 'from-orange-500 to-red-600'
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LandingPage() {
    const navigate = useNavigate();
    const { playHover, playClick } = useGameSound();
    const [activeEvent, setActiveEvent] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // ─── SCROLL & PARALLAX ───
    const { scrollY, scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
    const opacityHero = useTransform(scrollY, [0, 500], [1, 0]);
    const scaleHero = useTransform(scrollY, [0, 500], [1, 0.8]);
    const blurHero = useTransform(scrollY, [0, 500], [0, 10]);

    // ─── MOUSE TRACKING ───
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 30 });

    // ─── 3D TILT ───
    const tiltX = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [15, -15]);
    const tiltY = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-15, 15]);

    // ─── SPOTLIGHT ───
    const spotlight = useMotionTemplate`
        radial-gradient(800px circle at ${smoothMouseX}px ${smoothMouseY}px, rgba(236, 72, 153, 0.08), transparent 60%)

    `;
    const heroBlur = useMotionTemplate`blur(${blurHero}px)`

    // ─── MOUSE MOVE HANDLER ───
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // ─── LOADING SEQUENCE ───
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setIsLoaded(true), 500);
                    return 100;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    // ─── CAROUSEL AUTO-PLAY ───
    useEffect(() => {
        if (!isLoaded) return;
        const interval = setInterval(() => {
            setActiveEvent(prev => (prev + 1) % EVENTS.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [isLoaded]);

    // ─── KEYBOARD NAVIGATION ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setActiveEvent(prev => prev === 0 ? EVENTS.length - 1 : prev - 1);
            if (e.key === 'ArrowRight') setActiveEvent(prev => (prev + 1) % EVENTS.length);
            if (e.key === 'Enter') navigate('/login');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);



    const currentEvent = EVENTS[activeEvent];

    if (!isLoaded) {
        return <UltraLoadingScreen progress={loadingProgress} />;
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#030303] text-white overflow-x-hidden relative selection:bg-pink-500 selection:text-white font-sans cursor-none group/main"
        >
            {/* ═══ CUSTOM CURSOR ═══ */}
            <CustomCursor mouseX={smoothMouseX} mouseY={smoothMouseY} />

            {/* ═══ PROGRESS BAR ═══ */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 z-[100] origin-left"
                style={{ scaleX: smoothProgress }}
            />

            {/* ═══ BACKGROUND LAYERS ═══ */}
            <BackgroundLayers y1={y1} y2={y2} spotlight={spotlight} />

            {/* ═══ FLOATING PARTICLES ═══ */}
            <ParticleField />

            {/* ═══ SCANLINES ═══ */}
            <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.015]">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
            </div>

            {/* ═══ NAVBAR ═══ */}
            <UltraNavbar navigate={navigate} playClick={playClick} playHover={playHover} scrollProgress={smoothProgress} />

            {/* ═══ HERO SECTION ═══ */}
            <motion.section
                style={{ opacity: opacityHero, scale: scaleHero, filter: heroBlur }}
                className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20"
            >
                {/* Orbital Elements */}
                <OrbitalElements y1={y1} y2={y2} tiltY={tiltY} />

                {/* Main Content */}
                <div className="perspective-[2000px] relative">
                    <motion.div
                        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
                        className="relative"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
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

                        {/* Glitch Title */}
                        <UltraGlitchTitle text="ETE GAMIFICADA" />

                        {/* Subtitle */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-8"
                        >
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-pink-500" />
                                <TypingEffect
                                    text="ESTUDE • EVOLUA • CONQUISTE"
                                    className="font-vt323 text-2xl md:text-4xl text-slate-300 tracking-[0.3em]"
                                    delay={1200}
                                />
                                <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-pink-500" />
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 1.8, type: "spring", stiffness: 100 }}
                            className="mt-16"
                        >
                            <UltraButton
                                onClick={() => { playClick(); navigate('/login'); }}
                                onMouseEnter={playHover}
                            >
                                <Play className="inline-block mr-3 fill-white" size={20} />
                                INICIAR JORNADA
                                <ChevronRight className="inline-block ml-2" size={20} />
                            </UltraButton>
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.2 }}
                            className="mt-16 flex items-center justify-center gap-8 md:gap-16"
                        >
                            {[
                                { icon: Users, value: '2.8K+', label: 'PLAYERS' },
                                { icon: Sword, value: '4', label: 'CASAS' },
                                { icon: Trophy, value: '50+', label: 'EVENTOS' }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                                    <stat.icon size={20} className="text-pink-400" />
                                    <span className="font-press text-lg text-white">{stat.value}</span>
                                    <span className="font-mono text-[10px] text-slate-500 tracking-widest">{stat.label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <ScrollIndicator />
            </motion.section>

            {/* ═══ STATS SECTION ═══ */}
            <StatsSection stats={STATS} />

            {/* ═══ EVENTS CAROUSEL ═══ */}
            <EventsSection
                events={EVENTS}
                activeEvent={activeEvent}
                setActiveEvent={setActiveEvent}
                currentEvent={currentEvent}
                navigate={navigate}
                playClick={playClick}
                playHover={playHover}
            />

            {/* ═══ HOUSES LEADERBOARD ═══ */}
            <HousesSection houses={HOUSES} />

            {/* ═══ FEATURES GRID ═══ */}
            <FeaturesSection features={FEATURES} playHover={playHover} />

            {/* ═══ HOW IT WORKS ═══ */}
            <HowItWorksSection />

            {/* ═══ FINAL CTA ═══ */}
            <FinalCTASection navigate={navigate} playClick={playClick} playHover={playHover} />

            {/* ═══ FOOTER ═══ */}
            <UltraFooter />



        </div>



    );
}


// ═══════════════════════════════════════════════════════════════════════════
// 🔥 CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════════════════════

function CustomCursor({ mouseX, mouseY }: { mouseX: MotionValue<number>, mouseY: MotionValue<number> }) {
    return (
        <>
            {/* Main Cursor */}
            <motion.div
                className="fixed w-4 h-4 pointer-events-none z-[200] mix-blend-difference"
                style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
            >
                <div className="w-full h-full bg-white rounded-full" />
            </motion.div>

            {/* Cursor Trail */}
            <motion.div
                className="fixed w-10 h-10 pointer-events-none z-[199] rounded-full border border-pink-500/50"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
            />
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ULTRA LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function UltraLoadingScreen({ progress }: { progress: number }) {
    const [glitchText, setGlitchText] = useState('INICIALIZANDO');
    const texts = ['INICIALIZANDO', 'CARREGANDO ASSETS', 'CONECTANDO SERVIDOR', 'PREPARANDO ARENA', 'QUASE LÁ...'];

    useEffect(() => {
        const idx = Math.min(Math.floor(progress / 25), texts.length - 1);
        setGlitchText(texts[idx]);
    }, [progress]);

    return (
        <div className="fixed inset-0 bg-[#030303] z-[200] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* Floating Particles */}
            <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-pink-500 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                            y: [0, -30, 0]
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            {/* Logo */}
            <motion.div
                animate={{
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity }
                }}
                className="mb-12 relative"
            >
                <div className="w-32 h-32 relative">
                    <img src="/assets/etegamificada.png" className="w-full h-full drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent rounded-full animate-pulse" />
                </div>
            </motion.div>

            {/* Loading Text */}
            <div className="relative mb-8">
                <motion.span
                    className="font-press text-2xl md:text-4xl text-white"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    {glitchText}
                </motion.span>
                <motion.span
                    className="absolute -right-8 font-press text-2xl md:text-4xl text-pink-500"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    _
                </motion.span>
            </div>

            {/* Progress Bar */}
            <div className="w-80 md:w-96 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur">
                <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full relative"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
            </div>

            {/* Progress Percentage */}
            <motion.div
                className="mt-4 font-mono text-sm text-slate-500"
                key={Math.floor(progress)}
            >
                {Math.min(Math.floor(progress), 100)}% COMPLETE
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute bottom-10 left-10 font-mono text-[10px] text-slate-700 hidden md:block">
                <div>SYS: ETE_GAMIFICADA_v2.0</div>
                <div>NET: CONNECTING...</div>
                <div>MEM: {Math.floor(progress * 0.5)}MB / 50MB</div>
            </div>

            <div className="absolute bottom-10 right-10 font-mono text-[10px] text-slate-700 hidden md:block text-right">
                <div>BUILD: 2026.01.{String(new Date().getDate()).padStart(2, '0')}</div>
                <div>ENV: PRODUCTION</div>
                <div>STATUS: ONLINE</div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 BACKGROUND LAYERS
// ═══════════════════════════════════════════════════════════════════════════

function BackgroundLayers({ y1, y2, spotlight }: any) {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Spotlight */}
            <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover/main:opacity-100"
                style={{ background: spotlight }}
            />

            {/* Gradient Orbs */}
            <motion.div style={{ y: y1 }} className="absolute inset-0">
                <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] bg-purple-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[80vw] h-[80vw] bg-blue-900/10 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-pink-900/5 rounded-full blur-[200px]" />
            </motion.div>

            {/* Grid Pattern */}
            <motion.div style={{ y: y2 }} className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </motion.div>

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }} />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 PARTICLE FIELD
// ═══════════════════════════════════════════════════════════════════════════

function ParticleField() {
    const particles = useMemo(() =>
        [...Array(50)].map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            speedX: 0,
            speedY: Math.random() * 20 + 10,
            opacity: 0.8,
            color: 'rgba(236, 72, 153, 0.3)'
        } as Particle)), []
    );

    return (
        <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-pink-500/30"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, p.opacity, 0],
                        scale: [0, 1, 0]
                    }}
                    transition={{
                        duration: p.speedY,
                        repeat: Infinity,
                        delay: p.speedX,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ULTRA NAVBAR
// ═══════════════════════════════════════════════════════════════════════════

function UltraNavbar({ navigate, playClick, playHover, scrollProgress }: any) {
    const bgOpacity = useTransform(scrollProgress, [0, 0.1], [0, 1]);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 2.5 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6"
        >
            <motion.div
                className="max-w-7xl mx-auto flex justify-between items-center rounded-2xl px-6 py-3 border border-white/10"
                style={{
                    backgroundColor: useMotionTemplate`rgba(0, 0, 0, ${bgOpacity})`,
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-4 cursor-pointer group"
                    onMouseEnter={playHover}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <div className="relative">
                        <img src="/assets/etegamificada.png" className="w-10 h-10 drop-shadow-lg transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="font-press text-sm text-white group-hover:text-pink-400 transition-colors">ETE GAMIFICADA</span>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            <span className="font-mono text-[10px] text-green-400 tracking-widest">ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="hidden lg:flex items-center gap-8">
                    {['EVENTOS', 'RANKING', 'CASAS', 'LOJA'].map((item) => (
                        <button
                            key={item}
                            onMouseEnter={playHover}
                            onClick={() => { playClick(); navigate('/login'); }}
                            className="font-mono text-xs text-slate-400 hover:text-white transition-colors tracking-widest relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-pink-500 group-hover:w-full transition-all duration-300" />
                        </button>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={() => { playClick(); navigate('/login'); }}
                        onMouseEnter={playHover}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative px-6 py-2 font-press text-sm text-white overflow-hidden rounded-lg border border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 transition-colors group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Unlock size={14} />
                            LOGIN
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </motion.button>
                </div>
            </motion.div>
        </motion.nav>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ORBITAL ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════

function OrbitalElements({ y1, y2, tiltY }: any) {
    return (
        <>
            <motion.div
                style={{ rotate: y2, x: -200, rotateY: tiltY }}
                className="absolute left-10 top-40 opacity-5 hidden lg:block"
            >
                <CircuitBoard size={200} className="text-white" strokeWidth={0.5} />
            </motion.div>
            <motion.div
                style={{ rotate: y1, x: 200, rotateY: tiltY }}
                className="absolute right-10 bottom-40 opacity-5 hidden lg:block"
            >
                <Hexagon size={200} className="text-white" strokeWidth={0.5} />
            </motion.div>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 right-20 opacity-10 hidden xl:block"
            >
                <Triangle size={80} className="text-pink-500" strokeWidth={0.5} />
            </motion.div>
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-32 left-32 opacity-10 hidden xl:block"
            >
                <Square size={60} className="text-cyan-500" strokeWidth={0.5} />
            </motion.div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ULTRA GLITCH TITLE
// ═══════════════════════════════════════════════════════════════════════════

function UltraGlitchTitle({ text }: { text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
            className="relative group cursor-default select-none"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-[100px] group-hover:blur-[150px] transition-all duration-500" />

            {/* Main Title */}
            <h1 className="font-press text-5xl md:text-7xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-tight relative z-10 drop-shadow-2xl">
                {text}
            </h1>

            {/* Glitch Layers */}
            <h1 className="absolute top-0 left-1 text-red-500/60 opacity-0 group-hover:opacity-100 font-press text-5xl md:text-7xl lg:text-9xl leading-tight -z-10 animate-glitch-1">
                {text}
            </h1>
            <h1 className="absolute top-0 -left-1 text-cyan-500/60 opacity-0 group-hover:opacity-100 font-press text-5xl md:text-7xl lg:text-9xl leading-tight -z-10 animate-glitch-2">
                {text}
            </h1>

            {/* Underline */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent mt-6 origin-center"
            />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 TYPING EFFECT
// ═══════════════════════════════════════════════════════════════════════════

function TypingEffect({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) {
    const [displayedText, setDisplayedText] = useState("");
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedText(text.slice(0, i + 1));
                i++;
                if (i > text.length) {
                    clearInterval(interval);
                    setTimeout(() => setShowCursor(false), 2000);
                }
            }, 80);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timeout);
    }, [text, delay]);

    return (
        <span className={className}>
            {displayedText}
            {showCursor && <span className="animate-pulse text-pink-500">|</span>}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ULTRA BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function UltraButton({ children, onClick, onMouseEnter }: any) {
    return (
        <motion.button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(236, 72, 153, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            className="relative px-12 py-5 font-press text-lg md:text-xl text-white overflow-hidden rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] group cursor-pointer"
        >
            <span className="relative z-10 flex items-center justify-center">
                {children}
            </span>

            {/* Animated Border */}
            <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
        </motion.button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 SCROLL INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

function ScrollIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-10 flex flex-col items-center gap-4 cursor-pointer"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                <ChevronDown size={24} className="text-pink-500" />
            </motion.div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-slate-500">EXPLORAR</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-pink-500 to-transparent" />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 STATS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function StatsSection({ stats }: { stats: StatItem[] }) {
    return (
        <section className="relative z-10 py-20 border-y border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="text-center group cursor-default"
                        >
                            <div className={cn("w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", stat.color)}>
                                <stat.icon size={28} className="text-white" />
                            </div>
                            <motion.div
                                className="font-press text-3xl md:text-4xl text-white mb-2"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                <CountUp value={stat.value} />
                            </motion.div>
                            <div className="font-mono text-xs text-slate-500 tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CountUp({ value }: { value: string }) {
    const [displayed, setDisplayed] = useState('0');
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    const suffix = value.replace(/[\d.,]/g, '');

    useEffect(() => {
        if (value === '∞') {
            setDisplayed('∞');
            return;
        }

        let start = 0;
        const duration = 2000;
        const increment = numericValue / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setDisplayed(numericValue.toLocaleString() + suffix);
                clearInterval(timer);
            } else {
                setDisplayed(Math.floor(start).toLocaleString() + suffix);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, numericValue, suffix]);

    return <span>{displayed}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 EVENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function EventsSection({ events, activeEvent, setActiveEvent, currentEvent, navigate, playClick, playHover }: any) {
    return (
        <section className="relative z-20 py-32 min-h-screen flex flex-col justify-center overflow-hidden">
            {/* Background Gradient */}
            <div className={cn("absolute inset-0 opacity-10 transition-all duration-1000 bg-gradient-to-br", currentEvent.color)} />

            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-4 w-full mb-20">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-end gap-6"
                >
                    <div className="h-20 w-2 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full" />
                    <div>
                        <div className="font-mono text-xs text-pink-500 tracking-widest mb-2">// SISTEMA DE EVENTOS</div>
                        <h2 className="font-press text-4xl md:text-6xl text-white">ARENAS ATIVAS</h2>
                    </div>
                </motion.div>
            </div>

            {/* Events Grid */}
            <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Event Info */}
                <div className="order-2 lg:order-1 relative min-h-[500px]">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, x: -80, filter: "blur(20px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 80, filter: "blur(20px)" }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="space-y-8"
                        >
                            {/* Event Badge */}
                            <div className={cn("inline-flex items-center gap-3 px-5 py-2 rounded-full border bg-black/60 backdrop-blur-xl font-mono text-xs tracking-widest", currentEvent.borderColor, currentEvent.textColor)}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                >
                                    <Radio size={14} />
                                </motion.div>
                                {currentEvent.subtitle}
                            </div>

                            {/* Event Title */}
                            <h3
                                className="font-vt323 text-6xl md:text-8xl text-white leading-none tracking-tighter"
                                style={{ textShadow: `0 0 60px ${currentEvent.glowColor}` }}
                            >
                                {currentEvent.title}
                            </h3>

                            {/* Event Description */}
                            <div className="flex gap-4">
                                <div className={cn("w-1 rounded-full bg-gradient-to-b", currentEvent.color)} />
                                <p className="font-mono text-slate-300 text-lg md:text-xl max-w-lg leading-relaxed">
                                    {currentEvent.desc}
                                </p>
                            </div>

                            {/* Event Stats */}
                            <div className="flex gap-8 pt-4">
                                {currentEvent.stats.map((stat: any, i: number) => (
                                    <div key={i} className="text-center">
                                        <div className={cn("font-press text-2xl", currentEvent.textColor)}>{stat.value}</div>
                                        <div className="font-mono text-[10px] text-slate-500 tracking-widest mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <div className="pt-8">
                                <motion.button
                                    onClick={() => {
                                        playClick();
                                        if (currentEvent.external) window.open(currentEvent.link, '_blank');
                                        else navigate('/login');
                                    }}
                                    onMouseEnter={playHover}
                                    whileHover={{ scale: 1.05, x: 10 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "flex items-center gap-3 px-8 py-4 font-press text-lg rounded-xl border bg-white/5 hover:bg-white/10 transition-colors group",
                                        currentEvent.borderColor, currentEvent.textColor
                                    )}
                                >
                                    {currentEvent.external ? 'ACESSAR ARENA' : 'ENTRAR NO SISTEMA'}
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                    {currentEvent.external && <ExternalLink size={16} />}
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination */}
                    <div className="absolute -bottom-16 left-0 flex gap-4 items-center">
                        <span className="font-mono text-xs text-slate-600">
                            {String(activeEvent + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}
                        </span>
                        <div className="flex gap-3">
                            {events.map((_: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { playClick(); setActiveEvent(idx); }}
                                    onMouseEnter={playHover}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        activeEvent === idx
                                            ? "w-12 bg-white shadow-[0_0_15px_white]"
                                            : "w-3 bg-white/20 hover:bg-white/40"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3D Event Card */}
                <div className="order-1 lg:order-2 h-[600px] flex items-center justify-center perspective-[2000px]">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, rotateY: 90, z: -500, scale: 0.8 }}
                            animate={{ opacity: 1, rotateY: 0, z: 0, scale: 1 }}
                            exit={{ opacity: 0, rotateY: -90, z: -500, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
                            className={cn(
                                "relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden group cursor-pointer",
                                "bg-gradient-to-br from-black/80 to-black/40 backdrop-blur-3xl",
                                "border border-white/10 shadow-2xl"
                            )}
                            style={{ transformStyle: "preserve-3d" }}
                            onClick={() => {
                                playClick();
                                if (currentEvent.external) window.open(currentEvent.link, '_blank');
                                else navigate('/login');
                            }}
                        >
                            {/* Card Background Gradient */}
                            <div className={cn("absolute inset-0 opacity-30 bg-gradient-to-br", currentEvent.color)} />

                            {/* Animated Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

                            {/* Card Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={{ transformStyle: "preserve-3d" }}>

                                {/* Giant Background Icon */}
                                <currentEvent.icon
                                    strokeWidth={0.3}
                                    className="absolute -bottom-10 -right-10 w-[400px] h-[400px] text-white/5 rotate-12"
                                />

                                {/* Floating Icon Orb */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="relative mb-12"
                                    style={{ transform: "translateZ(60px)" }}
                                >
                                    <div className={cn("w-40 h-40 rounded-full flex items-center justify-center", "bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl shadow-2xl")}>
                                        <div className={cn("absolute inset-0 rounded-full opacity-40 blur-2xl animate-pulse bg-gradient-to-br", currentEvent.color)} />
                                        <currentEvent.icon className="w-20 h-20 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                                    </div>

                                    {/* Orbiting Dots */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0"
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                    </motion.div>
                                </motion.div>

                                {/* Title */}
                                <motion.h4
                                    className="font-press text-2xl text-white text-center tracking-widest uppercase"
                                    style={{ transform: "translateZ(40px)" }}
                                >
                                    {currentEvent.title}
                                </motion.h4>

                                {/* Decorative Line */}
                                <div className={cn("w-20 h-1 rounded-full mt-4 bg-gradient-to-r", currentEvent.color)} style={{ transform: "translateZ(30px)" }} />

                                {/* Tech Details */}
                                <div className="absolute top-6 left-6 font-mono text-[10px] text-white/40 space-y-1" style={{ transform: "translateZ(20px)" }}>
                                    <div>ID: {currentEvent.id.toUpperCase()}</div>
                                    <div>STATUS: ACTIVE</div>
                                    <div>NET: {currentEvent.external ? 'EXTERNAL' : 'INTERNAL'}</div>
                                </div>

                                {/* Corner Logo */}
                                <div className="absolute bottom-6 right-6" style={{ transform: "translateZ(20px)" }}>
                                    <img src="/assets/etegamificada.png" className="w-10 h-10 opacity-30 group-hover:opacity-60 transition-opacity" />
                                </div>
                            </div>

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: 'transform 0.7s' }} />

                            {/* Border Glow on Hover */}
                            <div className={cn("absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 border-2", currentEvent.borderColor)} style={{ boxShadow: `0 0 40px ${currentEvent.glowColor}, inset 0 0 40px ${currentEvent.glowColor}` }} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 HOUSES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function HousesSection({ houses }: { houses: typeof HOUSES }) {
    const maxPoints = Math.max(...houses.map(h => h.points));

    return (
        <section className="relative z-10 py-32 bg-black/60 backdrop-blur-xl border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="font-mono text-xs text-pink-500 tracking-widest mb-4">// LEADERBOARD EM TEMPO REAL</div>
                    <h2 className="font-press text-4xl md:text-6xl text-white mb-4">GUERRA DAS CASAS</h2>
                    <p className="font-vt323 text-2xl text-slate-400">Quem lidera a batalha?</p>
                </motion.div>

                {/* Houses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {houses.map((house, i) => (
                        <motion.div
                            key={house.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all group cursor-default overflow-hidden"
                        >
                            {/* Background Gradient */}
                            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br", house.color)} />

                            {/* Rank Badge */}
                            <div className={cn(
                                "absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center font-press text-sm",
                                i === 0 ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-slate-500"
                            )}>
                                #{i + 1}
                            </div>

                            {/* House Icon */}
                            <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform", house.color)}>
                                <house.icon size={32} className="text-white" />
                            </div>

                            {/* House Name */}
                            <h3 className="font-press text-xl text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                                {house.name}
                            </h3>

                            {/* Points */}
                            <div className="font-vt323 text-3xl text-white mb-4">
                                {house.points.toLocaleString()} <span className="text-sm text-slate-500">PTS</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${(house.points / maxPoints) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.2 }}
                                    viewport={{ once: true }}
                                    className={cn("h-full rounded-full bg-gradient-to-r", house.color)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 FEATURES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function FeaturesSection({ features, playHover }: { features: typeof FEATURES, playHover: () => void }) {
    return (
        <section className="relative z-10 py-32 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="font-mono text-xs text-pink-500 tracking-widest mb-4">// POWER-UPS DO SISTEMA</div>
                    <h2 className="font-press text-4xl md:text-6xl text-white mb-4">RECURSOS</h2>
                    <p className="font-vt323 text-2xl text-slate-400 max-w-2xl mx-auto">
                        Tudo que você precisa para dominar o jogo
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                            onMouseEnter={playHover}
                            className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-default overflow-hidden"
                        >
                            {/* Background Gradient on Hover */}
                            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br", feature.gradient)} />

                            {/* Icon */}
                            <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all", feature.gradient)}>
                                <feature.icon size={28} className="text-white" />
                            </div>

                            {/* Title */}
                            <h3 className="font-press text-xl text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="font-vt323 text-xl text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                                {feature.desc}
                            </p>

                            {/* Corner Decoration */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="text-white/30" size={20} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 HOW IT WORKS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function HowItWorksSection() {
    const steps = [
        { icon: Lock, title: 'FAÇA LOGIN', desc: 'Entre com suas credenciais escolares' },
        { icon: Target, title: 'COMPLETE MISSÕES', desc: 'Estude, participe, conquiste XP' },
        { icon: Trophy, title: 'SUBA DE NÍVEL', desc: 'Evolua seu personagem e ranking' },
        { icon: Crown, title: 'DOMINE O JOGO', desc: 'Lidere sua Casa à vitória' }
    ];

    return (
        <section className="relative z-10 py-32 bg-black/40 backdrop-blur-xl border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="font-mono text-xs text-pink-500 tracking-widest mb-4">// TUTORIAL</div>
                    <h2 className="font-press text-4xl md:text-6xl text-white mb-4">COMO FUNCIONA</h2>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent hidden lg:block" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                                viewport={{ once: true }}
                                className="relative text-center group"
                            >
                                {/* Step Number */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-pink-500 tracking-widest">
                                    STEP {String(i + 1).padStart(2, '0')}
                                </div>

                                {/* Icon */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center relative z-10 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-shadow"
                                >
                                    <step.icon size={36} className="text-pink-400" />
                                </motion.div>

                                {/* Title */}
                                <h3 className="font-press text-lg text-white mb-2">{step.title}</h3>

                                {/* Description */}
                                <p className="font-vt323 text-lg text-slate-400">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 FINAL CTA SECTION
// ═══════════════════════════════════════════════════════════════════════════

function FinalCTASection({ navigate, playClick, playHover }: any) {
    return (
        <section className="relative z-10 py-40 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-[200px]" />
            </div>

            <div className="max-w-4xl mx-auto px-4 text-center relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="font-mono text-xs text-pink-500 tracking-widest">// READY PLAYER ONE?</div>

                    <h2 className="font-press text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
                        PRONTO PARA<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
                            ENTRAR NO JOGO?
                        </span>
                    </h2>

                    <p className="font-vt323 text-2xl text-slate-400 max-w-2xl mx-auto">
                        Milhares de alunos já estão jogando. Sua jornada começa agora.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        viewport={{ once: true }}
                        className="pt-8"
                    >
                        <UltraButton onClick={() => { playClick(); navigate('/login'); }} onMouseEnter={playHover}>
                            <Rocket className="inline-block mr-3" size={20} />
                            COMEÇAR AGORA
                            <ChevronRight className="inline-block ml-2" size={20} />
                        </UltraButton>
                    </motion.div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-8 pt-12 opacity-50">
                        {[Shield, Award, Star].map((Icon, i) => (
                            <div key={i} className="flex items-center gap-2 font-mono text-xs text-slate-500">
                                <Icon size={16} />
                                {['SEGURO', 'PREMIADO', 'AVALIADO'][i]}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 ULTRA FOOTER
// ═══════════════════════════════════════════════════════════════════════════

function UltraFooter() {
    return (
        <footer className="relative z-10 border-t border-white/5 bg-[#030303] py-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-4 mb-6">
                            <img src="/assets/etegamificada.png" className="w-12 h-12" />
                            <div>
                                <div className="font-press text-lg text-white">ETE GAMIFICADA</div>
                                <div className="font-mono text-[10px] text-pink-500 tracking-widest">PROTOCOL OMEGA</div>
                            </div>
                        </div>
                        <p className="font-vt323 text-lg text-slate-500 max-w-sm">
                            Transformando a educação através da gamificação. Cada passo conta. Cada conquista importa.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <div className="font-mono text-xs text-slate-500 tracking-widest mb-4">NAVEGAÇÃO</div>
                        <div className="space-y-3">
                            {['Home', 'Eventos', 'Ranking', 'Loja'].map(link => (
                                <div key={link} className="font-vt323 text-lg text-slate-400 hover:text-white cursor-pointer transition-colors">
                                    {link}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <div className="font-mono text-xs text-slate-500 tracking-widest mb-4">SOCIAL</div>
                        <div className="flex gap-4">
                            {[Globe, Users, Gamepad2].map((Icon, i) => (
                                <div key={i} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-pink-500/20 transition-colors cursor-pointer">
                                    <Icon size={18} className="text-slate-400 hover:text-pink-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="font-mono text-xs text-slate-600">
                        &copy; {new Date().getFullYear()} ETE GAMIFICADA. TODOS OS DIREITOS RESERVADOS.
                    </div>
                    <div className="font-mono text-xs text-slate-600 flex items-center gap-2">
                        DESENVOLVIDO COM <Heart size={12} className="text-pink-500 fill-pink-500" /> POR
                        <span className="text-pink-500 hover:text-pink-400 cursor-pointer">@TH7</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}