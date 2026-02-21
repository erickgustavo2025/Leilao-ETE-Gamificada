// ARQUIVO: frontend/src/pages/dashboard/taca-das-casas/components/MenuCard.tsx
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface MenuCardProps {
    title: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    borderColor: string;
    onClick: () => void;
    delay?: number;
    disabled?: boolean;
}

export function MenuCard({ 
    title, 
    desc, 
    icon: Icon, 
    color, 
    borderColor, 
    onClick,
    delay = 0,
    disabled = false
}: MenuCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                delay,
                type: 'spring',
                damping: 15
            }}
            whileHover={{ 
                scale: disabled ? 1 : 1.05, 
                y: disabled ? 0 : -10,
            }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={disabled ? undefined : onClick}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Glassmorphism Background */}
            <div className={cn(
                "absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-black/60 via-black/40 to-black/60 border-2 rounded-2xl transition-all duration-300",
                borderColor,
                !disabled && "group-hover:from-black/40 group-hover:via-black/20 group-hover:to-black/40"
            )} />

            {/* Glow Effect on Hover */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                !disabled && borderColor.replace('border-', 'bg-') + '/30'
            )} />

            {/* Animated Border Gradient */}
            <motion.div
                className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    !disabled && "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                )}
                animate={!disabled ? {
                    x: ['-100%', '200%']
                } : {}}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                }}
            />

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center space-y-4">
                
                {/* Icon Container */}
                <motion.div
                    whileHover={!disabled ? { rotate: [0, -10, 10, 0], scale: 1.2 } : {}}
                    transition={{ duration: 0.5 }}
                    className={cn(
                        "relative p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-300",
                        "bg-black/60",
                        borderColor,
                        !disabled && "group-hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                    )}
                >
                    {/* Icon Glow Background */}
                    <div className={cn(
                        "absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity",
                        !disabled && color.replace('text-', 'bg-')
                    )} />
                    
                    {/* Icon */}
                    <Icon 
                        size={48} 
                        className={cn(
                            "relative transition-all duration-300",
                            color,
                            !disabled && "group-hover:drop-shadow-[0_0_15px_currentColor]"
                        )} 
                        strokeWidth={2}
                    />

                    {/* Sparkle Particles */}
                    {!disabled && (
                        <>
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={cn(
                                        "absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100",
                                        color.replace('text-', 'bg-')
                                    )}
                                    style={{
                                        top: `${25 + Math.sin(i * Math.PI / 2) * 40}%`,
                                        left: `${25 + Math.cos(i * Math.PI / 2) * 40}%`,
                                    }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </>
                    )}
                </motion.div>

                {/* Title */}
                <h3 className={cn(
                    "font-press text-xs md:text-sm tracking-wider leading-tight uppercase",
                    color,
                    !disabled && "group-hover:drop-shadow-[0_0_10px_currentColor] transition-all duration-300"
                )}>
                    {title}
                </h3>

                {/* Description */}
                <p className="font-vt323 text-lg md:text-xl text-slate-400 leading-snug group-hover:text-slate-200 transition-colors">
                    {desc}
                </p>

                {/* Hover Indicator */}
                {!disabled && (
                    <motion.div
                        className={cn(
                            "w-0 h-0.5 group-hover:w-full transition-all duration-500",
                            color.replace('text-', 'bg-')
                        )}
                    />
                )}

                {/* Disabled Badge */}
                {disabled && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-900/60 border border-red-500 rounded-full">
                        <span className="font-mono text-[10px] text-red-300 tracking-wider">
                            EM BREVE
                        </span>
                    </div>
                )}
            </div>

            {/* Particle Effect Background */}
            {!disabled && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={cn(
                                "absolute w-1 h-1 rounded-full",
                                color.replace('text-', 'bg-')
                            )}
                            initial={{
                                x: `${Math.random() * 100}%`,
                                y: '100%',
                                opacity: 0
                            }}
                            animate={{
                                y: '-100%',
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
