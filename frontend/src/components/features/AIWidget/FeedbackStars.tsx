// ARQUIVO: frontend/src/components/features/AIWidget/FeedbackStars.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { api } from '../../../api/axios-config';

interface FeedbackStarsProps {
    interactionId?: string;
    initialRating?: number;
    sessionId?: string | null;
    onRated?: (interactionId: string, rating: number) => void; // propaga voto para o pai
}

export function FeedbackStars({ interactionId, initialRating = 0, sessionId, onRated }: FeedbackStarsProps) {
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!interactionId) return null;

    if (rating > 0) {
        return (
            <div className="flex items-center gap-1 mt-2 ml-2 opacity-70">
                <span className="text-[10px] text-purple-400 mr-1 uppercase font-bold">Útil?</span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={cn(star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600')}
                    />
                ))}
                <span className="text-[9px] text-slate-500 ml-1 font-mono">Obrigado!</span>
            </div>
        );
    }

    const handleVote = async (value: number) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post('/ai/feedback', { interactionId, sessionId, avaliacao: value });
            setRating(value);
            // Atualiza o array messages no AIWidget para que, ao fechar e reabrir,
            // o initialRating já chegue correto e as estrelas não ressurjam
            onRated?.(interactionId, value);
        } catch {
            console.error('Erro ao enviar feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-1 mt-2 ml-2">
            <span className="text-[10px] text-purple-400 mr-1 uppercase font-bold">Útil?</span>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => handleVote(star)}
                    disabled={isSubmitting}
                    className="transition-transform hover:scale-125 disabled:opacity-40"
                >
                    <Star
                        size={14}
                        className={cn(
                            'transition-colors',
                            hover >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
