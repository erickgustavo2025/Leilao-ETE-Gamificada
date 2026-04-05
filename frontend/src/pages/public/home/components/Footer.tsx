import React from 'react';
import { Heart, Instagram } from 'lucide-react'; // Importei o Instagram direto
import { useNavigate } from 'react-router-dom';

const Footer = React.memo(() => {
    const navigate = useNavigate();

    const handleScroll = (id: string) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="relative z-10 border-t border-white/5 bg-[#030303] py-16">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-4 mb-6">
                            <img src="/assets/etegamificada.png" className="w-12 h-12" alt="Logo" />
                            <div>
                                <div className="font-press text-lg text-white">ETE GAMIFICADA</div>
                            </div>
                        </div>
                        <p className="font-vt323 text-lg text-slate-500 max-w-sm">
                            Transformando a educação através da gamificação. Cada passo conta. Cada conquista importa.
                        </p>
                    </div>

                    {/* Navegação */}
                    <div>
                        <div className="font-mono text-xs text-slate-500 tracking-widest mb-4">NAVEGAÇÃO</div>
                        <div className="space-y-3">
                            <button onClick={() => handleScroll('top')} className="block font-vt323 text-lg text-slate-400 hover:text-white transition-colors">HOME</button>
                            <button onClick={() => handleScroll('eventos')} className="block font-vt323 text-lg text-slate-400 hover:text-white transition-colors">EVENTOS</button>
                            <button onClick={() => handleScroll('ranking')} className="block font-vt323 text-lg text-slate-400 hover:text-white transition-colors">RANKING</button>
                            <button onClick={() => navigate('/login')} className="block font-vt323 text-lg text-slate-400 hover:text-white transition-colors">LOGIN</button>
                        </div>
                    </div>

                    {/* Social (Só Instagram Agora) */}
                    <div>
                        <div className="font-mono text-xs text-slate-500 tracking-widest mb-4">SOCIAL</div>
                        <div className="flex gap-4">
                            <a 
                                href="https://www.instagram.com/etegamificada/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-pink-500/20 transition-colors cursor-pointer group"
                                title="Siga no Instagram"
                            >
                                <Instagram size={18} className="text-slate-400 group-hover:text-pink-400 transition-colors" />
                            </a>
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
                        <span className="text-pink-500 hover:text-pink-400 cursor-pointer">Alunos</span>
                    </div>
                </div>
            </div>
        </footer>
    );
});

export default Footer;