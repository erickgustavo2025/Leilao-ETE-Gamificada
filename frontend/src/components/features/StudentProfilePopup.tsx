import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Trophy } from 'lucide-react';
import { api } from '../../api/axios-config';
import { getImageUrl } from '../../utils/imageHelper';
import { calculateRank } from '../../utils/rankHelper';
import { useAuth } from '../../contexts/AuthContext';

export interface StudentProfileData {
  _id: string;
  nome: string;
  turma: string;
  saldoPc: number;
  maxPcAchieved: number;
  avatar?: string;
  isVip?: boolean;
  rankPosition: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  prefetchedData?: StudentProfileData;
}

export function StudentProfilePopup({ isOpen, onClose, studentId, prefetchedData }: Props) {
  const { ranks } = useAuth();
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(false);
      setLoading(false);
      return;
    }

    if (prefetchedData) {
      setData(prefetchedData);
      setLoading(false);
      setError(false);
      return;
    }

    if (!studentId) return;

    setLoading(true);
    setError(false);
    setData(null);

    api.get(`/public/profile/${studentId}`)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOpen, studentId, prefetchedData]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const rankInfo = data ? calculateRank(data.maxPcAchieved, ranks) : null;

  // createPortal garante que o popup renderiza no body,
  // independente de qual container pai tem transform/overflow
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs bg-slate-900 border-2 border-slate-600 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {loading && (
              <div className="p-16 flex flex-col items-center justify-center">
                <div className="animate-spin mb-3">
                  <Trophy className="text-yellow-400" size={24} />
                </div>
                <p className="font-press text-[10px] text-slate-400 animate-pulse">CARREGANDO...</p>
              </div>
            )}

            {error && (
              <div className="p-16 flex flex-col items-center justify-center">
                <p className="font-press text-[10px] text-red-400">ERRO AO CARREGAR PERFIL</p>
                <button onClick={onClose} className="mt-3 font-mono text-xs text-slate-500 hover:text-white">
                  FECHAR
                </button>
              </div>
            )}

            {data && !loading && !error && (
              <>
                {/* Banner */}
                <div className="h-20 relative bg-gradient-to-b from-slate-700 to-slate-900" />

                {/* Avatar */}
                <div className="flex justify-center -mt-12 relative z-10">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-500 bg-slate-800 shadow-2xl">
                    {data.avatar ? (
                      <img src={getImageUrl(data.avatar)} alt={data.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-press text-2xl uppercase bg-slate-700">
                        {data.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-6 pb-6 pt-3 text-center space-y-4">
                  <div>
                    <h3 className="font-vt323 text-2xl text-white leading-tight">
                      {data.nome}
                      {data.isVip && <span className="ml-1 text-yellow-400">⭐</span>}
                    </h3>
                    <p className="font-mono text-xs text-slate-400 mt-1">{data.turma || 'Sem turma'}</p>
                  </div>

                  <div className="inline-block px-3 py-1 rounded-full font-press text-[10px] uppercase tracking-wider border border-slate-600 bg-slate-800/50 text-yellow-400">
                    {rankInfo?.name || 'INICIANTE'}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap size={12} className="text-yellow-400" />
                        <span className="font-press text-[8px] text-slate-500">PC$</span>
                      </div>
                      <p className="font-vt323 text-xl text-yellow-400">{data.saldoPc.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Trophy size={12} className="text-blue-400" />
                        <span className="font-press text-[8px] text-slate-500">POSIÇÃO</span>
                      </div>
                      <p className="font-vt323 text-xl text-blue-400">#{data.rankPosition}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
