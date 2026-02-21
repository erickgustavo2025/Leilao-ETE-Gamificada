import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 👇 IMPORTAMOS A INTERFACE EventItem AQUI
import { EVENTS, type EventItem } from '../constants'; 
import { Radio, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/cn';

export default function EventsCarousel() {
    const [activeEvent, setActiveEvent] = useState(0);
    const navigate = useNavigate();
    
    // 👇 FORÇAMOS A TIPAGEM AQUI
    const currentEvent: EventItem = EVENTS[activeEvent];

    // Auto-play
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveEvent(prev => (prev + 1) % EVENTS.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="eventos" className="relative z-20 py-32 min-h-screen flex flex-col justify-center overflow-hidden">
            <div className={cn("absolute inset-0 opacity-10 transition-all duration-1000 bg-gradient-to-br", currentEvent.color)} />
            
            <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Texto e Info */}
                <div className="order-2 lg:order-1 relative min-h-[500px]">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, x: -80, filter: "blur(20px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 80, filter: "blur(20px)" }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div className={cn("inline-flex items-center gap-3 px-5 py-2 rounded-full border bg-black/60 backdrop-blur-xl font-mono text-xs tracking-widest", currentEvent.borderColor, currentEvent.textColor)}>
                                <Radio size={14} className="animate-spin-slow" /> {currentEvent.subtitle}
                            </div>
                            
                            <h3 className="font-vt323 text-6xl md:text-8xl text-white leading-none tracking-tighter" style={{ textShadow: `0 0 60px ${currentEvent.glowColor}` }}>
                                {currentEvent.title}
                            </h3>

                            <div className="flex gap-4">
                                <div className={cn("w-1 rounded-full bg-gradient-to-b", currentEvent.color)} />
                                <p className="font-mono text-slate-300 text-lg md:text-xl max-w-lg leading-relaxed">{currentEvent.desc}</p>
                            </div>

                            {/* Botão Dinâmico */}
                            <button 
                                onClick={() => {
                                    if (currentEvent.external) {
                                        window.open(currentEvent.link, '_blank');
                                    } else {
                                        navigate(currentEvent.link);
                                    }
                                }} 
                                className={cn("flex items-center gap-3 px-8 py-4 font-press text-lg rounded-xl border bg-white/5 hover:bg-white/10 transition-colors group", currentEvent.borderColor, currentEvent.textColor)}
                            >
                                {/* 👇 AGORA ELE VAI RECONHECER O btnText */}
                                {currentEvent.btnText || 'ACESSAR'} 
                                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                {currentEvent.external && <ExternalLink size={16} />}
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    {/* Paginação */}
                    <div className="absolute -bottom-16 left-0 flex gap-4 items-center">
                        <span className="font-mono text-xs text-slate-600">
                            {String(activeEvent + 1).padStart(2, '0')} / {String(EVENTS.length).padStart(2, '0')}
                        </span>
                        <div className="flex gap-3">
                            {EVENTS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveEvent(idx)}
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

                {/* Card 3D */}
                <div className="order-1 lg:order-2 h-[600px] flex items-center justify-center">
                      <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn("relative w-full max-w-md aspect-[3/4] rounded-3xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center")}
                        >
                             <currentEvent.icon size={100} className="text-white opacity-80 mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
                             <h4 className="font-press text-2xl text-white uppercase tracking-widest">{currentEvent.title}</h4>
                             <div className={cn("w-20 h-1 rounded-full mt-4 bg-gradient-to-r", currentEvent.color)} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}