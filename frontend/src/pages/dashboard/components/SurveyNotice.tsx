import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Award, Zap, ChevronRight } from 'lucide-react';
import { api } from '../../../api/axios-config';
import { motion } from 'framer-motion';

export function SurveyNotice() {
    const navigate = useNavigate();

    const { data: status, isLoading } = useQuery({
        queryKey: ['survey', 'notice'],
        queryFn: async () => {
            const res = await api.get('/surveys/active');
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // 5 minutos
    });

    if (isLoading || !status?.available) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 border border-blue-500/30 rounded-3xl p-6 mb-8 backdrop-blur-md group cursor-pointer hover:border-blue-400/50 transition-all"
            onClick={() => navigate('/dashboard/pesquisa')}
        >
            {/* Efeitos de Fundo */}
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <Zap size={60} className="text-blue-500/20 -rotate-12" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Award className="text-blue-400" size={32} />
                    </div>
                    <div>
                        <h3 className="font-vt323 text-3xl text-white leading-none mb-1">Missão Científica Disponível!</h3>
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                            Responda à pesquisa acadêmica e resgate <span className="text-yellow-400 font-bold">+{status.survey?.rewardAmount || 100} PC$</span> na hora.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-500 text-white font-press text-[10px] px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all">
                    ACEITAR MISSÃO
                    <ChevronRight size={16} />
                </div>
            </div>

            {/* Linha de Progresso Fake Decorativa */}
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500/50 w-full overflow-hidden">
                <motion.div 
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-blue-400"
                />
            </div>
        </motion.div>
    );
}
