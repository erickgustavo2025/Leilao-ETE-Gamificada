// ═══════════════════════════════════════════════════════════════════════════════
// 📱 ARQUIVO: frontend/src/pages/public/LoginSelection.tsx
// 🎨 REDESIGN SSS+ com PERFORMANCE MOBILE EXTREMA
// ⚡ OTIMIZAÇÕES: Detecção Mobile | Partículas Condicionais | Blur Inteligente | Memoização
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Terminal, Lock, Gamepad2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageTransition } from '../../components/layout/PageTransition';
import { useGameSound } from '../../hooks/useGameSound';
import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { api } from '../../api/axios-config';
import { queryKeys } from '../../utils/queryKeys';
// 🔥 CORREÇÃO: Restaurado o import do getImageUrl!
import { getImageUrl } from '../../utils/imageHelper';

// ═══════════════════════════════════════════════════════════════════════════════
// 📱 HOOK: DETECÇÃO DE MOBILE
// ═══════════════════════════════════════════════════════════════════════════════
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(width < 768 || isMobileUA);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌟 PARTÍCULA FLUTUANTE (OTIMIZADA)
// ═══════════════════════════════════════════════════════════════════════════════
const FloatingParticle = memo(({ delay, color, size }: { delay: number; color: string; size: number }) => (
  <motion.div
    className={`absolute rounded-full ${color} blur-sm pointer-events-none`}
    style={{
      width: size,
      height: size,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      willChange: 'transform, opacity', 
    }}
    animate={{
      y: [0, -50, 0],
      opacity: [0, 0.6, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4 + Math.random() * 2,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
));
FloatingParticle.displayName = 'FloatingParticle';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 ROLE CARD (MEMOIZADO)
// ═══════════════════════════════════════════════════════════════════════════════
interface RoleCardProps {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  glowColor: string;
  path: string;
  delay: number;
  isMobile: boolean; 
  onClick: () => void;
}

const RoleCard = memo(({ title, desc, icon: Icon, color, borderColor, glowColor, delay, isMobile, onClick }: RoleCardProps) => {
  const { playHover } = useGameSound();
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    playHover();
    setIsHovered(true);
  }, [playHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const blurClass = isMobile ? 'bg-black/90' : 'bg-black/60 backdrop-blur-xl';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
      style={{ willChange: 'transform' }} 
    >
      <motion.div
        className={`absolute inset-0 ${glowColor} rounded-2xl blur-xl`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <button
        onClick={onClick}
        className={`
          relative w-full h-72 rounded-2xl overflow-hidden
          ${blurClass}
          border-2 ${borderColor}
          transition-all duration-300
          group
        `}
      >
        <motion.div
          className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-20`}
          transition={{ duration: 0.5 }}
        />

        {!isMobile && (
          <AnimatePresence>
            {isHovered && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      willChange: 'transform, opacity',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -30],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        )}

        <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
          <motion.div
            className={`
              p-5 rounded-full mb-6
              ${isMobile ? 'bg-black/80' : 'bg-black/40 backdrop-blur-sm'}
              border-2 ${borderColor}
              group-hover:scale-110 group-hover:rotate-12
              transition-all duration-300
            `}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            style={{ willChange: 'transform' }}
          >
            <Icon size={40} className="text-white drop-shadow-lg" />
          </motion.div>

          <h3 className="font-press text-base md:text-lg text-white tracking-wider mb-3 uppercase group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-gray-200 group-hover:to-white transition-all">
            {title}
          </h3>

          <p className="font-vt323 text-lg md:text-xl text-gray-400 uppercase tracking-widest group-hover:text-gray-200 transition-colors">
            {desc}
          </p>

          <motion.div
            className="mt-6 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity"
            animate={{ x: isHovered ? 5 : 0 }}
          >
            <Sparkles size={14} className="text-white" />
            <span className="font-mono text-xs text-white tracking-widest">ACESSAR</span>
          </motion.div>
        </div>

        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-30 group-hover:opacity-70 transition-opacity">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{
                scale: isHovered ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                repeat: isHovered ? Infinity : 0,
              }}
            />
          ))}
        </div>
      </button>
    </motion.div>
  );
});
RoleCard.displayName = 'RoleCard';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function LoginSelection() {
  const navigate = useNavigate();
  const { playClick } = useGameSound();
  const isMobile = useIsMobile();

  // ─────────────────────────────────────────────────────────────
  // 📡 TANSTACK QUERY: BUSCAR CONFIG DINÂMICA
  // ─────────────────────────────────────────────────────────────
  const { data: config, isLoading } = useQuery({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const response = await api.get('/public/config');
      return response.data as { siteName: string; logoUrl: string };
    },
    staleTime: 1000 * 60 * 5, 
  });

  const options = useMemo(
    () => [
      { id: 'aluno', title: 'ALUNO', desc: 'Área do Estudante', icon: GraduationCap, color: 'bg-gradient-to-br from-blue-500 to-cyan-500', borderColor: 'border-blue-500/40', glowColor: 'bg-blue-500/40', path: '/login/aluno' },
      { id: 'monitor', title: 'MONITOR', desc: 'Gestão de Turma', icon: Shield, color: 'bg-gradient-to-br from-yellow-500 to-orange-500', borderColor: 'border-yellow-500/40', glowColor: 'bg-yellow-500/40', path: '/login/monitor' },
      { id: 'admin', title: 'COORDENAÇÃO', desc: 'Controle Total', icon: Lock, color: 'bg-gradient-to-br from-pink-500 to-rose-500', borderColor: 'border-pink-500/40', glowColor: 'bg-pink-500/40', path: '/login/admin' },
      { id: 'dev', title: 'DEV', desc: 'Manutenção', icon: Terminal, color: 'bg-gradient-to-br from-green-500 to-emerald-500', borderColor: 'border-green-500/40', glowColor: 'bg-green-500/40', path: '/login/dev' },
    ],
    []
  );

  const handleCardClick = useCallback(
    (path: string) => {
      playClick();
      navigate(path);
    },
    [playClick, navigate]
  );

  const particleCount = isMobile ? 5 : 20;
  const headerBlurClass = isMobile ? 'bg-black/80' : 'bg-black/40 backdrop-blur-xl';
  const ctaBlurClass = isMobile ? 'bg-black/80' : 'bg-black/40 backdrop-blur-sm';

  // 🔥 CORREÇÃO: Restaurada a TELA DE LOADING GAMIFICADA (Gamepad Girando)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Gamepad2 size={48} className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* 🌌 BACKGROUND CYBERPUNK (OTIMIZADO) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className={`absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/20 rounded-full ${isMobile ? '' : 'blur-[120px]'}`} animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ willChange: 'transform, opacity' }} />
        <motion.div className={`absolute -top-20 -right-40 w-[500px] h-[500px] bg-yellow-500/15 rounded-full ${isMobile ? '' : 'blur-[120px]'}`} animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} style={{ willChange: 'transform, opacity' }} />
        <motion.div className={`absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-pink-500/10 rounded-full ${isMobile ? '' : 'blur-[150px]'}`} animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }} style={{ willChange: 'transform, opacity' }} />
        
        <div className={`absolute inset-0 ${isMobile ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: isMobile ? '60px 60px' : '50px 50px' }} />
      </div>

      {/* 📱 Partículas Flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(particleCount)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} color={ i % 4 === 0 ? 'bg-purple-500' : i % 4 === 1 ? 'bg-yellow-500' : i % 4 === 2 ? 'bg-pink-500' : 'bg-cyan-500'} size={Math.random() * 6 + 2} />
        ))}
      </div>

      {/* 🎯 CONTEÚDO PRINCIPAL */}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, type: 'spring' }} className="text-center mb-12 md:mb-16 z-10 relative">
        
        {/* 🔥 CORREÇÃO: Usando getImageUrl blindado na Logo! */}
        {config?.logoUrl ? (
          <motion.div className="inline-block mb-6" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <div className={`p-5 rounded-2xl ${headerBlurClass} border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]`}>
              <img src={getImageUrl(config.logoUrl)} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
            </div>
          </motion.div>
        ) : (
          <motion.div className="inline-block mb-6" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <div className={`p-5 rounded-2xl ${headerBlurClass} border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]`}>
              <Gamepad2 size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
            </div>
          </motion.div>
        )}

        <motion.h1 className="font-press text-3xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 mb-3 tracking-tight uppercase" animate={{ textShadow: [ '0 0 20px rgba(168, 85, 247, 0.5)', '0 0 30px rgba(236, 72, 153, 0.6)', '0 0 20px rgba(168, 85, 247, 0.5)' ] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {config?.siteName || 'ETE GAMIFICADA'}
        </motion.h1>

        <p className="font-vt323 text-xl md:text-2xl text-gray-400 tracking-widest uppercase">Selecione seu perfil de acesso</p>
        <motion.div className="mt-4 mx-auto w-32 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" animate={{ scaleX: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl z-10 px-4">
        {options.map((option, index) => (
          <RoleCard key={option.id} {...option} delay={0.2 + index * 0.15} isMobile={isMobile} onClick={() => handleCardClick(option.path)} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-12 md:mt-16 text-center z-10">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${ctaBlurClass} border border-white/10`}>
          <motion.div className="w-2 h-2 bg-green-500 rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span className="font-mono text-xs text-gray-400 tracking-widest uppercase">Sistema Online</span>
        </div>
      </motion.div>

    </PageTransition>
  );
}