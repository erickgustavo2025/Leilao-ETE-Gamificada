import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Hammer, Paintbrush } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import { PixelButton } from '../components/ui/PixelButton';

export function ComingSoon() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const moduleName = searchParams.get('module') || 'NOVIDADE';

    return (
        <PageTransition className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Animado */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-yellow-500/20 w-1 h-20 rounded-full"
                        style={{ left: `${i * 10}%`, top: '-20%' }}
                        animate={{ top: '120%' }}
                        transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                    />
                ))}
            </div>

            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-2xl w-full bg-black/60 backdrop-blur-xl border-4 border-yellow-500/50 rounded-3xl p-12 text-center relative shadow-[0_0_100px_rgba(234,179,8,0.2)]"
            >
                {/* Ícones Flutuantes */}
                <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }} 
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-10 -left-10 bg-slate-900 border-4 border-yellow-500 p-6 rounded-full shadow-xl"
                >
                    <Hammer size={40} className="text-yellow-400" />
                </motion.div>
                
                <motion.div 
                    animate={{ rotate: [0, -10, 10, 0] }} 
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -bottom-10 -right-10 bg-slate-900 border-4 border-blue-500 p-6 rounded-full shadow-xl"
                >
                    <Paintbrush size={40} className="text-blue-400" />
                </motion.div>

                {/* Conteúdo */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-full">
                        <Construction className="text-yellow-400 animate-pulse" size={20} />
                        <span className="font-mono text-yellow-200 text-sm tracking-widest uppercase">EM DESENVOLVIMENTO</span>
                    </div>

                    <h1 className="font-press text-3xl md:text-5xl text-white uppercase leading-relaxed drop-shadow-lg">
                        {moduleName}
                    </h1>

                    <p className="font-vt323 text-2xl text-slate-400 leading-relaxed max-w-lg mx-auto">
                        Nossos goblins desenvolvedores estão forjando este módulo nas chamas do código.
                        <br/>
                        <span className="text-yellow-400 block mt-2">O lançamento será lendário!</span>
                    </p>

                    <div className="pt-8">
                        <PixelButton 
                            onClick={() => navigate(-1)} 
                            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600 w-full md:w-auto px-12 py-4 text-sm"
                        >
                            <ArrowLeft className="mr-2" size={18} />
                            VOLTAR PARA A BASE
                        </PixelButton>
                    </div>
                </div>
            </motion.div>
        </PageTransition>
    );
}