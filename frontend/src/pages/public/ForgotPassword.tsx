// ARQUIVO: frontend/src/pages/public/ForgotPassword.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, KeyRound, Sparkles, CheckCircle2, } from 'lucide-react';
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

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const isMobile = useIsMobile();

  /* --- TANSTACK QUERY: FORGOT PASSWORD MUTATION --- */
  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailData: string) => {
      const response = await api.post('/auth/forgot-password', { email: emailData.trim() });
      return response.data;
    },
    onSuccess: () => {
      setSent(true);
      toast.success('EMAIL ENVIADO! 📧', { 
        description: 'Verifique sua caixa de entrada.' 
      });
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
      toast.error('ERRO ❌', { 
        description: error.response?.data?.message || 'Email não encontrado no sistema.' 
      });
    },
  });

  /* --- FORM HANDLER --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    forgotPasswordMutation.mutate(email);
  };

  const handleTryAgain = () => {
    setSent(false);
    setEmail('');
  };

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-950 relative overflow-hidden">
      {/* Animated Background - OTIMIZADO PARA MOBILE */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full ${isMobile ? 'blur-xl' : 'blur-3xl'}`}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent ${isMobile ? 'opacity-50' : ''}`} />
      </div>

      {/* Main Card - BLUR CONDICIONAL E PADDING AJUSTADO */}
      <PixelCard className={`w-full max-w-md relative z-10 border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] ${isMobile ? 'bg-slate-900/95 p-6' : 'bg-slate-900/80 backdrop-blur-xl p-8'}`}>
        
        {/* Back Button */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 font-mono mb-6 transition-colors text-xs group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span>VOLTAR</span>
        </Link>

        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <motion.div
            className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-4 border-yellow-500/50 shadow-lg">
              <KeyRound className="text-yellow-400 w-8 h-8 md:w-10 md:h-10" strokeWidth={2} />
            </div>
            {!isMobile && (
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-yellow-400 w-5 h-5" />
              </motion.div>
            )}
          </motion.div>

          {/* Title - FONTE CORRIGIDA */}
          <motion.h1 
            className="font-vt323 text-3xl md:text-4xl text-yellow-400 mb-2 leading-tight tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            RECUPERAR ACESSO
          </motion.h1>

          <motion.p 
            className="font-mono text-[10px] md:text-xs text-slate-400 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {sent 
              ? 'Verifique seu email para continuar.' 
              : 'Digite seu email cadastrado para redefinir a senha.'
            }
          </motion.p>
        </motion.div>

        {/* Form/Success */}
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                {/* FONTE CORRIGIDA */}
                <label className="block text-slate-300 font-vt323 text-xl md:text-2xl mb-2 uppercase tracking-wider">
                  EMAIL CADASTRADO
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-400 transition-colors pointer-events-none z-10" size={20} />
                  
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-black/40 border-2 border-slate-700/50 pl-12 pr-4 py-3 md:py-4 text-white font-mono text-sm focus:outline-none transition-all duration-300 focus:border-yellow-500 rounded-lg hover:border-slate-600 ${!isMobile && 'backdrop-blur-sm'}`}
                    placeholder="seuemail@exemplo.com"
                    required
                    disabled={forgotPasswordMutation.isPending}
                    autoComplete="email"
                  />
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <PixelButton 
                  type="submit" 
                  disabled={forgotPasswordMutation.isPending || !email}
                  className="w-full flex justify-center items-center h-12 md:h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-vt323 text-xl md:text-2xl border-yellow-700 shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>ENVIANDO...</span>
                    </div>
                  ) : (
                    'ENVIAR LINK'
                  )}
                </PixelButton>
              </motion.div>

              <motion.p
                className="text-center text-slate-400 text-[10px] md:text-xs font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Você receberá um email com instruções
              </motion.p>
            </motion.form>
          ) : (
            /* SUCCESS SCREEN */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}>
                <div className="relative">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-green-400/30 shadow-lg">
                    <CheckCircle2 className="text-white w-10 h-10 md:w-12 md:h-12" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>

              <motion.div className="text-center space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="font-vt323 text-3xl md:text-4xl text-green-400 leading-tight tracking-wider">
                  EMAIL ENVIADO!
                </h2>
                <p className="font-mono text-xs text-slate-300">
                  Verifique sua caixa de entrada
                </p>
              </motion.div>

              <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="bg-slate-800/40 border border-green-500/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="text-green-400" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-vt323 text-base md:text-lg text-green-400 mb-1 tracking-wider">DESTINATÁRIO</p>
                      <p className="font-mono text-[10px] md:text-xs text-slate-300 break-all">{email}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.button
                onClick={handleTryAgain}
                className="w-full text-center text-[10px] md:text-xs text-slate-400 hover:text-white underline font-mono py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                Tentar outro email
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full opacity-50" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-400 rounded-full opacity-50" />
      </PixelCard>
    </PageTransition>
  );
}