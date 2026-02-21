// ARQUIVO: frontend/src/pages/public/ResetPassword.tsx
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, } from 'framer-motion';
import { Lock, Loader2, CheckCircle, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { PageTransition } from '../../components/layout/PageTransition';

// 🔥 HOOK DE PERFORMANCE MOBILE
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isMobile = useIsMobile();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* --- TANSTACK QUERY: RESET PASSWORD MUTATION --- */
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SENHA ALTERADA! 🔐', {
        description: 'Redirecionando para login...'
      });
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
      toast.error('ERRO ❌', {
        description: error.response?.data?.message || 'Link inválido ou expirado.'
      });
    },
  });

  /* --- PASSWORD STRENGTH CALCULATOR --- */
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'FRACA', color: 'text-red-400' },
      { level: 2, label: 'MÉDIA', color: 'text-yellow-400' },
      { level: 3, label: 'BOA', color: 'text-blue-400' },
      { level: 4, label: 'FORTE', color: 'text-green-400' },
      { level: 5, label: 'MUITO FORTE', color: 'text-emerald-400' },
    ];

    return levels[Math.min(strength, 5)];
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (!confirm) return null;
    return password === confirm;
  }, [password, confirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.warning("As senhas não coincidem!");
    if (password.length < 6) return toast.warning("Senha deve ter no mínimo 6 caracteres!");
    if (!token) return toast.error("Token inválido!");

    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <PageTransition className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <PixelCard className="max-w-md w-full bg-slate-900/95 border-red-500/50 p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-red-900/20 rounded-full flex items-center justify-center border-4 border-red-500/30">
              <AlertTriangle className="text-red-400 w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h1 className="font-vt323 text-2xl md:text-3xl text-red-400 tracking-wider">TOKEN INVÁLIDO</h1>
            <p className="font-mono text-[10px] md:text-xs text-slate-400">O link de recuperação está ausente ou corrompido.</p>
            <button onClick={() => navigate('/forgot-password')} className="text-xs text-slate-400 hover:text-white underline font-mono transition-colors mt-4">
              Solicitar novo link
            </button>
          </div>
        </PixelCard>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-950 relative overflow-hidden">
      {/* Animated Background - OTIMIZADO */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent ${isMobile ? 'opacity-50' : ''}`} />
      </div>

      {/* Main Card */}
      <PixelCard className={`w-full max-w-md relative z-10 border-green-600/50 shadow-[0_0_30px_rgba(34,197,94,0.15)] ${isMobile ? 'bg-slate-900/95 p-6' : 'bg-slate-900/80 backdrop-blur-xl p-8'}`}>
        
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-4 border-green-500/50 shadow-lg">
              <Shield className="text-green-400 w-8 h-8 md:w-10 md:h-10" strokeWidth={2} />
            </div>
          </motion.div>

          <motion.h1 className="font-vt323 text-3xl md:text-4xl text-green-400 mb-2 leading-tight tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            NOVA SENHA
          </motion.h1>
          <motion.p className="font-mono text-[10px] md:text-xs text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Defina sua nova credencial de acesso
          </motion.p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          
          {/* Password Input */}
          <div>
            <label className="block text-slate-300 font-vt323 text-xl md:text-2xl mb-2 uppercase tracking-wider">NOVA SENHA</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors pointer-events-none z-10" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-black/40 border-2 border-slate-700/50 pl-12 pr-12 py-3 md:py-4 text-white font-mono text-sm focus:outline-none transition-all duration-300 focus:border-green-500 rounded-lg hover:border-slate-600 ${!isMobile && 'backdrop-blur-sm'}`}
                placeholder="••••••••"
                required
                disabled={resetPasswordMutation.isPending}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10" disabled={resetPasswordMutation.isPending}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength Indicator */}
            {password && (
              <motion.div className="mt-2 space-y-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.level ? (passwordStrength.level === 1 ? 'bg-red-500' : passwordStrength.level === 2 ? 'bg-yellow-500' : passwordStrength.level === 3 ? 'bg-blue-500' : 'bg-green-500') : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className={`font-vt323 text-xs md:text-sm tracking-wider ${passwordStrength.color}`}>FORÇA: {passwordStrength.label}</p>
              </motion.div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-slate-300 font-vt323 text-xl md:text-2xl mb-2 uppercase tracking-wider">CONFIRMAR SENHA</label>
            <div className="relative group">
              {passwordsMatch === true ? <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none z-10" size={20} /> : <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors pointer-events-none z-10" size={20} />}
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full bg-black/40 border-2 pl-12 pr-12 py-3 md:py-4 text-white font-mono text-sm focus:outline-none transition-all duration-300 rounded-lg hover:border-slate-600 ${!isMobile && 'backdrop-blur-sm'} ${passwordsMatch === true ? 'border-green-500/50 focus:border-green-500' : passwordsMatch === false ? 'border-yellow-500/50 focus:border-yellow-500' : 'border-slate-700/50 focus:border-green-500'}`}
                placeholder="••••••••"
                required
                disabled={resetPasswordMutation.isPending}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10" disabled={resetPasswordMutation.isPending}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirm && (
              <motion.div className="mt-2 flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {passwordsMatch ? <><CheckCircle className="text-green-400" size={14} /><p className="font-vt323 text-sm tracking-wider text-green-400 uppercase">Senhas conferem</p></> : <><AlertTriangle className="text-yellow-400" size={14} /><p className="font-vt323 text-sm tracking-wider text-yellow-400 uppercase">Senhas não conferem</p></>}
              </motion.div>
            )}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <PixelButton type="submit" disabled={resetPasswordMutation.isPending || !password || !confirm || password !== confirm} className="w-full flex justify-center items-center h-12 md:h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-vt323 text-xl md:text-2xl border-green-700 shadow-lg transition-all duration-300 disabled:opacity-50">
              {resetPasswordMutation.isPending ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /><span>REDEFININDO...</span></div> : 'REDEFINIR SENHA'}
            </PixelButton>
          </motion.div>

        </motion.form>

        <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-400 rounded-full opacity-50" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-400 rounded-full opacity-50" />
      </PixelCard>
    </PageTransition>
  );
}