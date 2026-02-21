// ARQUIVO: frontend/src/pages/dashboard/components/ActionSection.tsx
import { memo } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { ActionCard } from './ActionCard';

interface ActionItem {
  label: string;
  path?: string;
  action?: () => void;
  icon: LucideIcon;
  color: string;
  desc: string;
}

interface ActionSectionProps {
  title: string;
  items: ActionItem[];
  delay: number;
  onNavigate: (path: string) => void;
}

export const ActionSection = memo(function ActionSection({
  title,
  items,
  delay,
  onNavigate
}: ActionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.5 }}
      className="mb-8"
    >
      {/* Section Title */}
      <motion.div
        className="relative mb-4 pl-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay * 0.15 + 0.1 }}
      >
        {/* Left Accent Line */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-cyan-500 rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: delay * 0.15 + 0.2, duration: 0.5 }}
        />
        
        {/* Title */}
        <h3 className="font-vt323 text-2xl md:text-3xl text-slate-300 uppercase tracking-widest flex items-center gap-3">
          {title}
          
          {/* Decorative Dots */}
          <div className="hidden md:flex items-center gap-1">
            <motion.div
              className="w-1.5 h-1.5 bg-purple-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-cyan-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
            />
          </div>
        </h3>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, index) => (
          <ActionCard
            key={item.label}
            label={item.label}
            icon={item.icon}
            color={item.color}
            desc={item.desc}
            onClick={() => item.action ? item.action() : onNavigate(item.path!)}
            delay={delay * 10 + index}
          />
        ))}
      </div>
    </motion.div>
  );
});
