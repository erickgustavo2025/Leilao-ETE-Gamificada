import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ClipboardList, CheckCircle2, 
    Loader2, Award, Zap, AlertCircle, ArrowLeft, Info
} from 'lucide-react';
import { api } from '../../api/axios-config';
import { PageTransition } from '../../components/layout/PageTransition';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// --- TIPOS ---
interface Question {
    id: string;
    text: string;
    type: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'boolean';
    options?: string[];
    required: boolean;
}

interface Survey {
    _id: string;
    title: string;
    description: string;
    rewardAmount: number;
    questions: Question[];
}

interface SurveyStatus {
    available: boolean;
    alreadyDone?: boolean;
    survey?: Survey;
}

export function ResearchSurvey() {
    const queryClient = useQueryClient();
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch Pesquisa Ativa
    const { data: status, isLoading } = useQuery<SurveyStatus>({
        queryKey: ['survey', 'active'],
        queryFn: async () => {
            const res = await api.get('/surveys/active');
            return res.data;
        }
    });

    // 2. Mutação de Envio
    const submitMutation = useMutation({
        mutationFn: (payload: any) => api.post('/surveys/submit', payload),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Pesquisa enviada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['survey', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Erro ao enviar pesquisa.');
        }
    });

    const handleAnswer = (qid: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qid]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!status?.survey) return;

        // Validação mínima de campos obrigatórios
        const missing = status.survey.questions.filter(q => q.required && !answers[q.id]);
        if (missing.length > 0) {
            toast.error(`Por favor, responda: ${missing[0].text}`);
            return;
        }

        setIsSubmitting(true);
        submitMutation.mutate({
            surveyId: status.survey._id,
            answers
        });
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="font-press text-[10px] text-blue-400 mt-4 uppercase">Carregando Formulário Científico...</p>
            </div>
        );
    }

    if (status?.alreadyDone) {
        return (
            <div className="min-h-screen bg-[#050505] p-4 md:p-8 pt-24">
                <div className="max-w-2xl mx-auto mt-12 text-center p-8 bg-black/40 border border-emerald-500/30 rounded-3xl backdrop-blur-md">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="font-vt323 text-4xl text-white mb-2">Contribuição Concluída!</h2>
                    <p className="text-slate-400 font-mono text-sm mb-6">
                        Você já respondeu a esta pesquisa e resgatou sua recompensa. 
                        Obrigado por ajudar no desenvolvimento da ETE Gamificada!
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        className="font-press text-[10px] bg-slate-800 text-white px-6 py-3 rounded-full hover:bg-slate-700 transition-all"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!status?.available || !status.survey) {
        return (
            <div className="min-h-screen bg-[#050505] p-4 md:p-8 pt-24 text-center">
                <div className="max-w-2xl mx-auto mt-12 p-8 bg-black/40 border border-slate-800 rounded-3xl">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h2 className="font-press text-[10px] text-slate-400 uppercase">Nenhuma pesquisa disponível no momento.</h2>
                    <p className="text-slate-500 font-mono text-xs mt-4">Fique atento às notificações para novos prêmios.</p>
                </div>
            </div>
        );
    }

    const { survey } = status;

    return (
        <PageTransition className="min-h-screen bg-[#050505] text-slate-300 p-4 md:p-8 pt-20 md:pt-32">
            <div className="max-w-3xl mx-auto pb-20">
                {/* 🚀 AVISO PARA NOVATOS / VOLTAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                            <Info size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-press text-blue-400 uppercase tracking-tighter">Novato por aqui?</p>
                            <p className="text-xs text-slate-400 font-mono">Recomendamos explorar as ferramentas do site antes de responder.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white rounded-xl transition-all font-mono text-[10px] uppercase tracking-widest group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar e Explorar
                    </button>
                </div>
                {/* Header Dinâmico */}
                <div className="relative mb-8 md:mb-12 p-6 md:p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 px-3 py-1 rounded-full animate-pulse">
                            <Zap size={14} className="text-yellow-400" />
                            <span className="font-vt323 text-xl text-yellow-400">+{survey.rewardAmount} PC$</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 mb-6">
                        <div className="p-2 md:p-3 bg-blue-500/20 rounded-xl md:rounded-2xl border border-blue-500/30">
                            <ClipboardList className="text-blue-400" size={20} />
                        </div>
                        <h1 className="font-vt323 text-3xl md:text-5xl text-white leading-none capitalize">{survey.title}</h1>
                    </div>
                    <p className="text-slate-300 font-mono text-sm leading-relaxed max-w-xl">
                        {survey.description || 'Sua opinião é fundamental para validarmos o uso da Inteligência Artificial no ensino técnico. Responda com sinceridade e ajude a ciência acadêmica!'}
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {survey.questions.map((q, index) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={q.id} 
                            className="p-6 bg-slate-900/40 border border-slate-800 rounded-[1.5rem] hover:border-blue-500/40 transition-all group"
                        >
                            <label className="block mb-4">
                                <span className="flex items-center gap-2 text-blue-400 font-mono text-[10px] uppercase tracking-widest mb-2">
                                    Questão {index + 1}
                                    {q.required && <span className="text-rose-500 text-lg">*</span>}
                                </span>
                                <span className="text-lg text-white font-vt323 leading-tight">{q.text}</span>
                            </label>

                            {/* TIPOS DE INPUT */}
                            {q.type === 'rating' && (
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleAnswer(q.id, val)}
                                            className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl border flex items-center justify-center transition-all ${
                                                answers[q.id] === val 
                                                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                        >
                                            <span className="font-press text-[9px] md:text-[10px]">{val}</span>
                                        </button>
                                    ))}
                                    <div className="flex flex-row md:flex-col items-center md:items-start md:justify-center gap-3 md:gap-0 mt-2 md:mt-0 ml-0 md:ml-4 text-[8px] md:text-[9px] font-mono text-slate-500 uppercase w-full md:w-auto">
                                        <span>5 = Muito Bom</span>
                                        <span className="md:hidden">|</span>
                                        <span>1 = Ruim</span>
                                    </div>
                                </div>
                            )}

                            {q.type === 'multiple_choice' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options?.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleAnswer(q.id, opt)}
                                            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                                answers[q.id] === opt
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers[q.id] === opt ? 'border-white' : 'border-slate-700'}`}>
                                                {answers[q.id] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="font-mono text-sm">{opt}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'boolean' && (
                                <div className="flex gap-4">
                                    {['Sim', 'Não'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleAnswer(q.id, opt)}
                                            className={`px-8 py-3 rounded-2xl border font-press text-[10px] transition-all ${
                                                answers[q.id] === opt
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                : 'bg-slate-900/50 border-slate-800 text-slate-500'
                                            }`}
                                        >
                                            {opt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'text' && (
                                <textarea
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white font-mono text-sm focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                    placeholder="Sua resposta..."
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                                />
                            )}
                        </motion.div>
                    ))}

                    <div className="pt-8 block">
                        <button
                            type="submit"
                            disabled={isSubmitting || submitMutation.isPending}
                            className="w-full group relative p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[1.5rem] font-press text-[12px] text-white uppercase tracking-tighter shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center justify-center gap-3">
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} className="group-hover:rotate-12 transition-transform" /> }
                                FINALIZAR E RESGATAR {survey.rewardAmount} PC$
                            </span>
                        </button>
                        <p className="text-center text-slate-500 font-mono text-[9px] mt-6 tracking-widest uppercase">
                            AO ENVIAR, VOCÊ CONCORDA COM O USO DOS DADOS PARA FINS CIENTÍFICOS ANONIMIZADOS.
                        </p>
                    </div>
                </form>
            </div>
        </PageTransition>
    );
}
