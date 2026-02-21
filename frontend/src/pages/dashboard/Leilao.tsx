import { useState, memo, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Trophy, Loader2, Lock, Home,
  Flame, Crown, TrendingUp, Users, Timer, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { getImageUrl } from '../../utils/imageHelper';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { getSocket } from '../../services/socket';

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
// COMPONENTE: Partícula (Só Desktop)
// ========================
const FloatingParticle = memo(({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className={`absolute w-1 h-1 rounded-full ${color}`}
    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
    animate={{ y: [0, -30, 0], opacity: [0, 0.8, 0] }}
    transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
));
FloatingParticle.displayName = 'FloatingParticle';

// ========================
// COMPONENTE: Countdown
// ========================
const Countdown = memo(({ date }: { date: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const distance = new Date(date).getTime() - now;

      if (distance < 0) {
        setTimeLeft("ENCERRADO");
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setIsUrgent(days === 0 && hours < 1);

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      else setTimeLeft(`${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm border",
      isUrgent
        ? "bg-red-500/20 border-red-500/50 text-red-400"
        : "bg-slate-800/50 border-slate-700/50 text-slate-300"
    )}>
      {isUrgent ? <Flame className="w-4 h-4 text-red-500" /> : <Timer className="w-4 h-4 text-slate-400" />}
      <span className={cn(isUrgent && "font-bold")}>{timeLeft}</span>
    </div>
  );
});
Countdown.displayName = 'Countdown';

// ========================
// COMPONENTE: Card de Leilão ATIVO
// ========================
interface AuctionCardProps {
  item: any;
  user: any;
  ranks: any[];
  bidAmount: string;
  biddingId: string | null;
  onBidChange: (id: string, value: string) => void;
  onBid: (id: string, useItemId: string) => void;
  index: number;
  isMobile: boolean;
  arrematadores: any[];
}

const AuctionCard = memo(({
  item, user, ranks, bidAmount, biddingId, onBidChange, onBid, index, isMobile, arrematadores
}: AuctionCardProps) => {
  const [selectedArrematador, setSelectedArrematador] = useState<string>('');

  const currentBid = item.maiorLance?.valor || item.lanceMinimo || 0;
  const winning = item.maiorLance?.user?._id === user?._id;
  const minBid = currentBid + 1;

  const userAno = user?.turma?.match(/\d+/)?.[0];
  const userMaxPoints = user?.maxPcAchieved || 0;
  const allowedSeries = item.seriesPermitidas || [];
  const isSeriesOk = allowedSeries.length === 0 || (userAno && allowedSeries.includes(userAno));
  const requiredRank = item.rankMinimo;
  const minPoints = requiredRank ? (ranks.find((r: any) => r.name === requiredRank)?.min || 0) : 0;
  const isRankOk = userMaxPoints >= minPoints;
  const isLocked = !isSeriesOk || !isRankOk;

  const calculateCost = () => {
    const valor = Number(bidAmount) || 0;
    if (!selectedArrematador) return valor;
    const skill = arrematadores.find((i: any) => i._id === selectedArrematador);
    if (!skill) return valor;
    const nome = (skill.name || skill.nome || skill.itemId?.name || '').toLowerCase();
    if (nome.includes('75%')) return Math.ceil(valor * 0.25);
    if (nome.includes('arrematador')) return Math.ceil(valor * 0.50);
    return valor;
  };

  const finalCost = calculateCost();
  const hasDiscount = finalCost < (Number(bidAmount) || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <div className={cn(
        "relative overflow-hidden rounded-xl transition-all duration-300 flex flex-col h-full",
        isMobile ? "bg-[#0f0f13]" : "bg-slate-900/60 backdrop-blur-xl",
        "border-2",
        isLocked ? "border-slate-700/50 opacity-80" : winning ? "border-green-500/50" : "border-amber-500/30",
        !isMobile && !isLocked && "hover:border-amber-500/60 hover:shadow-lg"
      )}>

        <div className="absolute top-3 left-3 z-20 flex gap-2">
          {item.isHouseItem && (
            <div className="flex items-center gap-1.5 bg-purple-600/90 px-2 py-1 rounded-lg border border-purple-400/30">
              <Home size={12} className="text-purple-200" />
              <span className="font-mono text-[10px] text-purple-100 uppercase">Sala</span>
            </div>
          )}
        </div>

        {winning && !isLocked && (
          <div className="absolute top-3 right-3 z-20">
            <div className="flex items-center gap-1.5 bg-green-500/90 px-3 py-1.5 rounded-lg border border-green-300/30 shadow-lg">
              <Crown size={14} className="text-yellow-300" />
              <span className="font-press text-[8px] text-white">GANHANDO!</span>
            </div>
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <Lock className="w-12 h-12 text-red-500 mb-3" />
            <p className="font-press text-xs text-red-400 mb-2">RESTRITO</p>
            <div className="space-y-1 text-center">
              {!isSeriesOk && <p className="font-mono text-[10px] text-slate-400">APENAS {allowedSeries.join('º, ')}º ANO</p>}
              {!isRankOk && <p className="font-mono text-[10px] text-slate-400">REQUER RANK {requiredRank}</p>}
            </div>
          </div>
        )}

        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6">
          <img
            src={getImageUrl(item.imagemUrl)}
            alt={item.titulo}
            className="h-full w-full object-contain drop-shadow-2xl"
            onError={(e) => (e.target as HTMLImageElement).src = '/assets/placeholder.png'}
          />
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-4">
          <div>
            <h3 className="font-vt323 text-2xl text-white uppercase leading-tight mb-1 truncate">
              {item.titulo}
            </h3>
            <p className="font-mono text-xs text-slate-400 line-clamp-2">
              {item.descricao}
            </p>
          </div>

          <div className="rounded-lg p-3 bg-black/40 border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-[10px] text-slate-400 uppercase">LANCE ATUAL</span>
              </div>
              <span className="font-vt323 text-2xl text-amber-400">{(currentBid || 0).toLocaleString()} PC$</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-mono text-[10px] text-slate-400 uppercase">LIDERANDO</span>
              </div>
              <span className="font-mono text-sm text-slate-300 truncate max-w-[120px]">
                {item.maiorLance?.user?.nome?.split(' ')[0] || 'Ninguém'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="font-mono text-[10px] text-slate-400 uppercase">ENCERRA EM</span>
              <Countdown date={item.dataFim} />
            </div>
          </div>

          <div className="mt-auto space-y-3">
            {arrematadores.length > 0 && (
              <div className="bg-slate-950 p-2 rounded border border-blue-900/30">
                <select
                  className="w-full bg-black border border-slate-700 text-white text-[10px] rounded p-1.5 outline-none focus:border-blue-500 font-mono"
                  value={selectedArrematador}
                  onChange={(e) => setSelectedArrematador(e.target.value)}
                >
                  <option value="">Sem Arrematador (100%)</option>
                  {arrematadores.map((skill: any) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name || skill.nome || skill.itemId?.name} ({skill.usesLeft ?? skill.quantity} usos)
                    </option>
                  ))}
                </select>

                {hasDiscount && bidAmount && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-green-400">
                    <span className="text-[9px] font-press uppercase">Paga apenas:</span>
                    <span className="font-vt323 text-lg">{(finalCost || 0).toLocaleString()} PC$</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                disabled={isLocked}
                placeholder={`Mín: ${minBid}`}
                className="flex-1 px-3 py-2 rounded bg-black border-2 border-slate-700 text-white font-vt323 text-xl placeholder:text-slate-600 focus:border-amber-500 outline-none transition-all"
                value={bidAmount}
                onChange={(e) => onBidChange(item._id, e.target.value)}
              />

              <button
                onClick={() => onBid(item._id, selectedArrematador)}
                disabled={biddingId === item._id || isLocked || !bidAmount || Number(bidAmount) < minBid}
                className={cn(
                  "px-4 py-2 rounded font-press text-[10px] transition-all flex items-center justify-center gap-2",
                  isLocked || biddingId === item._id
                    ? "bg-slate-700 text-slate-500"
                    : "bg-amber-500 text-black hover:bg-amber-400 shadow-lg active:scale-95"
                )}
              >
                {biddingId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'LANCE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
AuctionCard.displayName = 'AuctionCard';

// ========================
// COMPONENTE: Card Finalizado (Compacto)
// ========================
const FinishedCard = memo(({ item, index }: { item: any; index: number }) => {
  const vencedor = item.maiorLance?.user?.nome || item.ganhador?.nome || 'Ninguém';
  const valorFinal = item.maiorLance?.valor || item.lanceMinimo || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/20 border border-slate-800/40 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all relative overflow-hidden">
        {/* Faixa riscada visual */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.03)_10px,rgba(255,0,0,0.03)_12px)] pointer-events-none" />

        <div className="w-12 h-12 bg-black/40 rounded flex items-center justify-center border border-slate-800/50 flex-shrink-0">
          <img
            src={getImageUrl(item.imagemUrl)}
            className="w-10 h-10 object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
            onError={(e) => (e.target as HTMLImageElement).src = '/assets/placeholder.png'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-vt323 text-lg text-slate-500 line-through truncate leading-none mb-1">
            {item.titulo}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-green-500 uppercase flex items-center gap-1">
              <CheckCircle2 size={10} /> {vencedor.split(' ')[0]}
            </span>
            <span className="text-slate-700">•</span>
            <span className="font-mono text-[9px] text-amber-600/80">
              {(valorFinal || 0).toLocaleString()} PC$
            </span>
          </div>
        </div>

        <div className="px-1.5 py-0.5 rounded border border-red-900/30 bg-red-950/20">
          <span className="font-press text-[7px] text-red-500/70 uppercase">OFF</span>
        </div>
      </div>
    </motion.div>
  );
});
FinishedCard.displayName = 'FinishedCard';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function Leilao() {
  const { user, refreshUser, ranks } = useAuth();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});
  const [biddingId, setBiddingId] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const socket = getSocket();

  const { data: allItems = [], isLoading, isError } = useQuery({
    queryKey: ['auctions', 'all'],
    queryFn: async () => {
      const res = await api.get('/auction');
      return res.data;
    }
  });

  const { data: historyItems = [] } = useQuery({
    queryKey: ['auctions', 'global-history'], // 🔥 Mudamos a chave e a rota!
    queryFn: async () => {
      const res = await api.get('/auction/global-history');
      return res.data;
    },
    staleTime: 60000
  });

  const activeItems = useMemo(() => {
    return allItems.filter((item: any) =>
      item.status === 'ativo' && new Date(item.dataFim) > new Date()
    );
  }, [allItems]);

  const finishedItems = useMemo(() => {
    // Pegar quem já expirou na lista principal
    const endedFromAll = allItems.filter((item: any) =>
      item.status !== 'ativo' || new Date(item.dataFim) <= new Date()
    );

    // Unir com o Hall da Fama e remover duplicados por ID
    const combined = [...endedFromAll, ...historyItems];
    const unique = combined.filter((v, i, a) => a.findIndex(t => t._id === v._id) === i);

    return unique.sort((a, b) => new Date(b.dataFim).getTime() - new Date(a.dataFim).getTime()).slice(0, 12);
  }, [allItems, historyItems]);
  useEffect(() => {
    if (socket && !socket.connected) socket.connect();

    const handleUpdate = (updatedItem: any) => {
      queryClient.setQueryData(['auctions', 'all'], (old: any[] = []) => {
        const exists = old.find(i => i._id === updatedItem._id);
        if (exists) return old.map(i => i._id === updatedItem._id ? updatedItem : i);
        return [updatedItem, ...old];
      });
      if (updatedItem.status !== 'ativo' || new Date(updatedItem.dataFim) <= new Date()) {
        queryClient.invalidateQueries({ queryKey: ['auctions', 'history'] });
      }
    };

    if (socket) {
      socket.on('auction_update', handleUpdate);
      socket.on('auction_delete', (id: string) => {
        queryClient.setQueryData(['auctions', 'all'], (old: any[] = []) => old.filter(i => i._id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off('auction_update');
        socket.off('auction_delete');
      }
    };
  }, [socket, queryClient]);

  const bidMutation = useMutation({
    mutationFn: async ({ id, valor, useItemId }: { id: string; valor: number; useItemId: string }) => {
      const res = await api.post(`/auction/bid/${id}`, {
        valor: valor, // 🔥 Sincronizado com schemas.js
        useItemId: useItemId || null
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message);
      setBidAmount(prev => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auctions', 'all'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro no lance."),
    onSettled: () => setBiddingId(null)
  });

  const arrematadores = useMemo(() => {
    if (!user?.inventory) return [];
    return user.inventory.filter((item: any) => {
      const nome = (item.name || item.nome || item.itemId?.name || '').toLowerCase();
      return nome.includes('arrematador') && ((item.category === 'RANK_SKILL' && item.usesLeft > 0) || (item.quantity > 0));
    });
  }, [user]);

  const handleBid = useCallback((id: string, useItemId: string) => {
    const valor = parseInt(bidAmount[id]);
    const item = activeItems.find((i: any) => i._id === id);
    if (!valor || valor <= (item?.maiorLance?.valor || item?.lanceMinimo || 0)) {
      return toast.warning("Lance muito baixo!");
    }
    setBiddingId(id);
    bidMutation.mutate({ id, valor, useItemId });
  }, [bidAmount, activeItems, bidMutation]);


  if (isLoading) return (

    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>

  );

  if (isError) {
    toast.error("Erro ao sincronizar com a Casa de Leilões. Verifique sua conexão.");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-900/30 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-900/30 blur-[120px]" />
      </div>

      <div className="relative z-10 px-4 py-16 pb-24 md:pl-28 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Gavel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-press text-2xl text-amber-400">LEILÃO</h1>
              <p className="font-vt323 text-xl text-slate-400 uppercase tracking-widest">A disputa começou!</p>
            </div>
          </div>

          <div className="px-6 py-4 rounded-2xl border-2 border-green-500/20 bg-slate-900/80 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-tighter">Seu Saldo Disponível</p>
              <p className="font-vt323 text-3xl text-green-400">{(user?.saldoPc || 0).toLocaleString()} PC$</p>
            </div>
          </div>
        </header>

        {/* Ativos Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="text-orange-500" size={24} />
            <h2 className="font-press text-sm text-white uppercase">Lotes em disputa</h2>
            <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-800 to-transparent" />
          </div>

          {activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
              <Home className="w-16 h-16 text-slate-700 mb-4" />
              <p className="font-vt323 text-2xl text-slate-500 uppercase">Não há leilões ativos no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {activeItems.map((item: any, idx: number) => (
                  <AuctionCard
                    key={item._id}
                    item={item}
                    user={user}
                    ranks={ranks}
                    bidAmount={bidAmount[item._id] || ''}
                    biddingId={biddingId}
                    onBidChange={(id, v) => setBidAmount(prev => ({ ...prev, [id]: v }))}
                    onBid={handleBid}
                    index={idx}
                    isMobile={isMobile}
                    arrematadores={arrematadores}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Histórico Section */}
        {finishedItems.length > 0 && (
          <section className="mt-20 pt-10 border-t border-slate-800/40">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="text-slate-500" size={20} />
              <h2 className="font-press text-[10px] text-slate-500 uppercase">Martelos batidos recentemente</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {finishedItems.map((item: any, idx: number) => (
                <FinishedCard key={item._id} item={item} index={idx} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}