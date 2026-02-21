import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useGameSound } from '../../hooks/useGameSound'; 

interface PixelButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
  mute?: boolean; // Opção pra desligar som se quiser
}

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  isLoading, 
  disabled,
  mute = false,
  onClick,
  ...props 
}) => {
  
  const { playClick, playHover } = useGameSound(); // <--- HOOK

  const variants = {
    primary: 'bg-ete-yellow text-black hover:bg-yellow-400',
    secondary: 'bg-ete-light text-white border-2 border-slate-600 hover:border-ete-purple',
    danger: 'bg-ete-red text-white hover:bg-red-500',
    success: 'bg-ete-green text-black hover:bg-green-400',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && !mute) {
        playClick(); // <--- TOCA O SOM
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onMouseEnter={() => !disabled && !mute && playHover()} // <--- Opcional: Som ao passar o mouse
      disabled={disabled || isLoading}
      className={cn(
        'font-press text-xs py-4 px-6 rounded-sm shadow-pixel transition-all relative overflow-hidden',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? 'CARREGANDO...' : children}
    </motion.button>
  );
};