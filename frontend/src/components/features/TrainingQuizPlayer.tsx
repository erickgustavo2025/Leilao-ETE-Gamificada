import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Timer, ChevronRight, Award, 
    X, AlertCircle, Trophy 
} from 'lucide-react';
import { api } from '../../api/axios-config';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { useQuery } from '@tanstack/react-query';

interface TrainingQuizPlayerProps {
    quizId: string;
    onClose: () => void;
    onComplete?: (result: any) => void;
}

export function TrainingQuizPlayer({ quizId, onClose, onComplete }: TrainingQuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [startTime] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. BUsca dados do simulado
    const { data: quiz, isLoading } = useQuery({
        queryKey: ['training-quiz', quizId],
        queryFn: async () => {
            const res = await api.get(`/professor/training-quizzes/${quizId}`);
            return res.data;
        }
    });

    // 2. Configura cronômetro dinâmico baseado na dificuldade
    useEffect(() => {
        if (quiz) {
            const timePerQuestion = 
                quiz.dificuldade === 'FACIL' ? 60 : 
                quiz.dificuldade === 'MEDIO' ? 120 : 240;
            setTimeLeft(quiz.questoes.length * timePerQuestion);
        }
    }, [quiz]);

    // 3. Loop do cronômetro
    useEffect(() => {
        if (timeLeft > 0 && !isFinished) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isFinished]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (optionIdx: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIdx;
        setAnswers(newAnswers);

        if (currentIndex < quiz.questoes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleSubmit(newAnswers);
        }
    };

    const handleSubmit = async (finalAnswers: number[]) => {
        setIsSubmitting(true);
        try {
            const tempoGeralSegundos = Math.floor((Date.now() - startTime) / 1000);
            const acertos = finalAnswers.reduce((acc, ans, idx) => {
                return acc + (ans === quiz.questoes[idx].respostaCorreta ? 1 : 0);
            }, 0);

            const res = await api.post(`/professor/training-quizzes/${quizId}/submit`, {
                acertos,
                tempoGeralSegundos
            });

            setSubmissionResult(res.data);
            setIsFinished(true);
            onComplete?.(res.data);
            if (res.data.recompensaAtribuida) {
                toast.success(`PARABÉNS! +${res.data.valorRecompensa} PC$ ADICIONADOS!`, {
                    icon: '💰',
                    duration: 5000
                });
            }
        } catch {
            toast.error('Erro ao enviar resultado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Zap className="text-purple-500 w-12 h-12" />
            </motion.div>
            <p className="mt-4 font-press text-[10px] text-purple-400 animate-pulse">CARREGANDO DESAFIO...</p>
        </div>
    );

    if (!quiz) return null;

    const currentQuestion = quiz.questoes[currentIndex];
    const progress = ((currentIndex + 1) / quiz.questoes.length) * 100;

    return (
        <div className="fixed inset-0 z-[200] bg-[#07071a]/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-black/40 border-2 border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* HEADERS */}
                <div className="p-6 border-b border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                    <div>
                        <h2 className="font-press text-[10px] text-white uppercase mb-1">{quiz.titulo}</h2>
                        <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[8px] font-press">
                                {quiz.dificuldade}
                            </span>
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono text-sm",
                        timeLeft < 30 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : 
                        timeLeft < 60 ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
                        "bg-green-500/20 border-green-500 text-green-500"
                    )}>
                        <Timer size={18} />
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* PROGRESS BAR */}
                <div className="h-1.5 w-full bg-white/5 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                    />
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {!isFinished ? (
                            <motion.div 
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-press text-xs">
                                            {currentIndex + 1}
                                        </span>
                                        <h3 className="text-lg md:text-xl font-mono text-slate-100 leading-relaxed">
                                            {currentQuestion.pergunta}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {currentQuestion.alternativas.map((alt: string, i: number) => (
                                        <button
                                            key={i}
                                            disabled={isSubmitting}
                                            onClick={() => handleAnswer(i)}
                                            className="group relative flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl text-left font-mono text-sm hover:bg-purple-500/10 hover:border-purple-500/50 transition-all active:scale-[0.98]"
                                        >
                                            <span className="w-6 h-6 rounded flex items-center justify-center bg-white/10 group-hover:bg-purple-500 text-[10px] text-slate-400 group-hover:text-white transition-colors">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="flex-1 text-slate-300 group-hover:text-white">
                                                {alt}
                                            </span>
                                            <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-purple-400" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-6"
                            >
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse" />
                                    {submissionResult?.recompensaAtribuida ? (
                                        <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-full">
                                            <Trophy size={60} className="text-white drop-shadow-lg" />
                                        </div>
                                    ) : (
                                        <div className="relative bg-slate-700 p-8 rounded-full">
                                            <Award size={60} className="text-white opacity-50" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h2 className="font-press text-xl text-white uppercase tracking-wider">
                                        {submissionResult?.recompensaAtribuida ? 'Missão Cumprida!' : 'Treino Concluído'}
                                    </h2>
                                    <p className="text-slate-400 font-mono">
                                        Você acertou <span className="text-purple-400 font-bold">{submissionResult?.acertos} de {quiz.questoes.length}</span> questões
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-press text-slate-500 mb-1">NOTAS PJC</p>
                                        <p className="text-xl font-press text-yellow-500">+{submissionResult?.recompensaAtribuida ? 10 : 0}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <p className="text-[10px] font-press text-slate-500 mb-1">TEMPO</p>
                                        <p className="text-xl font-press text-blue-400">{Math.floor(submissionResult?.tempoGeralSegundos / 60)}:{(submissionResult?.tempoGeralSegundos % 60).toString().padStart(2, '0')}</p>
                                    </div>
                                </div>

                                {submissionResult?.motivoNaoRecompensado && (
                                    <div className="flex items-center gap-2 justify-center text-red-400 text-[10px] font-mono bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20 max-w-xs mx-auto">
                                        <AlertCircle size={14} />
                                        {submissionResult.motivoNaoRecompensado}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button 
                                        onClick={onClose}
                                        className="px-8 py-3 bg-white text-black rounded-2xl font-press text-[10px] hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                    >
                                        FECHAR HUB
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
