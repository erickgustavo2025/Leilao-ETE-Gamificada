import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, BookOpen, Recycle, ExternalLink, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PixelCard } from '../ui/PixelCard';
import { cn } from '../../utils/cn';

interface EventsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EventsModal({ isOpen, onClose }: EventsModalProps) {
    const navigate = useNavigate();

    const EVENTS = [
        {
            id: 'TACA',
            title: 'TAÇA DAS CASAS',
            desc: 'A competição suprema. Pontue, vença e conquiste a glória eterna.',
            icon: Trophy,
            color: 'text-yellow-400',
            bg: 'bg-yellow-900/20',
            border: 'border-yellow-500',
            action: () => { onClose(); navigate('/taca-das-casas'); },
            btnText: 'ACESSAR AGORA'
        },
        {
            id: 'INTERGIL',
            title: 'INTERGIL 2026',
            desc: 'O maior evento esportivo. Confira tabelas, jogos e resultados ao vivo.',
            icon: Globe,
            color: 'text-red-400',
            bg: 'bg-red-900/20',
            border: 'border-red-500',
            action: () => window.open('http://89.116.73.177:3000/', '_blank'),
            btnText: 'VISITAR SITE',
            isExternal: true
        },
        {
            id: 'GINCANA',
            title: 'GINCANA ECOLÓGICA',
            desc: 'Transforme atitude sustentável em pontos. O planeta e sua casa agradecem.',
            icon: Recycle,
            color: 'text-green-400',
            bg: 'bg-green-900/20',
            border: 'border-green-500',
            action: () => { onClose(); navigate('/coming-soon?module=GINCANA ECOLÓGICA'); },
            btnText: 'EM BREVE'
        },
        {
            id: 'LEITURARTE',
            title: 'LEITURARTE',
            desc: 'Onde a arte encontra a literatura. Expresse sua criatividade.',
            icon: BookOpen,
            color: 'text-blue-400',
            bg: 'bg-blue-900/20',
            border: 'border-blue-500',
            action: () => { onClose(); navigate('/coming-soon?module=LEITURARTE'); },
            btnText: 'EM BREVE'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                // O fundo aparece de forma suave
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
                    onClick={onClose}
                >
                    {/* O Modal surge levemente depois do fundo, usando um efeito mola (spring) macio */}
                    <motion.div 
                        initial={{ scale: 0.98, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            delay: 0.05 // Deixa o fundo escurecer primeiro
                        }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-5xl h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl relative"
                    >
                        {/* Header Fixo */}
                        <div className="flex-shrink-0 flex justify-between items-start p-6 md:p-8 border-b border-white/5 bg-[#09090b]">
                            <div>
                                <h2 className="font-press text-xl md:text-3xl text-white uppercase">
                                    <span className="text-purple-500">EVENTOS</span> DISPONÍVEIS
                                </h2>
                                <p className="font-mono text-xs text-slate-400 mt-2">
                                    Selecione para onde deseja ir.
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors shrink-0 ml-4">
                                <X className="text-white" size={20} />
                            </button>
                        </div>

                        {/* Corpo com Scroll Suave */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {EVENTS.map((evt, idx) => (
                                    <motion.div
                                        key={evt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (idx * 0.05) }} // Cascata suave nos cards
                                        className="h-full"
                                    >
                                        <PixelCard 
                                            className={cn(
                                                "flex flex-col p-6 hover:scale-[1.02] transition-transform cursor-pointer border-2 min-h-[300px] h-full", 
                                                evt.bg, evt.border
                                            )} 
                                            onClick={evt.action}
                                        >
                                            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 bg-black/40", evt.border)}>
                                                <evt.icon size={32} className={evt.color} />
                                            </div>

                                            <h3 className={cn("font-press text-[11px] mb-2 leading-tight uppercase", evt.color)}>
                                                {evt.title}
                                            </h3>
                                            
                                            <p className="font-vt323 text-lg text-slate-300 leading-tight mb-6 flex-1">
                                                {evt.desc}
                                            </p>

                                            <button className="w-full py-3 font-press text-[9px] rounded flex items-center justify-center gap-2 bg-black/40 border border-white/10 text-white mt-auto">
                                                {evt.btnText}
                                                {evt.isExternal && <ExternalLink size={12} />}
                                            </button>
                                        </PixelCard>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}