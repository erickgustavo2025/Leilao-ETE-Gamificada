// frontend/src/pages/public/home/components/FeaturesGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FEATURES } from '../constants';
import { ChevronRight } from 'lucide-react';
import { useGameSound } from '../../../../hooks/useGameSound';

const FeaturesGrid = React.memo(() => {
    const { playHover } = useGameSound();

    return (
      <section id="loja" className="relative z-10 py-32 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feature, i) => (
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
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${feature.gradient}`} />
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all ${feature.gradient}`}>
                                <feature.icon size={28} className="text-white" />
                            </div>
                            <h3 className="font-press text-xl text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                                {feature.title}
                            </h3>
                            <p className="font-vt323 text-xl text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                                {feature.desc}
                            </p>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="text-white/30" size={20} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
});

export default FeaturesGrid;