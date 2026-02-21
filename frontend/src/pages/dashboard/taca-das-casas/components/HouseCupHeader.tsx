// ARQUIVO: frontend/src/pages/dashboard/taca-das-casas/components/HouseCupHeader.tsx
import { motion } from 'framer-motion';
import { Trophy, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

export function HouseCupHeader() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative z-20 mb-8"
        >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
            
            <div className="relative backdrop-blur-xl bg-black/40 border-b-2 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
                    
                    {/* ESQUERDA: Título + Subtítulo (Fica fixo aqui igual ao original) */}
                  <div className="flex items-center gap-4 pl-14 md:pl-0">
                         <div className="flex flex-col">
                            <motion.h1 
                                className="font-press text-xl md:text-3xl text-yellow-500 leading-none drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] tracking-wider"
                                animate={{ 
                                    textShadow: [
                                        '0 0 15px rgba(234,179,8,0.6)',
                                        '0 0 25px rgba(234,179,8,0.9)',
                                        '0 0 15px rgba(234,179,8,0.6)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                TAÇA DAS CASAS
                            </motion.h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Sparkles size={12} className="text-purple-400 animate-pulse" />
                                <p className="font-vt323 text-sm md:text-lg text-purple-300 tracking-wide">
                                    A GLÓRIA ETERNA AGUARDA
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DIREITA: User Info (Só PC) + Troféu */}
                    <div className="flex items-center gap-6">
                        
                        {/* User Info - SOMENTE PC (hidden no mobile) */}
                        {user ? (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="hidden md:flex items-center gap-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg px-4 py-2 backdrop-blur-sm"
                            >
                                <div className="text-right">
                                    <p className="font-vt323 text-lg text-white leading-none">
                                        {user.nome}
                                    </p>
                                    <p className="font-press text-[10px] text-purple-300">
                                        {user.turma || 'SEM CASA'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                    <span className="font-press text-xs text-black">
                                        {user.nome?.[0] || '?'}
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                onClick={() => navigate('/login')}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-600 text-black font-press text-xs rounded-lg border-2 border-yellow-400"
                            >
                                <LogIn size={16} />
                                <span>ENTRAR</span>
                            </motion.button>
                        )}

                        {/* Troféu Animado (Sempre visível na direita) */}
                        <motion.div
                            animate={{ 
                                rotate: [0, -10, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50" />
                            <Trophy 
                                size={40} 
                                className="relative text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]" 
                                strokeWidth={2.5}
                            />
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* Borda Decorativa */}
            <motion.div 
                className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
                animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
        </motion.header>
    );
}