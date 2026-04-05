import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface FeedbackStarsProps {
    onSelect: (rating: number) => void;
}

export function FeedbackStars({ onSelect }: FeedbackStarsProps) {
    const [hover, setHover] = useState(0);
    const [selected, setSelected] = useState(0);

    return (
        <div className="flex items-center gap-1 mt-2 ml-2">
            <span className="text-[10px] text-purple-400 mr-1 uppercase font-bold">Útil?</span>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => {
                        setSelected(star);
                        onSelect(star);
                    }}
                    className="transition-transform hover:scale-125"
                >
                    <Star
                        size={14}
                        className={cn(
                            "transition-colors",
                            (hover || selected) >= star 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-slate-600"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
