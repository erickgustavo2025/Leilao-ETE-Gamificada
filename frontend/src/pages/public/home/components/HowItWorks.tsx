// frontend/src/pages/public/home/components/HowItWorks.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Target, Trophy, Crown } from 'lucide-react';

const STEPS = [
    { icon: Lock, title: 'FAÇA LOGIN', desc: 'Entre com suas credenciais escolares' },
    { icon: Target, title: 'COMPLETE MISSÕES', desc: 'Estude, participe, conquiste PC$' },
    { icon: Trophy, title: 'SUBA DE NÍVEL', desc: 'Evolua seu ranking' },
    { icon: Crown, title: 'DOMINE O JOGO', desc: 'Lidere sua Casa à vitória' }
];

const HowItWorksSection = React.memo(() => {
    return (
        <section className="relative z-10 py-32 bg-black/40 backdrop-blur-xl border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="font-mono text-xs text-pink-500 tracking-widest mb-4">// TUTORIAL</div>
                    <h2 className="font-press text-4xl md:text-6xl text-white mb-4">COMO FUNCIONA</h2>
                </motion.div>

                <div className="relative">
                    {/* Linha Conectora (Desktop) */}
                    <div className="absolute top-12 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent hidden lg:block" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                                viewport={{ once: true }}
                                className="relative text-center group"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[10px] text-pink-500 tracking-widest bg-black px-2 z-20">
                                    STEP {String(i + 1).padStart(2, '0')}
                                </div>

                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center relative z-10 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.3)] transition-shadow bg-black"
                                >
                                    <step.icon size={36} className="text-pink-400" />
                                </motion.div>

                                <h3 className="font-press text-lg text-white mb-2">{step.title}</h3>
                                <p className="font-vt323 text-xl text-slate-400 leading-tight">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});

export default HowItWorksSection;