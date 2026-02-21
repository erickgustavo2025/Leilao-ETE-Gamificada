import { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { 
  User, Shield, Mail, Lock, Camera, Loader2, Crown, 
  Check, X, TrendingUp, Target, Award, Zap, LogOut,
  Eye, EyeOff, Key
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRank, calculateRankProgress } from '../../utils/rankHelper';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { AvatarCropper } from '../../components/ui/AvatarCropper';
import { getImageUrl } from '../../utils/imageHelper';
import { cn } from '../../utils/cn';

// ========================
// HOOK: Detectar Mobile
// ========================
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

// ========================
// CONFIGURAÇÃO DE CARGOS
// ========================
const ROLE_TRANSLATOR: Record<string, { label: string; icon: string; style: string; glow: string }> = {
  'monitor_disciplina': { label: 'Monitor de Disciplina', icon: '🤓', style: 'border-blue-500 text-blue-400 bg-blue-900/20', glow: 'shadow-blue-500/20' },
  'monitor_escola': { label: 'Monitor da Escola', icon: '🏫', style: 'border-indigo-500 text-indigo-400 bg-indigo-900/20', glow: 'shadow-indigo-500/20' },
  'armada_dumbledore': { label: 'Armada de Dumbledore', icon: '🧙', style: 'border-purple-500 text-purple-400 bg-purple-900/20', glow: 'shadow-purple-500/20' },
  'monitor_biblioteca': { label: 'Monitor da Biblioteca', icon: '📚', style: 'border-amber-500 text-amber-400 bg-amber-900/20', glow: 'shadow-amber-500/20' },
  'monitor_quadra': { label: 'Monitor da Quadra', icon: '⚽', style: 'border-green-500 text-green-400 bg-green-900/20', glow: 'shadow-green-500/20' },
  'banda': { label: 'Integrante da Banda', icon: '🎼', style: 'border-rose-500 text-rose-400 bg-rose-900/20', glow: 'shadow-rose-500/20' },
  'representante': { label: 'Representante', icon: '🫡', style: 'border-slate-400 text-slate-300 bg-slate-800/50', glow: 'shadow-slate-500/20' },
  'colaborador': { label: 'Colaborador', icon: '🎮', style: 'border-cyan-500 text-cyan-400 bg-cyan-900/20', glow: 'shadow-cyan-500/20' },
  'estudante_honorario': { label: 'Estudante Honorário', icon: '😎', style: 'border-yellow-500 text-yellow-400 bg-yellow-900/20', glow: 'shadow-yellow-500/20' },
  'rank_epico_supremo': { label: 'Épico Supremo', icon: '🔥', style: 'border-red-500 text-red-400 bg-red-900/20', glow: 'shadow-red-500/20' }
};

// ========================
// COMPONENTE: Stat Card
// ========================
interface StatCardProps extends HTMLMotionProps<"div"> {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  index: number;
  isMobile: boolean;
}

const StatCard = memo(({ icon: Icon, label, value, color, index, isMobile, ...props }: StatCardProps) => {
  const motionProps: HTMLMotionProps<"div"> = isMobile ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: index * 0.05 }
  } : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.05 }
  };

  return (
    <motion.div {...motionProps} {...props} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-black/30", color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="font-mono text-[10px] text-slate-500 uppercase">{label}</p>
        <p className="font-vt323 text-2xl text-white">{value}</p>
      </div>
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function Profile() {
  const { user, logout, refreshUser, ranks } = useAuth();
  const isMobile = useIsMobile();

  // Estados UI
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'password' | 'email' | null>(null);
  const [showPassword, setShowPassword] = useState(false); 
  
  // Estados Forms
  const [vipCode, setVipCode] = useState('');
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [emailData, setEmailData] = useState({ pass: '', newEmail: '' });
  const [error, setError] = useState<string | null>(null);

  // ========================
  // MUTATION 1: Salvar Avatar
  // ========================
  const saveAvatarMutation = useMutation({
    mutationFn: async (croppedBlob: Blob) => {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      await api.put('/users/avatar', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
    },
    onSuccess: () => {
      toast.success("Foto atualizada!");
      setIsCropperOpen(false);
      refreshUser();
    },
    onError: () => {
      toast.error("Erro ao salvar foto.");
    }
  });

  // ========================
  // MUTATION 2: Ativar VIP
  // ========================
  const activateVipMutation = useMutation({
    mutationFn: async (code: string) => {
      await api.post('/users/vip-code', { code });
    },
    onSuccess: () => {
      toast.success("PARABÉNS! VOCÊ AGORA É VIP! 👑");
      setVipCode('');
      refreshUser();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Código inválido.");
    }
  });

  // ========================
  // MUTATION 3: Mudar Senha
  // ========================
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current: string; newPass: string }) => {
      await api.put('/auth/change-password', { 
        senhaAtual: data.current, 
        novaSenha: data.newPass 
      });
    },
    onSuccess: () => {
      toast.success("Senha alterada!");
      setActiveModal(null);
      setPassData({ current: '', new: '', confirm: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Erro ao alterar senha.");
    }
  });

  // ========================
  // MUTATION 4: Mudar Email
  // ========================
  const changeEmailMutation = useMutation({
    mutationFn: async (data: { password: string; newEmail: string }) => {
      await api.put('/auth/change-email', { 
        senha: data.password, 
        novoEmail: data.newEmail 
      });
    },
    onSuccess: () => {
      toast.success("Email atualizado!");
      setActiveModal(null);
      setEmailData({ pass: '', newEmail: '' });
      setError(null);
      refreshUser();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Erro ao alterar email.");
    }
  });

  // ========================
  // HANDLERS
  // ========================
  const handleSaveAvatar = useCallback((croppedBlob: Blob) => {
    saveAvatarMutation.mutate(croppedBlob);
  }, [saveAvatarMutation]);

  const handleActivateVip = () => {
    if (!vipCode.trim()) return;
    activateVipMutation.mutate(vipCode);
  };

  const handleChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      setError("Senhas não conferem.");
      return;
    }
    changePasswordMutation.mutate({ 
      current: passData.current, 
      newPass: passData.new 
    });
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    changeEmailMutation.mutate({ 
      password: emailData.pass, 
      newEmail: emailData.newEmail 
    });
  };

  // ========================
  // COMPUTED
  // ========================
  const currentPoints = user?.maxPcAchieved || 0;
  const currentRank = calculateRank(currentPoints, ranks);
  const rankProgress = calculateRankProgress(currentPoints, ranks);
  
  const nextRankThreshold = rankProgress.isMaxRank ? 'MAX' : (currentPoints + rankProgress.pointsToNext);

  const rankIndex = ranks.findIndex((r: any) => r.name === currentRank?.name);
  const userLevel = rankIndex !== -1 ? rankIndex + 1 : 1;

  const userRoles = (user?.cargos || []).filter((role: string) => ROLE_TRANSLATOR[role]);

  const stats = [
    { icon: TrendingUp, label: "Máximo PC", value: user?.maxPcAchieved?.toLocaleString() || 0, color: "text-green-400" },
    { icon: Target, label: "Nível", value: userLevel, color: "text-blue-400" },
    { icon: Award, label: "Conquistas", value: userRoles.length, color: "text-yellow-400" },
    { icon: Zap, label: "Skills", value: user?.inventory?.filter((i:any) => i.category === 'RANK_SKILL').length || 0, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden pb-24">
      {/* Background Otimizado */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn(
          "absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/20 to-transparent",
          !isMobile && "blur-3xl"
        )} />
      </div>

      <div className="relative z-10 px-4 py-6 md:pl-28 pt-16 md:pt-8 max-w-5xl mx-auto">
        
        {/* Cartão Principal */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-30 pointer-events-none", currentRank?.color?.replace('text-', 'bg-'))} />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className={cn(
                "w-32 h-32 md:w-40 md:h-40 rounded-full border-4 overflow-hidden bg-black shadow-2xl relative",
                currentRank?.border || "border-slate-700"
              )}>
                <img 
                  src={getImageUrl(user?.avatar)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setIsCropperOpen(true)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="text-white w-8 h-8" />
                </button>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-press px-3 py-1 rounded-full border border-blue-400 whitespace-nowrap">
                LVL {userLevel}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              <div>
                <h1 className="font-press text-2xl md:text-3xl text-white mb-2">{user?.nome}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-press border flex items-center gap-2",
                    currentRank?.border || "border-slate-600",
                    currentRank?.color?.replace('text-', 'bg-') + "/10",
                    currentRank?.color || "text-slate-400"
                  )}>
                    {currentRank?.name || "INICIANTE"}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700 flex items-center gap-2">
                    <Shield size={12} /> {user?.matricula}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700 flex items-center gap-2">
                    <User size={12} /> {user?.turma}
                  </span>
                  {user?.isVip && (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 font-mono text-xs border border-yellow-500/30 flex items-center gap-2 shadow-[0_0_10px_rgba(234,179,8,0.2)] animate-pulse">
                      <Crown size={12} /> VIP MEMBER
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Rank/XP */}
              <div className="max-w-lg mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  <span>Progresso do Rank</span>
                  <span className={currentRank?.color}>{currentPoints} / {nextRankThreshold} XP</span>
                </div>
                <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <motion.div 
                    className={cn("h-full", currentRank?.color?.replace('text-', 'bg-') || "bg-blue-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${rankProgress.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-right text-[9px] font-mono text-slate-500 mt-1">
                  {rankProgress.isMaxRank ? 'RANK MÁXIMO ATINGIDO' : `Faltam ${rankProgress.pointsToNext} PC$ para ${rankProgress.nextRank}`}
                </p>
              </div>

              {/* Ações Rápidas */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                <button onClick={() => { setError(null); setShowPassword(false); setActiveModal('password'); }} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700 transition-colors flex items-center gap-2">
                    <Lock size={12}/> SENHA
                </button>
                <button onClick={() => { setError(null); setShowPassword(false); setActiveModal('email'); }} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700 transition-colors flex items-center gap-2">
                    <Mail size={12}/> EMAIL
                </button>
                <button 
                  onClick={logout}
                  className="px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/30 font-mono text-[10px] flex items-center gap-2 transition-colors"
                >
                  <LogOut size={12} /> SAIR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas (Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx: number) => (
            <StatCard key={idx} {...stat} index={idx} isMobile={isMobile} />
          ))}
        </div>

        {/* Cargos e Conquistas */}
        {userRoles.length > 0 && (
          <div className="mb-8">
            <h3 className="font-press text-xs text-slate-500 uppercase ml-1 mb-3">Conquistas & Cargos</h3>
            <div className="flex flex-wrap gap-3">
              {userRoles.map((role: string) => {
                const config = ROLE_TRANSLATOR[role];
                return (
                  <div key={role} className={cn("px-4 py-2 rounded-xl border flex items-center gap-3 bg-slate-900", config.style, config.glow)}>
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-vt323 text-xl leading-none">{config.label}</p>
                      <p className="font-mono text-[9px] opacity-70">ATIVO</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Área VIP */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-vt323 text-xl text-yellow-500 mb-4 flex items-center gap-2">
                <Crown size={18}/> ÁREA VIP
            </h3>
            
            {user?.isVip ? (
                <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                        <Check size={24} className="text-yellow-400"/>
                    </div>
                    <div>
                        <p className="font-press text-white text-sm">VIP ATIVO</p>
                        <p className="font-mono text-[10px] text-yellow-200/70">Aproveite seus benefícios exclusivos.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="font-mono text-[10px] text-slate-500 mb-1 block">CÓDIGO DE ATIVAÇÃO</label>
                        <input 
                            type="text" 
                            placeholder="DIGITE SEU CÓDIGO..."
                            value={vipCode}
                            onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                            className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-yellow-500 outline-none uppercase"
                        />
                    </div>
                    <button 
                        onClick={handleActivateVip}
                        disabled={activateVipMutation.isPending || !vipCode}
                        className="w-full md:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-lg font-press text-xs transition-colors flex items-center justify-center gap-2"
                    >
                        {activateVipMutation.isPending ? <Loader2 className="animate-spin" size={14}/> : <><Crown size={14}/> ATIVAR</>}
                    </button>
                </div>
            )}
        </div>

      </div>

      {/* MODAL: SENHA / EMAIL */}
      <AnimatePresence>
        {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm relative shadow-2xl"
                >
                    <button onClick={() => { setActiveModal(null); setError(null); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                    
                    <h2 className="font-press text-white text-lg mb-6 flex items-center gap-2">
                        {activeModal === 'password' ? <><Key size={20} className="text-blue-400"/> SENHA</> : <><Mail size={20} className="text-blue-400"/> EMAIL</>}
                    </h2>

                    <form onSubmit={activeModal === 'password' ? handleChangePass : handleChangeEmail} className="space-y-4">
                        {activeModal === 'password' ? (
                            <>
                                <input type="password" placeholder="Senha Atual" required value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="w-full bg-black/50 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500"/>
                                
                                <div className="relative">
                                  <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Nova Senha" 
                                    required 
                                    value={passData.new} 
                                    onChange={e => setPassData({...passData, new: e.target.value})} 
                                    className="w-full bg-black/50 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500 pr-10"
                                  />
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                  </button>
                                </div>

                                <input type="password" placeholder="Confirmar Senha" required value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full bg-black/50 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500"/>
                            </>
                        ) : (
                            <>
                                <input type="password" placeholder="Senha Atual (Confirmação)" required value={emailData.pass} onChange={e => setEmailData({...emailData, pass: e.target.value})} className="w-full bg-black/50 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500"/>
                                <input type="email" placeholder="Novo Email" required value={emailData.newEmail} onChange={e => setEmailData({...emailData, newEmail: e.target.value})} className="w-full bg-black/50 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500"/>
                            </>
                        )}

                        {error && (
                          <div className="text-red-400 text-xs font-mono flex items-center gap-2 bg-red-900/20 p-2 rounded">
                            <X size={12} /> {error}
                          </div>
                        )}
                        
                        <button 
                          type="submit" 
                          disabled={activeModal === 'password' ? changePasswordMutation.isPending : changeEmailMutation.isPending} 
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-press text-xs flex items-center justify-center gap-2"
                        >
                            {(activeModal === 'password' ? changePasswordMutation.isPending : changeEmailMutation.isPending) 
                              ? <Loader2 className="animate-spin" size={16}/> 
                              : 'SALVAR ALTERAÇÕES'}
                        </button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AvatarCropper 
        isOpen={isCropperOpen} 
        onClose={() => setIsCropperOpen(false)} 
        onSave={handleSaveAvatar} 
      />
    </div>
  );
}