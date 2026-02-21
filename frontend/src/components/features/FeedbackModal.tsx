import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Bug, Lightbulb, AlertTriangle, ThumbsUp } from 'lucide-react';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { PixelButton } from '../ui/PixelButton';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIAS = [
  { id: 'sugestao', label: 'Sugestão', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'bug', label: 'Bug / Erro', icon: Bug, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'critica', label: 'Crítica', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'elogio', label: 'Elogio', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-400/10' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [tipo, setTipo] = useState<string>('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) {
      toast.error('Selecione uma categoria!');
      return;
    }
    if (mensagem.length < 10) {
      toast.error('Escreva pelo menos 10 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback', { tipo, mensagem });
      toast.success('Feedback enviado! Obrigado por ajudar. 🚀');
      setMensagem('');
      setTipo('');
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MessageSquare size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-press text-lg text-white">FEEDBACK</h3>
                  <p className="text-xs text-slate-400 font-mono">AJUDE A MELHORAR O SISTEMA</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Seleção de Categoria */}
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTipo(cat.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                      ${tipo === cat.id 
                        ? `border-${cat.color.split('-')[1]}-500/50 ${cat.bg} ring-1 ring-${cat.color.split('-')[1]}-500/50` 
                        : 'border-white/5 hover:bg-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    <cat.icon size={18} className={cat.color} />
                    <span className={`text-sm font-medium ${tipo === cat.id ? 'text-white' : 'text-slate-400'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-500 uppercase">Sua Mensagem</label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Descreva seu feedback com detalhes..."
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  required
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <PixelButton 
                  type="submit" 
                  disabled={loading}
                  isLoading={loading}
                  className="px-6"
                >
                  <Send size={16} className="mr-2" />
                  ENVIAR
                </PixelButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}