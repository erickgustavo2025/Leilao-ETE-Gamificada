// frontend/src/pages/public/home/index.tsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { useScroll, useSpring, motion } from 'framer-motion'; // Import motion
import { useNavigate } from 'react-router-dom';

// Componentes
import { UltraLoadingScreen } from './components/LoadingScreen';
import { HeroSection } from './components/HeroSection';
import { CustomCursor } from './components/CustomCursor';
import { BackgroundLayers } from './components/BackgroundLayers';
import FloatingShapes from './components/FloatingShapes';
import { UltraNavbar } from './components/Navbar'; 

const StatsSection = lazy(() => import('./components/StatsSection'));
const EventsCarousel = lazy(() => import('./components/EventsCarousel'));
const HousesLeaderboard = lazy(() => import('./components/HousesLeaderboard'));
const FeaturesGrid = lazy(() => import('./components/FeaturesGrid'));
const HowItWorksSection = lazy(() => import('./components/HowItWorks'));
const Footer = lazy(() => import('./components/Footer'));

import { useGameSound } from '../../../hooks/useGameSound';

export function LandingPage() {
    const navigate = useNavigate();
    const { playClick, playHover } = useGameSound();

    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Scroll Progress Global
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsLoaded(true), 500);
                    return 100;
                }
                return prev + 10;
            });
        }, 80);
        return () => clearInterval(timer);
    }, []);

    if (!isLoaded) return <UltraLoadingScreen progress={progress} />;

    return (
        <div className="bg-[#030303] text-white overflow-x-hidden relative cursor-none min-h-screen">
            <CustomCursor />
            
            <div className="fixed inset-0 z-0">
                <BackgroundLayers />
                <FloatingShapes />
            </div>

            {/* Barra de Progresso de Leitura (CORRIGIDA) */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 z-[100] origin-left" 
                style={{ scaleX }} 
            />

            {/* Navbar Global */}
            <UltraNavbar 
                navigate={navigate} 
                playClick={playClick} 
                playHover={playHover} 
            />

            <main className="relative z-10">
                <HeroSection />

                <Suspense fallback={<div className="h-40 flex items-center justify-center font-press text-xs text-slate-500">CARREGANDO MÓDULOS...</div>}>
                    <StatsSection />
                    <EventsCarousel />
                    <HousesLeaderboard />
                    <FeaturesGrid />
                    <HowItWorksSection />
                    <Footer />
                </Suspense>
            </main>
        </div>
    );
}