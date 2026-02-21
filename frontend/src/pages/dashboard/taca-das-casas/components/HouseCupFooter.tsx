import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Scroll, 
    Shield, 
    BookOpen, 
    Sparkles,
    Heart,
    ExternalLink,
    Mail,
    MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../api/axios-config'; // <--- Import da API

export function HouseCupFooter() {
    const navigate = useNavigate();

    // Estado para os números
    const [stats, setStats] = useState({
        casas: 12,
        alunos: '...',
        itens: 150,
        pontos: '∞'
    });

    // Buscar dados reais ao carregar
    useEffect(() => {
        api.get('/house/stats')
            .then(res => {
                setStats({
                    casas: res.data.casas || 12,
                    // Formata números grandes (ex: 2800 -> 2.8K)
                    alunos: res.data.alunos > 1000 
                        ? (res.data.alunos / 1000).toFixed(1) + 'K+' 
                        : res.data.alunos,
                    itens: res.data.itens || 150,
                    pontos: '∞'
                });
            })
            .catch(err => console.error("Erro silencioso ao carregar stats do footer", err));
    }, []);

    const navLinks = [
        { label: 'Beco Diagonal', path: '/taca-das-casas/beco-diagonal', icon: Scroll },
        { label: 'Inventário', path: '/taca-das-casas/mochila', icon: BookOpen },
        { label: 'Punições', path: '/taca-das-casas/punicoes', icon: Shield },
        { label: 'Histórico', path: '/taca-das-casas/historico', icon: Sparkles },
    ];

    return (
        <footer className="relative z-10 mt-20 border-t-2 border-yellow-500/20 bg-black/60 backdrop-blur-xl">
            {/* Top Glow Effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    
                    {/* LEFT: Branding & School Info */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-4"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-30" />
                                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                    <Shield size={32} className="text-black" fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-press text-lg text-yellow-400 leading-none mb-1">
                                    TAÇA DAS CASAS
                                </h3>
                               
                            </div>
                        </motion.div>
                        
                        <p className="font-vt323 text-lg text-slate-400 leading-relaxed">
                            A competição suprema entre as Casas. Cada ação conta pontos. 
                            Cada vitória ecoa na eternidade. A glória espera os dignos.
                        </p>

                        {/* School Info - Link para o Google Maps */}
                        <motion.a 
                            href="https://maps.app.goo.gl/RzfdXBPPRw5qX2o39" 
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ x: 5, color: '#facc15' }}
                            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors cursor-pointer group"
                        >
                            <MapPin size={16} className="text-purple-400 group-hover:text-yellow-400 transition-colors" />
                            <span className="font-mono text-xs">
                                ETE Advogado José David Gil Rodrigues - PE
                            </span>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.a>
                    </div>

                    {/* CENTER: Navigation */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-slate-500 tracking-widest uppercase mb-4">
                            // NAVEGAÇÃO RÁPIDA
                        </h4>
                        <div className="space-y-3">
                            {navLinks.map((link, i) => (
                                <motion.button
                                    key={link.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ x: 5, color: '#facc15' }}
                                    onClick={() => navigate(link.path)}
                                    className="flex items-center gap-3 text-slate-400 hover:text-yellow-400 transition-colors font-vt323 text-xl group"
                                >
                                    <link.icon 
                                        size={18} 
                                        className="text-purple-500 group-hover:text-yellow-500 transition-colors" 
                                    />
                                    {link.label}
                                    <ExternalLink 
                                        size={14} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity" 
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Stats & System Info (AGORA DINÂMICO) */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-slate-500 tracking-widest uppercase mb-4">
                            // SOBRE O SISTEMA
                        </h4>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Casas Ativas', value: stats.casas },
                                { label: 'Alunos', value: stats.alunos },
                                { label: 'Itens Mágicos', value: `${stats.itens}+` },
                                { label: 'Pontos/Mês', value: stats.pontos },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center group hover:bg-purple-900/40 hover:border-purple-400/50 transition-all"
                                >
                                    <div className="font-press text-xl text-yellow-400 mb-1 group-hover:scale-110 transition-transform">
                                        {stat.value}
                                    </div>
                                    <div className="font-mono text-[9px] text-slate-500 tracking-wide uppercase">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Contact */}
                        <motion.a
                            href="mailto:etegamificada@gmail.com"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors mt-4 font-mono text-xs"
                        >
                            <Mail size={14} />
                            Suporte & Feedback
                        </motion.a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="font-mono text-xs text-slate-600 flex items-center gap-2">
                        <Sparkles size={12} className="text-purple-500" />
                        <span>
                            © {new Date().getFullYear()} ETE GAMIFICADA. 
                            TODOS OS DIREITOS RESERVADOS.
                        </span>
                    </div>
                    
                    <div className="font-mono text-xs text-slate-600 flex items-center gap-2">
                        DESENVOLVIDO COM 
                        <Heart size={12} className="text-pink-500 fill-pink-500 animate-pulse" /> 
                        POR
                        <motion.span 
                            whileHover={{ scale: 1.1, color: '#ec4899' }}
                            className="text-pink-500 hover:text-pink-400 cursor-pointer font-bold"
                        >
                            ALUNOS
                        </motion.span>
                    </div>
                </div>

                {/* Decorative Floating Sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                scale: [0, 1.5, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </footer>
    );
}