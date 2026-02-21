// ═══════════════════════════════════════════════════════════════════════════════
// 📱 ARQUIVO: frontend/src/pages/public/FirstAccess.tsx
// 🎨 REDESIGN SSS+ com PERFORMANCE MOBILE EXTREMA
// ⚡ 2 STEPS: Validar Identidade → Criar Conta + Auto-Login
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, memo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {  useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Calendar, Mail, Key, Loader2,
  CheckCircle, Shield, Sparkles, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { PageTransition } from '../../components/layout/PageTransition';
import { useAuth } from '../../contexts/AuthContext';
import { useGameSound } from '../../hooks/useGameSound';

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
// 🌟 PARTÍCULA FLUTUANTE
// ═══════════════════════════════════════════════════════════════════════════════
const FloatingParticle = memo(({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-green-500 blur-sm pointer-events-none"
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
      scale: [1, 1.2, 1],
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
// 💪 STRENGTH METER
// ═══════════════════════════════════════════════════════════════════════════════
const PasswordStrength = memo(({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    if (password.length < 6) return { level: 1, text: 'FRACA', color: 'bg-red-500' };
    if (password.length < 8) return { level: 2, text: 'MÉDIA', color: 'bg-yellow-500' };
    if (password.length < 10) return { level: 3, text: 'BOA', color: 'bg-blue-500' };
    return { level: 4, text: 'FORTE', color: 'bg-green-500' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= strength.level ? strength.color : 'bg-slate-700'}`}
          />
        ))}
      </div>
      <p className="text-[10px] font-mono text-slate-400">
        Força: <span className={strength.color.replace('bg-', 'text-')}>{strength.text}</span>
      </p>
    </motion.div>
  );
});
PasswordStrength.displayName = 'PasswordStrength';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function FirstAccess() {
  const navigate = useNavigate();
  // 🔥 CORREÇÃO 1: Trouxemos o updateUser no lugar do signIn
  const { updateUser } = useAuth(); 
  const { playSuccess, playError } = useGameSound();

  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');

  const [formData, setFormData] = useState({
    matricula: '',
    dataNascimento: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const isMobile = useIsMobile();
  const particleCount = isMobile ? 3 : 12;
  const cardBlurClass = isMobile ? 'bg-slate-900/95' : 'bg-slate-900/80 backdrop-blur-xl';



  // ✅ VALIDATE Mutation (Step 1)
  const validateMutation = useMutation({
    mutationFn: async (payload: { matricula: string; dataNascimento: string }) => {
      const res = await api.post('/auth/first-access', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      setUserId(data.id);
      setStep(2);
      playSuccess();
      toast.success('ALUNO ENCONTRADO! 🎓', { description: 'Agora crie sua senha.' });
    },
    onError: (_err: any) => {
      playError();
      const msg = _err.response?.data?.message || 'Dados incorretos ou conta já ativa.';
      toast.error('ERRO NA VALIDAÇÃO ❌', { description: msg });
    }
  });

  // ✅ ACTIVATE Mutation (Step 2)
  const activateMutation = useMutation({
    mutationFn: async (payload: { id: string; email: string; senha: string }) => {
      // 🚨 AVISO DO CTO: Troque '/auth/register' abaixo pela rota CORRETA do seu backend
      // que faz a ativação (Ex: '/auth/first-access/activate' ou '/auth/setup').
      // Se não trocar, o backend vai continuar gerando senha aleatória e mandando por email!
      const res = await api.post('/auth/register', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      const { token, user } = data;
      
      // 🔥 CORREÇÃO 2: Fazendo o Auto-Login manual para evitar o crash do Zod!
      localStorage.setItem('@ETEGamificada:token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUser(user);

      playSuccess();
      toast.success('CONTA ATIVADA! ⚔️', { description: 'Entrando no sistema...' });

      setTimeout(() => navigate('/dashboard'), 500);
    },
    onError: (_err: any) => {
      playError();
      const zodError = _err.response?.data?.error;
      const msg = zodError ? "Erro de validação de campos." : (_err.response?.data?.message || 'Erro ao ativar conta.');

      toast.error('FALHA NA ATIVAÇÃO 💀', { description: msg });
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleValidate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const dataFormatada = formData.dataNascimento.includes('-')
        ? formData.dataNascimento.split('-').reverse().join('/')
        : formData.dataNascimento;

      validateMutation.mutate({
        matricula: formData.matricula,
        dataNascimento: dataFormatada,
      });
    },
    [formData.matricula, formData.dataNascimento, validateMutation]
  );

  const handleActivate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const senhaStr = String(formData.senha || '');
      const confirmarStr = String(formData.confirmarSenha || '');
      const emailStr = String(formData.email || '');

      if (senhaStr !== confirmarStr) {
        playError();
        toast.warning('AS SENHAS NÃO COINCIDEM! ❌');
        return;
      }
      if (senhaStr.length < 6) {
        playError();
        toast.warning('SENHA FRACA! 🔒', { description: 'Mínimo de 6 caracteres.' });
        return;
      }

      activateMutation.mutate({
        id: userId,
        email: emailStr,
        senha: senhaStr,
      });
    },
    [formData.senha, formData.confirmarSenha, formData.email, userId, activateMutation, playError]
  );

  const loading = validateMutation.isPending || activateMutation.isPending;

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 md:p-6 relative bg-[#050505] overflow-hidden">
      {/* BACKGROUND CYBERPUNK VERDE */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 rounded-full ${isMobile ? '' : 'blur-[120px]'}`} animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ willChange: 'transform, opacity' }} />
        <motion.div className={`absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-yellow-500/15 rounded-full ${isMobile ? '' : 'blur-[100px]'}`} animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} style={{ willChange: 'transform, opacity' }} />
        <motion.div className={`absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full ${isMobile ? '' : 'blur-[100px]'}`} animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }} style={{ willChange: 'transform, opacity' }} />
        <div className={`absolute inset-0 ${isMobile ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: isMobile ? '60px 60px' : '50px 50px' }} />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(particleCount)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.4} size={Math.random() * 6 + 2} />
        ))}
      </div>

      {/* CARD PRINCIPAL */}
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 200 }} className="w-full max-w-lg relative z-10">
        <motion.div className="absolute -inset-1 bg-green-500/20 rounded-2xl blur-xl" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />

        <PixelCard className={`relative ${cardBlurClass} border-green-500/30`}>
          <Link to="/login/aluno" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-mono mb-6 transition-colors text-xs group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>VOLTAR PARA LOGIN</span>
          </Link>

          <div className="text-center mb-8">
            <motion.div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/50 relative overflow-hidden" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="absolute inset-0 bg-green-500/20 rounded-full" />
              <Shield className="w-10 h-10 text-green-500 relative z-10" />
            </motion.div>

            <motion.h2 className="text-2xl md:text-3xl font-press text-green-500 mb-2" style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              PRIMEIRO ACESSO
            </motion.h2>

            <AnimatePresence mode="wait">
              <motion.p key={step} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-xs md:text-sm font-vt323 text-slate-400 tracking-wider">
                {step === 1 ? 'Valide sua identidade escolar.' : 'Defina seus dados de acesso.'}
              </motion.p>
            </AnimatePresence>

            <motion.div className="flex items-center justify-center gap-2 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <div className={`flex items-center gap-2 transition-all duration-300 ${step === 1 ? 'text-green-500' : 'text-green-600'}`}>
                {step > 1 ? <CheckCircle size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-green-500" /></div>}
                <span className="font-mono text-[10px]">VALIDAR</span>
              </div>
              <div className={`w-12 h-0.5 transition-all duration-500 ${step > 1 ? 'bg-green-500' : 'bg-slate-700'}`} />
              <div className={`flex items-center gap-2 transition-all duration-300 ${step === 2 ? 'text-green-500' : 'text-slate-600'}`}>
                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${step === 2 ? 'border-green-500' : 'border-slate-700'} flex items-center justify-center`}>
                  {step === 2 && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
                <span className="font-mono text-[10px]">CRIAR</span>
              </div>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} onSubmit={handleValidate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-slate-400 font-vt323 text-lg mb-2 uppercase tracking-wider"><User size={14} /> MATRÍCULA</label>
                    <input name="matricula" type="text" value={formData.matricula} onChange={handleChange} className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 p-3 text-white font-mono focus:outline-none transition-all focus:border-green-500 focus:bg-black rounded-lg text-base`} placeholder="000000" required />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-slate-400 font-vt323 text-lg mb-2 uppercase tracking-wider"><Calendar size={14} /> NASCIMENTO</label>
                    <input name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleChange} className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 p-3 text-white font-mono focus:outline-none transition-all focus:border-green-500 focus:bg-black rounded-lg text-base`} required />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <PixelButton type="submit" variant="success" className="w-full mt-6 flex justify-center items-center gap-2 h-14 relative overflow-hidden group" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={16} /> VALIDAR DADOS</>}
                  </PixelButton>
                </motion.div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-slate-400 font-vt323 text-lg mb-2 uppercase tracking-wider"><Mail size={14} /> EMAIL PESSOAL</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 p-3 text-white font-mono focus:outline-none transition-all focus:border-green-500 focus:bg-black rounded-lg text-base`} placeholder="seu@email.com" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-slate-400 font-vt323 text-lg mb-2 uppercase tracking-wider"><Key size={14} /> NOVA SENHA</label>
                    <input name="senha" type="password" value={formData.senha} onChange={handleChange} className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 p-3 text-white font-mono focus:outline-none transition-all focus:border-green-500 focus:bg-black rounded-lg text-base`} placeholder="••••••" required />
                    <PasswordStrength password={formData.senha} />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-slate-400 font-vt323 text-lg mb-2 uppercase tracking-wider"><Key size={14} /> CONFIRMAR</label>
                    <input name="confirmarSenha" type="password" value={formData.confirmarSenha} onChange={handleChange} className={`w-full ${isMobile ? 'bg-black/95' : 'bg-black/80 backdrop-blur-sm'} border-2 border-slate-700 p-3 text-white font-mono focus:outline-none transition-all focus:border-green-500 focus:bg-black rounded-lg text-base`} placeholder="••••••" required />
                    {formData.confirmarSenha && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-2">
                        {formData.senha === formData.confirmarSenha ? <><CheckCircle size={12} className="text-green-500" /><span className="text-[10px] font-mono text-green-500">Senhas conferem</span></> : <><AlertTriangle size={12} className="text-yellow-500" /><span className="text-[10px] font-mono text-yellow-500">Senhas diferentes</span></>}
                      </motion.div>
                    )}
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <PixelButton type="submit" variant="success" className="w-full mt-6 flex justify-center items-center gap-2 h-14 relative overflow-hidden group" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={16} /> ATIVAR CONTA</>}
                  </PixelButton>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </PixelCard>
      </motion.div>
    </PageTransition>
  );
}