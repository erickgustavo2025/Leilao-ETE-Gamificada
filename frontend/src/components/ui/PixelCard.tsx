import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion'; // 👇 Importamos a tipagem certa do Framer
import { cn } from '../../utils/cn';

// 👇 Agora estendemos HTMLMotionProps (tipagem do Framer) em vez de HTMLAttributes
interface PixelCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const PixelCard: React.FC<PixelCardProps> = ({ 
  children, 
  className, 
  color = '#8B5CF6',
  style, 
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-ete-light p-6 relative',
        'border-4 border-solid',
        className
      )}
      style={{
        borderColor: color,
        boxShadow: `8px 8px 0px 0px rgba(0,0,0,0.5)`,
        ...style // 👇 Aceita a cor da turma vinda do Ranking
      }}
      {...props} // 👇 Repassa props do Framer sem dar erro de onDrag
    >
      {children}
    </motion.div>
  );
};