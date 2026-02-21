// frontend/src/pages/aluno/Roleta.tsx
import { useState, useEffect, memo, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import {
  Info, X, Ticket, Zap, Dices, Sparkles, Star, Gift, Home,
  Loader2, Coins
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useGameSound } from '../../hooks/useGameSound';
import { triggerGoldRain, triggerEpicConfetti } from '../../utils/confetti';
import { PageTransition } from '../../components/layout/PageTransition';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';

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
// TIPAGENS
// ========================
interface RouletteItem {
  name: string;
  image?: string;
  type: 'PC' | 'ITEM';
  value?: number;
  probability: number;
  rarity: string;
  isHouseItem?: boolean;
}

interface RouletteConfig {
  _id: string;
  title: string;
  description?: string;
  type: 'ROLETADA' | 'SORTEIO';
  cost: number;
  items: RouletteItem[];
}

interface RouletteStatus {
  hasRank: boolean;
  activeRoulettes: RouletteConfig[];
  skills: {
    roletada: number;
    sorteio: number;
    tickets: number;
    sortudoCargas: number;
    sortudoItens: number;
  };
}

// ========================
// SUB-COMPONENTE: A Roda
// ========================
const WheelComponent = memo(({ controls, spinning, selectedTitle }: { controls: any, spinning: boolean, selectedTitle: string | undefined }) => {
  const slices = useMemo(() => [...Array(12)], []);

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 shrink-0 mb-12">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-yellow-400"></div>
      </div>

      <motion.div
        animate={controls}
        className="w-full h-full rounded-full border-[12px] border-slate-800 bg-slate-900 shadow-[0_0_50px_rgba(147,51,234,0.2)] flex items-center justify-center relative overflow-hidden"
      >
        {slices.map((_, i: number) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-slate-700/30 origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}
          />
        ))}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#1e1b4b_0_60deg,#0f172a_60deg_120deg,#1e1b4b_120deg_180deg,#0f172a_180deg_240deg,#1e1b4b_240deg_300deg,#0f172a_300deg_360deg)] opacity-60 pointer-events-none"></div>

        <div className="z-10 w-24 h-24 bg-slate-800 rounded-full border-8 border-slate-700 flex items-center justify-center shadow-2xl relative">
          {spinning ? (
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
          ) : (
            <div className="absolute inset-0 rounded-full bg-yellow-500/10 animate-pulse"></div>
          )}
          <span className="font-press text-4xl text-purple-500 drop-shadow-sm">?</span>
        </div>
      </motion.div>

      {/* NOME DA ROLETA */}
      <div className="absolute -bottom-16 left-0 right-0 text-center">
        <p className="font-vt323 text-3xl text-purple-400 drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)] tracking-wider uppercase">
          {spinning ? "GIRANDO..." : selectedTitle || "SELECIONE"}
        </p>
      </div>
    </div>
  );
});
WheelComponent.displayName = 'WheelComponent';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function Roleta() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const controls = useAnimation();
  const { playSuccess, playError, playClick, playHover } = useGameSound();
  const isMobile = useIsMobile();

  const [spinning, setSpinning] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROLETADA' | 'SORTEIO'>('ROLETADA');
  const [selectedRoulette, setSelectedRoulette] = useState<RouletteConfig | null>(null);

  const [useLuckyBuff, setUseLuckyBuff] = useState(false);
  const [luckySource, setLuckySource] = useState<'SKILL' | 'ITEM'>('SKILL');

  const [showLoot, setShowLoot] = useState(false);
  const [prize, setPrize] = useState<RouletteItem | null>(null);
  const [isDoubleSpinResult, setIsDoubleSpinResult] = useState(false);

  // ========================
  // QUERY: Status da Roleta
  // ========================
  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['roulette', 'status'],
    queryFn: async () => {
      const { data } = await api.get('/roulette/status');
      
      // 🔥 CÁLCULO DE ITENS (LIGANDO OS FIOS DO INVENTÁRIO)
      const userInv = user?.inventory || [];

      // Procura 'ticket' ou 'ficha' no nome
      const ticketCount = userInv.filter((i: any) => {
        const nomeItem = (i.name || i.nome || i.item?.name || i.itemId?.nome || '').toLowerCase();
        return nomeItem.includes('ticket') || nomeItem.includes('ficha');
      }).reduce((acc: number, curr: any) => acc + (curr.quantity || curr.quantidade || 1), 0);

      // Procura 'sortudo' no nome
      const sortudoCount = userInv.filter((i: any) => {
        const nomeItem = (i.name || i.nome || i.item?.name || i.itemId?.nome || '').toLowerCase();
        return nomeItem.includes('sortudo');
      }).reduce((acc: number, curr: any) => acc + (curr.quantity || curr.quantidade || 1), 0);

      const calculatedSkills = {
        roletada: data.skills?.roletada ?? 0,
        sorteio: data.skills?.sorteio ?? 0,
        tickets: data.skills?.tickets ?? ticketCount,
        sortudoCargas: data.skills?.sortudoCargas ?? 0,
        sortudoItens: data.skills?.sortudoItens ?? sortudoCount
      };

      return { ...data, skills: calculatedSkills } as RouletteStatus;
    },
    staleTime: 20000, // 20s
    retry: 2,
    enabled: !!user // Só busca se tiver user
  });

  // ========================
  // MUTATION: Girar Roleta
  // ========================
  const spinMutation = useMutation({
    mutationFn: async ({
      rouletteId,
      paymentMethod,
      useLuckyBuff,
      luckySource
    }: {
      rouletteId: string;
      paymentMethod: string;
      useLuckyBuff: boolean;
      luckySource?: 'SKILL' | 'ITEM'
    }) => {
      const res = await api.post('/roulette/spin', {
        rouletteId,
        paymentMethod,
        useLuckyBuff,
        luckySource
      });
      return res.data;
    },
    onSuccess: async (data) => {
      const result = data.prize;
      setIsDoubleSpinResult(data.isDoubleSpin);

      const duration = isMobile ? 3 : 5;
      const rotation = 3600 + Math.random() * 360;

      await controls.start({
        rotate: [0, rotation],
        transition: { duration, ease: "circOut" }
      });

      setPrize(result);
      playSuccess();

      if (!isMobile) {
        const rareRanks = ['SOBERANO', 'MITOLÓGICO', 'LENDÁRIO', 'SUPREMO', 'ÉPICO'];
        if (rareRanks.includes(result.rarity?.toUpperCase())) {
          triggerEpicConfetti();
        } else if (result.type === 'PC' && result.value >= 500) {
          triggerGoldRain();
        }
      }

      toast.success("GIRO CONCLUÍDO!");

      // Invalidações
      queryClient.invalidateQueries({ queryKey: ['roulette', 'status'] });
      refreshUser();
    },
    onError: (error: any) => {
      playError();
      toast.error(error.response?.data?.error || "Erro ao realizar o giro.");
    },
    onSettled: () => {
      setSpinning(false);
      controls.set({ rotate: 0 });
    }
  });

  // ========================
  // EFFECTS
  // ========================

  // Seleciona primeira roleta quando muda de tab
  useEffect(() => {
    if (status?.activeRoulettes) {
      const first = status.activeRoulettes.find((r: RouletteConfig) => r.type === activeTab);
      if (!selectedRoulette || selectedRoulette.type !== activeTab) {
        setSelectedRoulette(first || null);
      }
    }
  }, [activeTab, status, selectedRoulette]);

  // Define fonte padrão sortudo
  useEffect(() => {
    if (status) {
      if (status.skills.sortudoCargas > 0) setLuckySource('SKILL');
      else if (status.skills.sortudoItens > 0) setLuckySource('ITEM');
    }
  }, [status]);

  // Exibe erro silencioso se a API falhar no load inicial
  useEffect(() => {
    if (isError) {
      toast.error("Alguns dados do sistema podem estar indisponíveis.");
    }
  }, [isError]);

  // ========================
  // COMPUTED
  // ========================
  const hasSortudoSkill = (status?.skills.sortudoCargas ?? 0) > 0;
  const hasSortudoItem = (status?.skills.sortudoItens ?? 0) > 0;
  const canUseLucky = hasSortudoSkill || hasSortudoItem;

  // ========================
  // HANDLER
  // ========================
  const handleSpin = (paymentMethod: string) => {
    if (spinning || !selectedRoulette) return;

    setSpinning(true);
    setPrize(null);
    playClick();

    spinMutation.mutate({
      rouletteId: selectedRoulette._id,
      paymentMethod,
      useLuckyBuff: useLuckyBuff && canUseLucky,
      luckySource: (useLuckyBuff && canUseLucky) ? luckySource : undefined
    });
  };

  // ========================
  // ERROR HANDLING
  // ========================
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-[#0a0a0f] flex flex-col items-center p-4 pt-24 md:pt-28 relative overflow-hidden">

      {/* HEADER STATUS */}
      <div className="w-full max-w-5xl grid grid-cols-3 gap-2 md:gap-4 mb-6 z-10">
        <PixelCard className="bg-slate-900/80 border-purple-500/30 flex flex-col items-center py-3 shadow-lg">
          <span className="text-[8px] md:text-[10px] font-press text-slate-500 mb-1">SKILL RANK</span>
          <div className="flex items-center gap-2 text-purple-400 font-vt323 text-2xl md:text-3xl">
            <Zap size={18} className="text-yellow-400" />
            {status?.skills.roletada ?? 0}/3
          </div>
        </PixelCard>

        <PixelCard className="bg-slate-900/80 border-blue-500/30 flex flex-col items-center py-3 shadow-lg">
          <span className="text-[8px] md:text-[10px] font-press text-slate-500 mb-1">FICHAS</span>
          <div className="flex items-center gap-2 text-blue-400 font-vt323 text-2xl md:text-3xl">
            <Ticket size={18} />
            {status?.skills.tickets ?? 0}
          </div>
        </PixelCard>

        <PixelCard className="bg-slate-900/80 border-green-500/30 flex flex-col items-center py-3 shadow-lg">
          <span className="text-[8px] md:text-[10px] font-press text-slate-500 mb-1">SALDO PC$</span>
          <div className="flex items-center gap-2 text-green-400 font-vt323 text-2xl md:text-3xl">
            <Coins size={18} />
            {(user?.saldoPc ?? 0).toLocaleString()}
          </div>
        </PixelCard>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 md:gap-4 mb-8 z-10 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => { setActiveTab('ROLETADA'); playClick(); }}
          className={cn("px-4 md:px-8 py-2 md:py-3 font-press text-[10px] md:text-xs rounded-lg transition-all flex items-center gap-2",
            activeTab === 'ROLETADA' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Dices size={14} /> ROLETADA
        </button>
        <button
          onClick={() => { setActiveTab('SORTEIO'); playClick(); }}
          className={cn("px-4 md:px-8 py-2 md:py-3 font-press text-[10px] md:text-xs rounded-lg transition-all flex items-center gap-2",
            activeTab === 'SORTEIO' ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Star size={14} /> SORTEIOS ({status?.skills.sorteio ?? 0})
        </button>
      </div>

      {/* ÁREA DE JOGO */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-start">

        {/* ESQUERDA: LISTA */}
        <div className="lg:col-span-3 order-2 lg:order-1 h-auto max-h-[400px] lg:h-[500px] flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          <h3 className="font-vt323 text-2xl text-slate-500 uppercase mb-4 text-center tracking-widest">SELECIONE O EVENTO</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {status?.activeRoulettes.filter((r: RouletteConfig) => r.type === activeTab).map((roulette: RouletteConfig) => (
              <motion.div key={roulette._id} whileTap={{ scale: 0.98 }} onClick={() => { setSelectedRoulette(roulette); playClick(); }}>
                <div className={cn("cursor-pointer border-l-4 p-4 rounded-r-lg transition-all relative group",
                  selectedRoulette?._id === roulette._id
                    ? "border-l-purple-500 bg-slate-800 shadow-md"
                    : "border-l-slate-700 bg-slate-900/40 hover:bg-slate-800"
                )}>
                  {selectedRoulette?._id === roulette._id && (
                    <div className="absolute top-2 right-2 text-purple-500 animate-pulse"><Sparkles size={14} /></div>
                  )}
                  <h4 className="font-vt323 text-2xl text-white leading-none mb-1 truncate">{roulette.title}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-mono text-[9px] text-slate-500">{roulette.items.length} ITENS</p>
                    <span className="text-green-500 font-vt323 text-lg">{roulette.cost} PC$</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {status?.activeRoulettes.filter((r: RouletteConfig) => r.type === activeTab).length === 0 && (
              <div className="text-center py-10 opacity-50">
                <X className="mx-auto text-slate-600 mb-2" size={24} />
                <p className="font-vt323 text-lg text-slate-500">SEM EVENTOS</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTRO: RODA */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative order-1 lg:order-2 py-4">
          {selectedRoulette ? (
            <>
              <WheelComponent controls={controls} spinning={spinning} selectedTitle={selectedRoulette.title} />
              <button
                onMouseEnter={playHover}
                onClick={() => { setShowLoot(true); playClick(); }}
                className="mt-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all font-vt323 text-2xl bg-slate-900/80 px-6 py-2 rounded-full border border-slate-800 hover:border-purple-500 group"
              >
                <Info size={18} className="group-hover:rotate-12 transition-transform text-purple-500" /> VER PRÊMIOS POSSÍVEIS
              </button>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-700 animate-pulse">
              <Dices size={64} className="opacity-20 mb-4" />
              <p className="font-vt323 text-2xl tracking-widest">SELECIONE UM EVENTO</p>
            </div>
          )}
        </div>

        {/* DIREITA: CONTROLES */}
        <div className="lg:col-span-4 flex flex-col gap-4 order-3 lg:order-3">

          {/* CARD SORTUDO */}
          <div className={cn("p-4 rounded-xl border transition-all duration-300 relative overflow-hidden",
            canUseLucky ? "border-green-600/30 bg-green-900/5" : "border-slate-800 bg-slate-900/50 opacity-60"
          )}>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-vt323 text-2xl text-green-400 flex items-center gap-2 uppercase tracking-widest">
                <Sparkles size={18} /> MODO SORTUDO
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLuckyBuff}
                  onChange={e => { setUseLuckyBuff(e.target.checked); playClick(); }}
                  disabled={!canUseLucky}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <p className="text-sm text-slate-400 font-vt323 leading-relaxed mb-3">
              Roda 2x e pega o melhor prêmio.
            </p>

            {useLuckyBuff && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => { if (hasSortudoSkill) { setLuckySource('SKILL'); playClick(); } }}
                  disabled={!hasSortudoSkill}
                  className={cn("border p-2 rounded text-center transition-all", luckySource === 'SKILL' ? "bg-yellow-500 text-black border-yellow-500" : "border-slate-700 text-slate-500")}
                >
                  <p className="text-[8px] font-press">SKILL RANK</p>
                  <p className="font-vt323 text-lg">{status?.skills.sortudoCargas ?? 0}/3</p>
                </button>
                <button
                  onClick={() => { if (hasSortudoItem) { setLuckySource('ITEM'); playClick(); } }}
                  disabled={!hasSortudoItem}
                  className={cn("border p-2 rounded text-center transition-all", luckySource === 'ITEM' ? "bg-blue-500 text-white border-blue-500" : "border-slate-700 text-slate-500")}
                >
                  <p className="text-[8px] font-press">ITEM INV.</p>
                  <p className="font-vt323 text-lg">x{status?.skills.sortudoItens ?? 0}</p>
                </button>
              </div>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="space-y-3">
            <p className="font-vt323 text-xl text-slate-600 ml-1 uppercase tracking-widest">PAGAR COM</p>

            <PixelButton
              onClick={() => handleSpin('SKILL_ROLETADA')}
              disabled={spinning || !selectedRoulette || (status?.skills.roletada || 0) <= 0}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white flex justify-between items-center h-14 shadow-lg group px-4"
            >
              <div className="flex flex-col items-start">
                <span className="flex items-center gap-2 text-sm font-vt323 tracking-widest"><Zap size={16} className="text-yellow-400" /> SKILL RANK</span>
              </div>
              <span className="font-vt323 text-2xl text-white bg-black/20 px-2 rounded">{status?.skills.roletada ?? 0}/3</span>
            </PixelButton>

            <PixelButton
              onClick={() => handleSpin('ITEM')}
              disabled={spinning || !selectedRoulette || (status?.skills.tickets || 0) <= 0}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white flex justify-between items-center h-14 shadow-lg group px-4"
            >
              <div className="flex flex-col items-start">
                <span className="flex items-center gap-2 text-sm font-vt323 tracking-widest"><Ticket size={16} className="text-cyan-300" /> FICHA</span>
              </div>
              <span className="font-vt323 text-2xl text-white bg-black/20 px-2 rounded">x{status?.skills.tickets ?? 0}</span>
            </PixelButton>

            <PixelButton
              onClick={() => handleSpin('PC')}
              disabled={spinning || !selectedRoulette || (user?.saldoPc || 0) < (selectedRoulette?.cost || 0)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white flex justify-between items-center h-14 shadow-lg border-b-4 border-slate-900 active:border-b-0 transition-all px-4"
            >
              <div className="flex flex-col items-start">
                <span className="flex items-center gap-2 text-sm font-vt323 text-green-400 tracking-widest">SALDO PC$</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-vt323 text-xs text-slate-400 leading-none">CUSTO</span>
                <span className="font-vt323 text-xl text-green-400 leading-none">{selectedRoulette?.cost}</span>
              </div>
            </PixelButton>
          </div>
        </div>
      </div>

      {/* MODAL RESULTADO */}
      <AnimatePresence>
        {prize && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setPrize(null)}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="max-w-md w-full relative"
              onClick={e => e.stopPropagation()}
            >
              <PixelCard className="p-8 flex flex-col items-center text-center border-4 border-yellow-500 bg-slate-900 shadow-[0_0_100px_rgba(234,179,8,0.3)] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent animate-pulse"></div>

                {isDoubleSpinResult && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-lg font-vt323 tracking-widest px-4 py-1 rounded-full border border-green-400 shadow-lg animate-bounce">
                    🍀 SORTE DUPLA!
                  </div>
                )}

                <div className="w-40 h-40 mb-6 bg-black/60 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl relative z-10 mt-6">
                  {prize.image ? (
                    <img src={getImageUrl(prize.image)} className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" alt={prize.name} />
                  ) : (
                    <Gift size={64} className="text-yellow-400" />
                  )}
                </div>

                <h2 className="font-vt323 text-5xl text-white mb-2 leading-none drop-shadow-lg uppercase">{prize.name}</h2>

                <div className="flex gap-2 justify-center mb-8">
                  <span className="font-vt323 text-2xl text-slate-400 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {prize.rarity}
                  </span>
                  {prize.isHouseItem && (
                    <span className="font-vt323 text-2xl text-white bg-purple-600 px-3 py-1 rounded-full flex items-center gap-1">
                      <Home size={16} /> SALA
                    </span>
                  )}
                </div>

                <PixelButton onClick={() => setPrize(null)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 font-vt323 text-3xl">
                  RESGATAR
                </PixelButton>
              </PixelCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL LOOT */}
      <AnimatePresence>
        {showLoot && selectedRoulette && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowLoot(false)}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="font-vt323 text-3xl text-white uppercase tracking-widest">CHANCES: {selectedRoulette.title}</h3>
                <button onClick={() => setShowLoot(false)}><X className="text-slate-400 hover:text-white" /></button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                {selectedRoulette.items.sort((a, b) => b.probability - a.probability).map((item: RouletteItem, idx: number) => {
                  const rare = ['SOBERANO', 'MITOLÓGICO', 'LENDÁRIO', 'ÉPICO'].includes(item.rarity.toUpperCase());
                  return (
                    <div key={idx} className={cn("flex justify-between items-center p-3 rounded border", rare ? "bg-purple-900/20 border-purple-500/30" : "bg-black/20 border-slate-800")}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded flex items-center justify-center border border-slate-800">
                          {item.image ? <img src={getImageUrl(item.image)} className="w-7 h-7 object-contain" alt={item.name} /> : <Star size={14} className="text-slate-600" />}
                        </div>
                        <div>
                          <p className={cn("font-vt323 text-2xl leading-none", rare ? "text-purple-300" : "text-slate-300")}>{item.name}</p>
                          <p className="text-sm font-vt323 text-slate-500 uppercase">{item.rarity}</p>
                        </div>
                      </div>
                      <span className="font-vt323 text-2xl text-white">{item.probability}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageTransition>
  );
}