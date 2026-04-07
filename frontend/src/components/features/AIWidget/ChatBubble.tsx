// ARQUIVO: frontend/src/components/features/AIWidget/ChatBubble.tsx
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { FeedbackStars } from './FeedbackStars';

interface Message {
    role: 'user' | 'ai';
    content: string;
    interactionId?: string;
    userRating?: number;
    modo?: string;
}

interface ChatBubbleProps {
    message: Message;
    sessionId?: string | null;
    onRated?: (interactionId: string, rating: number) => void;
}

export function ChatBubble({ message, sessionId, onRated }: ChatBubbleProps) {
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
