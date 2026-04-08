import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, ExternalLink, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface PrivacyModalProps {
  isOpen: boolean;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen }) => {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const { refreshUser } = useAuth();

  const handleAccept = async () => {
    if (!checked) {
      toast.error('Você precisa marcar que leu os termos antes de continuar.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/accept-privacy');
      await refreshUser();
      toast.success('Seja bem-vindo(a) à ETE Gamificada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao registrar aceite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl shadow-cyan-500/10"
        >
          {/* Top Design Element */}
          <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />
          
          <div className="p-8 md:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-5 bg-slate-950 rounded-2xl border border-slate-800 text-cyan-400">
                  <Shield size={40} />
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4">
              Sua Privacidade Importa
            </h2>
            
            <p className="text-slate-400 text-center text-sm md:text-base leading-relaxed mb-8">
              Antes de mergulhar na economia da ETE, precisamos que você leia e aceite nossa 
              nova <strong>Política de Privacidade</strong> em conformidade com o ECA Digital (Lei 15.211/2025).
            </p>

            {/* Quick Info Points */}
            <div className="space-y-3 mb-8">
              {[
                'Seus dados são usados apenas para fins escolares.',
                'O Oráculo GIL registra conversas para melhoria do suporte.',
                'Nenhum dado é compartilhado com empresas externas.'
              ].map((text, i) => (
                <div key={i} className="flex gap-3 text-xs text-slate-500 bg-slate-950/50 p-3 rounded-xl border border-slate-800/30">
                  <Lock size={14} className="text-cyan-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Accept Section */}
            <div className="space-y-6">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setChecked(!checked)}
              >
                <div className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                  ${checked ? 'bg-cyan-500 border-cyan-500' : 'bg-transparent border-slate-700 group-hover:border-slate-500'}
                `}>
                  {checked && <Check size={16} className="text-white" />}
                </div>
                <span className="text-sm text-slate-300">
                  Li e concordo com a <Link to="/politica-privacidade" target="_blank" className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium">Política de Privacidade <ExternalLink size={12} /></Link>
                </span>
              </div>

              <button
                onClick={handleAccept}
                disabled={loading || !checked}
                className={`
                  w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                  ${loading || !checked 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Buscando Selo de Aceite...
                  </>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
