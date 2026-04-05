import { useState, memo, useCallback, useEffect} from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { 
  Gift, Crown, Check, Sparkles, PackageOpen, Lock, X, Home,
  Clock, Package, Coins, 
} from 'lucide-react'; 
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { useGameSound } from '../../hooks/useGameSound';
import { triggerEpicConfetti } from '../../utils/confetti';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getImageUrl } from '../../utils/imageHelper';
import { cn } from '../../utils/cn';
import { PixelButton } from '../../components/ui/PixelButton';

// ========================
// HOOK: Detectar Mobile
// ========================
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
};

// ========================
// INTERFACES
// ========================
interface GiftItem {
  _id: string;
  titulo: string;
  descricao: string;
  recompensaPc: number;
  recompensaItens: {
    item: {
      _id: string;
      name: string;
      image: string; // Garantir que está lendo a propriedade "image" (ou "imagem" dependendo do back)
      imagem?: string; 
      rarity: string;
      isHouseItem?: boolean;
    };
    quantidade: number;
  }[];
  dataExpiracao?: string;
  rankMinimo: string;
  myClaimsCount: number;
  myLimit: number;
  canClaim: boolean;
  vipBonusAvailable: boolean;
}

// ========================
// COMPONENTE: Partícula (Só Desktop)
// ========================
const FloatingParticle = memo(({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className={`absolute w-1 h-1 rounded-full ${color}`}
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      willChange: 'transform, opacity',
    }}
    animate={{
      y: [0, -40, 0],
      opacity: [0, 0.8, 0],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
));
FloatingParticle.displayName = 'FloatingParticle';

// ========================
// COMPONENTE: Gift Card 
// ========================
interface GiftCardProps {
  gift: GiftItem;
  onClaim: (gift: GiftItem) => void;
  isClaiming: boolean;
  isVipUser: boolean;
  index: number;
  isMobile: boolean;
}

const GiftCard = memo(({ gift, onClaim, isClaiming, isVipUser, index, isMobile }: GiftCardProps) => {
  const isVipBonus = gift.vipBonusAvailable;
  const isClaimed = gift.myClaimsCount >= gift.myLimit;
  
  const motionProps: HTMLMotionProps<"div"> = isMobile ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: index * 0.05 }
  } : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 25, delay: index * 0.05 }
  };

  return (
    <motion.div {...motionProps} className="h-full">
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-2xl transition-all duration-300 flex flex-col",
          isMobile ? "bg-[#0f0f13]" : "bg-slate-900/60 backdrop-blur-xl",
          "border-2",
          isVipBonus 
            ? "border-yellow-500/50"
            : isClaimed
              ? "border-green-500/30"
              : gift.canClaim
                ? "border-pink-500/30"
                : "border-slate-700/50 opacity-60",
          !isMobile && gift.canClaim && "hover:border-pink-500/60 hover:shadow-lg"
        )}
      >
        {/* Badge VIP */}
        {isVipBonus && (
          <div className="absolute top-0 right-0 z-10">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-press text-[10px] px-3 py-1.5 rounded-bl-xl shadow-lg">
              <Crown size={12} />
              BÔNUS VIP
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform",
                isVipBonus 
                  ? "bg-yellow-500/20 border border-yellow-500/30" 
                  : isClaimed
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-pink-500/20 border border-pink-500/30"
              )}>
              {isClaimed ? '✓' : isVipBonus ? '👑' : '🎁'}
            </div>
            
            {gift.dataExpiracao && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-right">
                <div className="flex items-center gap-1 text-slate-500 justify-end text-[9px] font-mono uppercase">
                  <Clock size={10} />
                  Expira
                </div>
                <span className="text-xs font-vt323 text-white">
                  {formatDistanceToNow(new Date(gift.dataExpiracao), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="font-vt323 text-2xl text-white mb-2 leading-tight">
            {gift.titulo}
          </h3>
          <p className="font-mono text-[11px] text-slate-400 mb-5 line-clamp-2 min-h-[32px]">
            {gift.descricao || 'Sem descrição.'}
          </p>

          {/* Rewards Preview (Embaixo da descrição) */}
          <div className="flex flex-wrap gap-2 mb-5">
            {gift.recompensaPc > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30">
                <Coins size={12} className="text-green-400" />
                <span className="text-[11px] font-vt323 text-green-400">+{gift.recompensaPc} PC</span>
              </div>
            )}
            
            {gift.recompensaItens.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                  i.item.isHouseItem 
                    ? "bg-purple-500/10 border border-purple-500/30"
                    : "bg-pink-500/10 border border-pink-500/30"
                )}>
                {i.item.isHouseItem ? <Home size={12} className="text-purple-400" /> : <Package size={12} className="text-pink-400" />}
                <span className={cn("text-[11px] font-mono truncate max-w-[80px]", i.item.isHouseItem ? "text-purple-400" : "text-pink-400")}>
                  {i.item.name}
                </span>
              </div>
            ))}
          </div>

          {/* Botão */}
          <div className="mt-auto">
            {gift.canClaim ? (
              <button
                onClick={() => onClaim(gift)}
                disabled={isClaiming}
                className={cn(
                  "w-full py-3 rounded-xl font-press text-xs flex items-center justify-center gap-2 transition-all active:scale-95",
                  isVipBonus
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/20"
                    : "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/20"
                )}
              >
                {isClaiming ? "ABRINDO..." : (
                  <>
                    <Sparkles size={16} />
                    {isVipBonus ? 'RESGATAR BÔNUS' : 'RESGATAR'}
                  </>
                )}
              </button>
            ) : (
              <div className={cn(
                "w-full py-3 rounded-xl flex items-center justify-center gap-2 border",
                isClaimed 
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-500"
              )}>
                {isClaimed ? <Check size={16} /> : <Lock size={16} />}
                <span className="font-press text-xs">
                  {isClaimed ? 'RESGATADO' : 'BLOQUEADO'}
                </span>
              </div>
            )}
            
            {!isVipUser && isClaimed && gift.vipBonusAvailable && (
              <p className="text-[9px] text-center mt-2 text-yellow-500/70 font-mono animate-pulse">
                Seja VIP para pegar +1 vez!
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
GiftCard.displayName = 'GiftCard';

// ========================
// COMPONENTE: Empty State
// ========================
const EmptyState = memo(() => (
  <div className="py-16 flex flex-col items-center justify-center opacity-50">
    <PackageOpen className="w-20 h-20 text-slate-600 mb-4" />
    <h3 className="font-vt323 text-2xl text-slate-500 mb-1">NENHUM PRESENTE</h3>
    <p className="font-mono text-xs text-slate-600">Volte mais tarde!</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

// ========================
// COMPONENTE PRINCIPAL: Gifts
// ========================
export function Gifts() {
  const { refreshUser, user } = useAuth();
  const { playClick, playSuccess, playError } = useGameSound();
  const queryClient = useQueryClient();
  
  const [rewardData, setRewardData] = useState<{
    visible: boolean;
    pc: number;
    items: GiftItem['recompensaItens'];
    title: string;
  } | null>(null);

  const isMobile = useIsMobile();

  // ========================
  // QUERY: Lista de Presentes
  // ========================
  const { 
    data: gifts = [], 
    isLoading,
    isError 
  } = useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const { data } = await api.get('/gifts');
      return data as GiftItem[];
    },
    staleTime: 60000, 
    retry: 2
  });

  // ========================
  // MUTATION: Resgatar Presente
  // ========================
  const claimGiftMutation = useMutation({
    mutationFn: async (giftId: string) => {
      const { data } = await api.post(`/gifts/${giftId}/claim`);
      return data;
    },
    onSuccess: (data, giftId) => {
      playSuccess();
      if (!isMobile) triggerEpicConfetti();
      
      const gift = gifts.find(g => g._id === giftId);
      if (gift) {
        setRewardData({
          visible: true,
          pc: data.newCoins ? gift.recompensaPc : 0,
          items: gift.recompensaItens,
          title: gift.titulo
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      refreshUser();
    },
    onError: (error: any) => {
      playError();
      toast.error(error.response?.data?.error || 'Erro ao resgatar.');
    }
  });

  const handleClaim = useCallback((gift: GiftItem) => {
    playClick();
    claimGiftMutation.mutate(gift._id);
  }, [playClick, claimGiftMutation]);

  if (isError) {
    toast.error('Erro ao carregar presentes.');
  }

  const particleCount = isMobile ? 0 : 20;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-bounce" />
          <p className="font-press text-sm text-pink-400">ABRINDO PRESENTES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden relative">
      {/* Background Otimizado */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-900/10",
          !isMobile && "blur-[120px] animate-pulse"
        )} />
        <div className={cn(
          "absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-900/10",
          !isMobile && "blur-[120px] animate-pulse"
        )} />
      </div>

      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 0.3} color={i % 3 === 0 ? 'bg-pink-400' : 'bg-purple-400'} />
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen px-4 py-6 pb-24 md:pl-28">
        
        <div className="text-center mb-10 pt-16 md:pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs tracking-widest mb-4">
            <Gift size={14} /> CENTRAL DE RECOMPENSAS
          </div>
          <h1 className="font-vt323 text-4xl sm:text-5xl text-white mb-3">
            SEUS <span className="text-pink-500">PRESENTES</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/50">
              <Gift className="w-4 h-4 text-pink-400" />
              <span className="font-mono text-sm text-slate-300">
                {gifts.filter(g => g.canClaim).length} disponíveis
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {gifts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {gifts.map((gift, idx) => (
              <GiftCard
                key={gift._id}
                gift={gift}
                onClaim={handleClaim}
                isClaiming={claimGiftMutation.isPending && claimGiftMutation.variables === gift._id}
                isVipUser={user?.isVip || false}
                index={idx}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>

      {/* =========================================
          🔥 MODAL REWARD (NOVO VISUAL LOOT BOX)
          ========================================= */}
      <AnimatePresence>
        {rewardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setRewardData(null)}
            />
            
            <motion.div
              initial={{ scale: 0.8, y: 50, rotateX: 20 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a24] to-[#0f0f13] border-2 border-pink-500/50 rounded-2xl overflow-hidden z-10 p-8 text-center shadow-[0_0_50px_rgba(236,72,153,0.3)]"
            >
              {/* Botão Fechar */}
              <button
                onClick={() => setRewardData(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors"
              >
                <X size={16} />
              </button>

              {/* Ícone Celebrativo */}
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.6)] mb-6 border-4 border-[#0f0f13]"
              >
                <Gift className="w-12 h-12 text-white drop-shadow-lg" />
              </motion.div>

              <h2 className="font-vt323 text-4xl text-white mb-1 drop-shadow-md">RESGATE SUCESSO!</h2>
              <p className="font-mono text-[10px] text-pink-400 uppercase tracking-widest">{rewardData.title}</p>

              {/* Itens Recebidos (Grade Dinâmica) */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                
                {/* Recompensa em PC$ (Se houver) */}
                {rewardData.pc > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                    className="col-span-2 p-4 rounded-xl flex items-center justify-center gap-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-20 animate-spin-slow mix-blend-overlay"></div>
                    <Coins className="w-10 h-10 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                    <div className="text-left z-10">
                      <span className="block font-press text-[10px] text-green-500/70 mb-1">MOEDAS</span>
                      <span className="block font-vt323 text-4xl text-green-400 drop-shadow-md">+{rewardData.pc} PC$</span>
                    </div>
                  </motion.div>
                )}
                
                {/* Itens Reais Recebidos */}
                {rewardData.items.map((itemSlot, idx) => {
                  // Fallback inteligente para imagem. Tenta .image, .imagem, ou ícone
                  const itemImg = itemSlot.item.image || itemSlot.item.imagem;
                  
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ delay: 0.3 + (idx * 0.1), type: 'spring' }}
                      className={cn(
                        "relative p-4 rounded-xl flex flex-col items-center justify-center border-2 group overflow-hidden",
                        itemSlot.item.isHouseItem 
                          ? "bg-purple-900/20 border-purple-500/30" 
                          : "bg-slate-800/40 border-slate-700/50"
                      )}
                    >
                      {/* Background Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* Imagem do Item ou Fallback */}
                      <div className="h-16 flex items-center justify-center mb-3">
                        {itemImg ? (
                          <img 
                            src={getImageUrl(itemImg)} 
                            alt={itemSlot.item.name}
                            className="max-h-full max-w-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform" 
                          />
                        ) : (
                          <PackageOpen className="w-10 h-10 text-slate-500" />
                        )}
                      </div>
                      
                      {/* Nome do Item */}
                      <span className="font-vt323 text-lg text-white text-center leading-tight line-clamp-2 w-full mb-1">
                        {itemSlot.item.name}
                      </span>
                      
                      {/* Quantidade */}
                      <div className={cn(
                        "px-2 py-0.5 rounded font-press text-[8px]",
                        itemSlot.item.isHouseItem ? "bg-purple-500/20 text-purple-300" : "bg-slate-700 text-slate-300"
                      )}>
                        Qtd: {itemSlot.quantidade}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Botão de Fechar */}
              <PixelButton
                onClick={() => setRewardData(null)}
                className="w-full mt-8 h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-vt323 text-xl shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none"
              >
                IR PARA MOCHILA
              </PixelButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
