// ═══════════════════════════════════════════════════════════════════════════════
// 📱 ARQUIVO: frontend/src/pages/public/RoleLogin.tsx
// 🎨 REDESIGN SSS+ com PERFORMANCE MOBILE EXTREMA
// ⚡ OTIMIZAÇÕES: Detecção Mobile | Partículas | Glassmorphism | Integração Config
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, memo, useCallback, type FormEvent, useEffect } from 'react';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Lock, Loader2, AlertCircle, Shield, Terminal, 
  GraduationCap, Sparkles, Gamepad2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';

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
      y: [0, -40, 0],
      opacity: [0, 0.6, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
));
FloatingParticle.displayName = 'FloatingParticle';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 CONFIGURAÇÃO DAS 4 CLASSES
// ═══════════════════════════════════════════════════════════════════════════════
const roleConfig = {
  aluno: {
    title: 'PORTAL DO ALUNO',
    color: '#3B82F6', // Azul
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: GraduationCap,
  },
  monitor: {
    title: 'ÁREA DO MONITOR',
    color: '#EAB308', // Amarelo
    glowColor: 'rgba(234, 179, 8, 0.4)',
    icon: Shield,
  },
  admin: {
    title: 'SALA DOS PROFESSORES',
    color: '#EC4899', // Rosa
    glowColor: 'rgba(236, 72, 153, 0.4)',
    icon: Lock,
  },
  dev: {
    title: 'GOD MODE',
    color: '#22c55e', // Verde
    glowColor: 'rgba(34, 197, 94, 0.4)',
    icon: Terminal,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function RoleLogin() {
  const { role } = useParams<{ role: string }>();
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { playSuccess, playError, playClick } = useGameSound();

  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  // 📱 DETECÇÃO DE MOBILE
  const isMobile = useIsMobile();

  // ─────────────────────────────────────────────────────────────
  // 📡 TANSTACK QUERY: BUSCAR CONFIG DINÂMICA
  // ─────────────────────────────────────────────────────────────
  const { isLoading } = useQuery({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const response = await api.get('/public/config');
      return response.data as { siteName?: string; logoUrl?: string };
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  const currentPageRole = role || 'aluno';
  const roleData = roleConfig[currentPageRole as keyof typeof roleConfig] || roleConfig.aluno;
  const isRestricted = currentPageRole === 'dev' || currentPageRole === 'admin';

  // 📱 NÚMERO DE PARTÍCULAS CONDICIONAL
  const particleCount = isMobile ? 4 : 15;
  const cardBlurClass = isMobile ? 'bg-slate-900/95' : 'bg-slate-900/80 backdrop-blur-xl';

  // ─────────────────────────────────────────────────────────────
  // 🎬 ANIMAÇÕES DO ÍCONE
  // ─────────────────────────────────────────────────────────────
  const iconAnimation = useMemo(() => {
    const baseStyle = { willChange: 'transform', borderColor: roleData.color };
    switch (currentPageRole) {
      case 'monitor':
        return {
          style: baseStyle,
          animate: {
            scale: [1, 1.05, 1],
            filter: [
              `drop-shadow(0 0 0px ${roleData.color})`,
              `drop-shadow(0 0 8px ${roleData.color})`,
              `drop-shadow(0 0 0px ${roleData.color})`,
            ],
          },
          transition: { duration: 2, repeat: Infinity, ease: easeInOut },
        };
      case 'dev':
        return {
          style: baseStyle,
          animate: { x: [0, -2, 2, -1, 1, 0], opacity: [1, 0.8, 1, 0.9, 1] },
          transition: { duration: 0.2, repeat: Infinity, repeatDelay: 3 },
        };
      case 'admin':
        return {
          style: baseStyle,
          animate: { rotate: [0, -15, 0, 15, 0] },
          transition: { duration: 4, repeat: Infinity, ease: easeInOut },
        };
      default: // aluno
        return {
          style: baseStyle,
          animate: { y: [0, -8, 0] },
          transition: { duration: 3, repeat: Infinity, ease: easeInOut },
        };
    }
  }, [currentPageRole, roleData.color]);

  // ─────────────────────────────────────────────────────────────
  // 🔐 TANSTACK QUERY: LOGIN MUTATION
  // ─────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials: { matricula: string; senha: string }) => {
      const response = await api.post('/auth/login', credentials);
      return response.data as { user: any; token: string };
    },
    onSuccess: (data) => {
      const { user: userData, token } = data;
      const userRole = userData.role;

      if (currentPageRole === 'dev' && userRole !== 'dev') {
        throw new Error('Acesso negado. Nível insuficiente.');
      }
      if (currentPageRole === 'admin' && !['admin', 'dev'].includes(userRole)) {
        throw new Error('Acesso restrito à Coordenação.');
      }
      if (currentPageRole === 'monitor' && !['monitor', 'admin', 'dev'].includes(userRole)) {
        throw new Error('Permissão de Monitor necessária.');
      }

      playSuccess();
      toast.success(`BEM-VINDO(A), ${userData.nome.split(' ')[0]}!`, {
        style: { borderColor: roleData.color, color: roleData.color },
      });

      localStorage.setItem('@ETEGamificada:token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUser(userData);

      if (currentPageRole === 'monitor') navigate('/monitor');
      else if (currentPageRole === 'dev') navigate('/dev');
      else if (currentPageRole === 'admin') navigate('/admin');
      else navigate('/dashboard');
    },
    onError: (err: any) => {
      playError();
      let msg = 'Falha no login.';

      if (err.response) {
        if (err.response.data?.issues) {
          msg = err.response.data.issues.map((i: any) => i.message).join('. ');
        } else if (err.response.data?.error) {
          msg = err.response.data.error;
        } else if (err.response.data?.message) {
          msg = err.response.data.message;
        } else if (err.response.status === 429) {
          msg = 'Muitas tentativas! Aguarde.';
        } else if (err.response.status === 401) {
          msg = 'Senha incorreta.';
        }
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      toast.error('ERRO DE ACESSO', { description: msg });
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 🔐 HANDLE LOGIN
  // ─────────────────────────────────────────────────────────────
  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      
      loginMutation.mutate({ matricula, senha });
    },
    [matricula, senha, loginMutation]
  );

  // 🔥 LOADING GAMIFICADO
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
    <PageTransition className="min-h-screen flex items-center justify-center p-4 md:p-6 relative bg-[#050505] overflow-hidden">
      {/* BACKGROUND E PARTÍCULAS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full ${isMobile ? '' : 'blur-[120px]'}`}
          style={{ backgroundColor: roleData.glowColor }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-purple-600/15 rounded-full ${isMobile ? '' : 'blur-[100px]'}`}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className={`absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-yellow-500/10 rounded-full ${isMobile ? '' : 'blur-[100px]'}`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <div
          className={`absolute inset-0 ${isMobile ? 'opacity-[0.02]' : 'opacity-[0.03]'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: isMobile ? '60px 60px' : '50px 50px',
          }}
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(particleCount)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.4}
            color={roleData.color.includes('#3B82F6') ? 'bg-blue-500' : 
                   roleData.color.includes('#EAB308') ? 'bg-yellow-500' :
                   roleData.color.includes('#EC4899') ? 'bg-pink-500' : 'bg-green-500'}
            size={Math.random() * 6 + 2}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-0"
          style={{ background: `linear-gradient(45deg, ${roleData.glowColor}, transparent)` }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <PixelCard className={`relative ${cardBlurClass} border-slate-700/50`}>
          <Link
            to="/login"
            onClick={() => playClick()}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-mono mb-6 transition-colors text-xs group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>VOLTAR</span>
          </Link>

          <div className="text-center mb-8">
            <motion.div
              className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center border-4 bg-slate-800/50 relative overflow-hidden"
              {...iconAnimation}
            >
              <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: roleData.color }} />
              <roleData.icon className="w-10 h-10 relative z-10" style={{ color: roleData.color }} />
            </motion.div>

            <motion.h2
              className="text-2xl md:text-3xl font-vt323 leading-relaxed transition-colors duration-300"
              style={{ color: roleData.color, textShadow: `0 0 20px ${roleData.glowColor}` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {roleData.title}
            </motion.h2>

            <motion.div
              className="mt-3 mx-auto w-24 h-0.5 rounded-full"
              style={{ backgroundColor: roleData.color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-red-900/30 border border-red-500/50 p-3 flex items-center gap-3 rounded-lg"
                >
                  <AlertCircle className="text-red-500 shrink-0" size={20} />
                  <span className="font-mono text-xs text-red-200 leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-slate-400 font-vt323 text-xl mb-2 uppercase tracking-wider">
                {isRestricted ? 'USUÁRIO / MATRÍCULA' : 'MATRÍCULA'}
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-400 transition-colors" size={18} />
                <input
                  name="matricula"
                  type="text"
                  autoComplete="username"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 pl-10 p-3 text-white font-mono focus:outline-none transition-all focus:border-white focus:bg-black rounded-lg text-base md:text-lg`}
                  placeholder={isRestricted ? 'admin' : '00000000'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-vt323 text-xl mb-2 uppercase tracking-wider">SENHA</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-slate-400 transition-colors" size={18} />
                <input
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 pl-10 p-3 text-white font-mono focus:outline-none transition-all focus:border-white focus:bg-black rounded-lg text-base md:text-lg`}
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <PixelButton
                type="submit"
                className="w-full flex justify-center items-center h-14 font-press text-sm mt-4 relative overflow-hidden group"
                style={{
                  backgroundColor: roleData.color,
                  borderColor: roleData.color,
                  color: currentPageRole === 'monitor' ? 'black' : 'white',
                }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-200, 200] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {loginMutation.isPending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    ACESSAR SISTEMA
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  </span>
                )}
              </PixelButton>
            </motion.div>

            <div className="mt-6 border-t border-slate-800 pt-4 flex flex-col gap-3 items-center">
              {currentPageRole === 'aluno' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
                  <p className="text-[10px] text-slate-500 mb-1 font-mono">Ainda não tem senha?</p>
                  <Link to="/first-access" onClick={() => playClick()}>
                    <span className="text-xs font-press text-green-400 hover:text-green-300 hover:underline transition-all cursor-pointer">
                      ATIVAR MEU CADASTRO
                    </span>
                  </Link>
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <Link to="/forgot-password" onClick={() => playClick()}>
                  <span className="text-[10px] font-mono text-slate-500 hover:text-slate-300 hover:underline transition-all cursor-pointer">
                    ESQUECI MINHA SENHA
                  </span>
                </Link>
              </motion.div>
            </div>
          </form>
        </PixelCard>
      </motion.div>
    </PageTransition>
  );
}