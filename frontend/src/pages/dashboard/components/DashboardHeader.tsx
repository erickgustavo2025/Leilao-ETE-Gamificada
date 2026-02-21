import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Wallet, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper';
import { cn } from '../../../utils/cn';
import { NotificationBell } from '../../../components/layout/NotificationBell'; 

interface DashboardHeaderProps {
  user: any;
  currentMoney: number;
  rankPoints: number;
  currentRankObj: any;
  xpInfo: any;
}

export const DashboardHeader = memo(({ user, currentMoney, rankPoints, currentRankObj, xpInfo }: DashboardHeaderProps) => {
  
  // ⏳ LOADING STATE: Se os dados ainda não chegaram, mostramos placeholders.
  if (!currentRankObj || !xpInfo) {
    return (
      <div className="relative w-full mb-6 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[200px] animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl" />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-8 w-48 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ DADOS REAIS
  const rankStyle = currentRankObj;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
      className="relative w-full mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-6 shadow-2xl overflow-hidden"
    >
      {/* Fundo Decorativo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

      {/* 🔥 O SINO FICA AQUI (Posicionado no Topo Direito Absoluto) */}
      <div className="absolute top-4 right-4 z-50">
          <NotificationBell />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-center md:items-start text-center md:text-left mt-2 md:mt-0">
        
        {/* Esquerda: Perfil */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative">
            <div className={cn("w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-lg bg-slate-950", rankStyle.border)}>
              <img 
                src={getImageUrl(user.avatar)} 
                alt={user.nome} 
                className="w-full h-full object-cover"
                onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.nome}&background=random`}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 shadow-md flex items-center justify-center">
              <Trophy size={14} className={rankStyle.color} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-press text-[10px] text-slate-400 mb-1 tracking-wider uppercase">BEM-VINDO AO SISTEMA</p>
            <h2 className="font-vt323 text-3xl md:text-4xl text-white truncate leading-none mb-2 uppercase">
              {user.nome?.split(' ')[0]}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="bg-blue-900/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono rounded">
                {user.turma || 'Sem turma'}
              </span>
              <span className={cn("px-2 py-0.5 text-[10px] font-mono rounded border bg-black/40 flex items-center gap-1", rankStyle.color, rankStyle.border)}>
                <Sparkles size={10} />
                {rankStyle.name}
              </span>
            </div>
          </div>
        </div>

        {/* Direita: Stats */}
        <div className="flex flex-col items-center md:items-end min-w-[200px] mt-4 md:mt-0 pr-0 md:pr-10">
          <div className="text-center md:text-right mb-3">
            <p className="font-vt323 text-lg text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-end gap-2">
               <Wallet size={16} /> SALDO DISPONÍVEL
            </p>
            <p className="font-vt323 text-4xl text-emerald-400 drop-shadow-sm leading-none">
              PC$ {currentMoney.toLocaleString()}
            </p>
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>{rankPoints.toLocaleString()} XP</span>
              <span>{xpInfo.percentage?.toFixed(0) || 0}%</span>
            </div>
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${xpInfo.percentage || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-[9px] font-mono text-slate-500 mt-1 text-right">
              {xpInfo.isMaxRank ? 'MAX RANK' : `Próx: ${xpInfo.nextRank || '...'}`}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';