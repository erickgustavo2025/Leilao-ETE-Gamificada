// ARQUIVO: frontend/src/components/features/AIWidget/ChatBubble.tsx
import { motion } from 'framer-motion';
import { Zap, Trophy, Play } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FeedbackStars } from './FeedbackStars';

interface Message {
    role: 'user' | 'ai';
    content: string;
    interactionId?: string;
    userRating?: number;
    modo?: string;
    metadata?: {
        suggestedQuiz?: {
            _id: string;
            titulo: string;
            topico: string;
            dificuldade: string;
            recompensa: number;
        }
    }
}

interface ChatBubbleProps {
    message: Message;
    sessionId?: string | null;
    onRated?: (interactionId: string, rating: number) => void;
    onStartQuiz?: (quizId: string) => void;
}

export function ChatBubble({ message, sessionId, onRated, onStartQuiz }: ChatBubbleProps) {
    const isAI = message.role === 'ai';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn('flex w-full mb-4 flex-col', isAI ? 'items-start' : 'items-end')}
        >
            <div
                className={cn(
                    'max-w-[85%] p-3 rounded-2xl text-sm shadow-lg backdrop-blur-md',
                    isAI
                        ? 'bg-purple-900/40 border border-purple-500/30 text-purple-100 rounded-tl-none'
                        : 'bg-blue-600/60 border border-blue-400/30 text-white rounded-tr-none'
                )}
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider', isAI ? 'text-purple-400' : 'text-blue-200')}>
                        {isAI ? `Oráculo GIL${message.modo ? ` [${message.modo}]` : ''}` : 'Você'}
                    </span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap font-mono text-[13px]">{message.content}</p>

                {/* 🎲 NOVO: CARD DE CONVITE AO SIMULADO PJC 2.0 */}
                {isAI && message.metadata?.suggestedQuiz && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-3 bg-black/40 rounded-xl border border-purple-500/50 space-y-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h4 className="text-[10px] font-press text-white leading-tight uppercase">
                                    {message.metadata.suggestedQuiz.titulo}
                                </h4>
                                <div className="flex gap-2 mt-2">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[7px] font-press",
                                        message.metadata.suggestedQuiz.dificuldade === 'FACIL' ? "bg-green-500/20 text-green-400" :
                                        message.metadata.suggestedQuiz.dificuldade === 'MEDIO' ? "bg-blue-500/20 text-blue-400" :
                                        "bg-purple-500/20 text-purple-400"
                                    )}>
                                        {message.metadata.suggestedQuiz.dificuldade}
                                    </span>
                                    <span className="flex items-center gap-1 text-[8px] font-mono text-yellow-500">
                                        <Zap size={10} /> +{message.metadata.suggestedQuiz.recompensa} PC$
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Trophy size={16} />
                            </div>
                        </div>

                        <button 
                            onClick={() => onStartQuiz?.(message.metadata?.suggestedQuiz?._id || '')}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-press text-[9px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                        >
                            <Play size={12} fill="currentColor" /> ACEITAR TREINO
                        </button>
                    </motion.div>
                )}
            </div>

            {isAI && (
                <FeedbackStars
                    interactionId={message.interactionId}
                    initialRating={message.userRating}
                    sessionId={sessionId}
                    onRated={onRated}
                />
            )}
        </motion.div>
    );
}
