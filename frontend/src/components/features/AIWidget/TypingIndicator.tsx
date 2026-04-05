import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="flex justify-start mb-4">
            <div className="bg-purple-900/20 p-3 rounded-2xl rounded-tl-none border border-purple-500/20">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
