// ARQUIVO: frontend/src/pages/dashboard/components/ActionCard.tsx
import { memo } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ActionCardProps {
  label: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  onClick: () => void;
  delay?: number;
}

export const ActionCard = memo(function ActionCard({
  label,
  icon: Icon,
  color,
  desc,
  onClick,
  delay = 0
}: ActionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-start p-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg hover:border-slate-600 transition-all duration-300 text-left group overflow-hidden shadow-lg hover:shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: "rgba(30, 41, 59, 0.8)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow on Hover */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl",
          color.includes('cyan') && 'bg-cyan-500/10',
          color.includes('yellow') && 'bg-yellow-500/10',
          color.includes('indigo') && 'bg-indigo-500/10',
          color.includes('emerald') && 'bg-emerald-500/10',
          color.includes('pink') && 'bg-pink-500/10',
          color.includes('orange') && 'bg-orange-500/10',
          color.includes('purple') && 'bg-purple-500/10',
          color.includes('blue') && 'bg-blue-500/10',
          color.includes('slate') && 'bg-slate-500/10'
        )}
      />

      {/* Top Right Gradient */}
      <div className="absolute top-0 right-0 p-10 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full pointer-events-none" />

      {/* Icon Container */}
      <motion.div
        className="relative mb-3 p-2.5 bg-slate-950/80 backdrop-blur-sm rounded-lg border border-slate-800 group-hover:border-white/20 transition-all duration-300 shadow-inner"
        whileHover={{ scale: 1.05 }}
      >
        {/* Icon Glow */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300",
            color.includes('cyan') && 'bg-cyan-500/30',
            color.includes('yellow') && 'bg-yellow-500/30',
            color.includes('indigo') && 'bg-indigo-500/30',
            color.includes('emerald') && 'bg-emerald-500/30',
            color.includes('pink') && 'bg-pink-500/30',
            color.includes('orange') && 'bg-orange-500/30',
            color.includes('purple') && 'bg-purple-500/30',
            color.includes('blue') && 'bg-blue-500/30',
            color.includes('slate') && 'bg-slate-500/30'
          )}
        />
        
        <Icon className={cn("w-6 h-6 relative z-10", color)} strokeWidth={2} />
      </motion.div>

      {/* Label */}
      <motion.span
        className="font-vt323 text-lg md:text-xl text-white leading-none mb-1.5 group-hover:text-yellow-400 transition-colors duration-300"
        initial={{ x: 0 }}
        whileHover={{ x: 2 }}
      >
        {label}
      </motion.span>

      {/* Description */}
      <span className="font-mono text-[9px] md:text-[10px] text-slate-500 leading-tight group-hover:text-slate-400 transition-colors duration-300">
        {desc}
      </span>

      {/* Bottom Line Accent */}
      <motion.div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500",
          color.includes('cyan') && 'bg-cyan-500',
          color.includes('yellow') && 'bg-yellow-500',
          color.includes('indigo') && 'bg-indigo-500',
          color.includes('emerald') && 'bg-emerald-500',
          color.includes('pink') && 'bg-pink-500',
          color.includes('orange') && 'bg-orange-500',
          color.includes('purple') && 'bg-purple-500',
          color.includes('blue') && 'bg-blue-500',
          color.includes('slate') && 'bg-slate-500'
        )}
      />
    </motion.button>
  );
});
