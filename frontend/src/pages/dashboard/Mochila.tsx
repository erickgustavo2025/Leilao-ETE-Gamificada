import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import {
  PackageX, Search, Ticket, QrCode, Trash2, ImageOff, 
  Infinity as InfinityIcon, Backpack, Gift, Zap, Clock, 
  Loader2, Crown, Sparkles, XCircle, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from "react-qr-code";
import { cn } from '../../utils/cn';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../utils/imageHelper';
import { calculateRank } from '../../utils/rankHelper';
import { TransferModal } from '../../components/features/TransferModal';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
// HELPERS DE ESTILO (Raridade Blindada)
// ========================
const getStyle = (rarity?: string) => {
  if (!rarity) return 'border-slate-700/50 text-slate-400 bg-slate-900/20';
  const r = rarity.toUpperCase().trim();

  if (r.includes('SOBERANO')) return 'border-yellow-200/50 text-yellow-100 bg-yellow-100/10';
  if (r.includes('MITOLÓGICO') || r.includes('MITHOLÓGICO') || r === 'MITOLOGICO') return 'border-rose-800/50 text-rose-400 bg-rose-900/10';
  if (r.includes('SUPREMO')) return 'border-red-600/50 text-red-400 bg-red-900/10';
  if (r.includes('LENDÁRIO') || r.includes('LENDARIO')) return 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-900/20';
  if (r.includes('ÉPICO') || r.includes('EPICO')) return 'border-purple-500/50 text-purple-400 bg-purple-900/20';
  if (r.includes('DIAMANTE')) return 'border-cyan-500/50 text-cyan-400 bg-cyan-900/20';
  if (r.includes('OURO')) return 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20';
  if (r.includes('PRATA')) return 'border-slate-400/50 text-slate-300 bg-slate-800/20';
  if (r.includes('BRONZE')) return 'border-orange-700/50 text-orange-400 bg-orange-950/20';
  if (r.includes('EVENTO')) return 'border-green-500/50 text-green-400 bg-green-900/10';
  if (r.includes('LEILÃO') || r.includes('LEILAO')) return 'border-indigo-500/50 text-indigo-400 bg-indigo-900/20';
  if (r.includes('SKILL')) return 'border-blue-500/50 text-blue-400 bg-blue-900/20';

  return 'border-slate-700/50 text-slate-400 bg-slate-900/20';
};

// ========================
// ✅ RELATÓRIO: formatValidity atualizado para Buffs com countdown preciso
// ========================
function formatValidity(item: any): { label: string; isUrgent: boolean } {
  if (item.expiresAt) {
    const now = new Date();
    const exp = new Date(item.expiresAt);
    const diff = exp.getTime() - now.getTime();

    if (diff < 0) return { label: "EXPIRADO", isUrgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours <= 12) return { label: `${hours}h RESTANTES`, isUrgent: true };
    if (days === 0) return { label: "HOJE", isUrgent: true };
    if (days <= 3) return { label: `${days} DIAS`, isUrgent: true };
    return { label: `${days} DIAS`, isUrgent: false };
  }
  if (item.category === 'RANK_SKILL') {
    if (item.resetPeriod === 'QUARTERLY') return { label: "TRIMESTRAL", isUrgent: false };
    if (item.resetPeriod === 'NEVER') return { label: "PERMANENTE", isUrgent: false };
  }
  if (item.source === 'RANK') return { label: "ATIVO", isUrgent: false };
  return { label: "PERMANENTE", isUrgent: false };
}

const SafeImage = memo(({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [hasError, setHasError] = useState(false);
  const finalSrc = getImageUrl(src); 
  
  if (hasError || !src || src.includes('undefined') || src === '') {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-800/50 text-slate-600 border-2 border-slate-700 border-dashed p-2 w-full h-full rounded-xl", className)}>
        <ImageOff size={24} />
      </div>
    );
  }
  return <img src={finalSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
});
SafeImage.displayName = 'SafeImage';

interface ItemCardProps {
  slot: any;
  onClick?: () => void;
  index: number;
  isMobile: boolean;
  isBuff?: boolean;
}

// ========================
// ✅ RELATÓRIO: ItemCard com suporte visual completo para Buffs
// ========================
const ItemCard = memo(({ slot, onClick, index, isMobile, isBuff }: ItemCardProps) => {
  const isSkill = slot.category === 'RANK_SKILL';
  const rarityText = slot.rarity || slot.raridade || (isSkill ? 'SKILL' : isBuff ? 'PASSIVA' : 'COMUM');
  const style = getStyle(rarityText);
  const borderColor = style.split(' ')[0];

  const name = slot.itemId?.name || slot.itemId?.nome || slot.name || "Item";
  const image = slot.itemId?.imagem || slot.itemId?.image || slot.image || slot.imagem; 
  const quantity = slot.quantity || 1;
  const usesLeft = slot.usesLeft ?? 0;
  const usesMax = slot.usesMax ?? 3;
  const validity = formatValidity(slot);

  // ✅ Buffs com efeito multiplicador ganham borda animada laranja/dourada
  const isMultiplierBuff = isBuff && (
    slot.effect === 'DUPLICADOR' || slot.effect === 'TRIPLICADOR'
  );

  const motionProps: HTMLMotionProps<"div"> = isMobile ? {
    initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.02 }
  } : {
    layout: true, initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
  };

  return (
    <motion.div {...motionProps} onClick={onClick} className={cn("group h-full", onClick ? "cursor-pointer" : "cursor-default")}>
      <div className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-xl transition-all duration-200 border",
          isMobile ? "bg-[#0f0f13]" : "bg-slate-900/60 backdrop-blur-xl",
          isMultiplierBuff ? "border-orange-500/60" : borderColor,
          onClick && !isMobile && "hover:-translate-y-1 hover:shadow-xl"
        )}
      >
        {/* ✅ Badge de efeito para Buffs multiplicadores */}
        {isMultiplierBuff && (
          <div className="absolute top-2 left-2 z-10">
            <div className="flex items-center gap-0.5 bg-orange-500/90 px-1.5 py-0.5 rounded border border-orange-300/30">
              <Flame size={8} className="text-orange-100" />
              <span className="font-press text-[7px] text-orange-100 uppercase">
                {slot.effect === 'TRIPLICADOR' ? '3x' : '2x'}
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
            isMobile ? "bg-black/90" : "backdrop-blur-md bg-black/40",
            isBuff ? "border-orange-500/40 text-orange-300 bg-orange-900/20" : style
          )}>
            {isBuff ? 'ATIVO' : rarityText}
          </span>
        </div>

        <div className="h-28 bg-gradient-to-br from-black/60 to-slate-900/60 relative flex items-center justify-center p-3 pt-6">
          <SafeImage src={image} alt={name} className="h-16 w-16 object-contain drop-shadow-lg" />
          {!isBuff && quantity > 1 && !isSkill && (
            <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded border border-slate-600">
              x{quantity}
            </span>
          )}
        </div>

        <div className="p-2.5 flex-1 flex flex-col bg-black/20">
          <h3 className="font-vt323 text-base text-white leading-tight mb-2 line-clamp-2 min-h-[32px]">
            {name}
          </h3>
          
          <div className="mt-auto">
            {isSkill && !isBuff ? (
              <div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                  <span>USOS</span>
                  <span className={usesLeft > 0 ? "text-blue-400" : "text-red-500"}>
                    {usesLeft}/{usesMax}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${(usesLeft / usesMax) * 100}%` }} />
                </div>
              </div>
            ) : (
              // ✅ Validade urgente fica vermelha/laranja para alertar o aluno
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                validity.isUrgent
                  ? "text-orange-400 border-orange-800/50 bg-orange-900/20"
                  : "text-slate-500 border-slate-800 bg-slate-900/50"
              )}>
                {validity.label === "PERMANENTE" || validity.label === "ATIVO" || validity.label === "TRIMESTRAL"
                  ? <InfinityIcon size={10} />
                  : <Clock size={10} className={validity.isUrgent ? "animate-pulse" : ""} />
                }
                {validity.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
ItemCard.displayName = 'ItemCard';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function Mochila() {
  const { user, refreshUser, ranks } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'itens' | 'skills' | 'buffs' | 'tickets'>('itens');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [ticketModal, setTicketModal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const currentRank = calculateRank(user?.maxPcAchieved || 0, ranks);

  // 🔥 1. BUSCAR TICKETS
  const { data: myTickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['myTickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    }
  });

  // 🔥 2. MUTATION: Usar Item
  const useItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.post('/inventory/use', { itemId });
      return res.data;
    },
    onSuccess: async (data) => {
      // ✅ RELATÓRIO: Trata resposta de BUFF separadamente (sem ticket)
      if (data.buffActivated && data.buff) {
        const buff = data.buff;
        const validityInfo = formatValidity(buff);

        // Toast especial para ativação de buff
        toast.success(`🔥 ${buff.name} ATIVADO!`, {
          description: `Bônus ativo por ${validityInfo.label}. Vai pra aba BUFFS ver! 👊`,
          duration: 5000
        });

        setSelectedItem(null);
        await refreshUser(); // Atualiza activeBuffs no contexto
        return;
      }

      // Fluxo normal: ticket gerado
      if (data.ticket) {
        setTicketModal(data.ticket);
        queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      } else {
        toast.success("Item utilizado com sucesso!");
      }
      setSelectedItem(null);
      await refreshUser();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao usar item.");
    }
  });

  // 🔥 3. MUTATION: Descartar Item
  const discardMutation = useMutation({
    mutationFn: async (slotId: string) => {
      await api.delete(`/inventory/item/${slotId}`);
    },
    onSuccess: async () => {
      toast.success("Item descartado.");
      setSelectedItem(null);
      await refreshUser();
    },
    onError: () => toast.error("Erro ao descartar.")
  });

  // 🔥 4. MUTATION: Cancelar Ticket
  const cancelTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await api.delete(`/tickets/${ticketId}`);
    },
    onSuccess: async () => {
      toast.success("Ticket cancelado! Item devolvido.");
      setTicketModal(null);
      await refreshUser(); 
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Erro ao cancelar.")
  });

  // HANDLERS
  const handleUseItem = useCallback(() => {
    if (!selectedItem) return;
    const name = (selectedItem.itemId?.name || selectedItem.name || '').toLowerCase();

    if (name.includes('roletada') || name.includes('sorte') || name.includes('girar')) {
      navigate('/roleta');
      return;
    }
    if (name.includes('transfer') || name.includes('transf')) {
      setIsTransferOpen(true);
      setSelectedItem(null);
      return;
    }

    const itemId = selectedItem.itemId?._id || selectedItem.itemId || selectedItem._id;
    useItemMutation.mutate(itemId);
  }, [selectedItem, navigate, useItemMutation]);

  const handleDiscard = () => {
    if (!selectedItem || !confirm("Jogar fora permanentemente?")) return;
    discardMutation.mutate(selectedItem._id);
  };

  const handleCancelTicket = (ticketId: string) => {
    if(!confirm("Cancelar ticket e devolver o item?")) return;
    cancelTicketMutation.mutate(ticketId);
  };

  const inventory = user?.inventory || [];
  // ✅ RELATÓRIO: Filtra buffs já expirados no client também (defesa dupla)
  const activeBuffs = useMemo(() => {
    const now = new Date();
    return (user?.activeBuffs || []).filter((b: any) => {
      return !b.expiresAt || new Date(b.expiresAt) > now;
    });
  }, [user?.activeBuffs]);
  
  // Filtros memoizados
  const filteredItems = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'buffs') {
      list = activeBuffs;
    } else {
      list = inventory.filter((slot: any) => {
        const category = slot.category || 'CONSUMIVEL';
        if (activeTab === 'skills') return category === 'RANK_SKILL';
        // ✅ Buffs na mochila (antes de usar) ficam na aba ITENS
        if (activeTab === 'itens') return category !== 'RANK_SKILL';
        return false;
      });
    }

    if (searchTerm) {
      list = list.filter((item: any) => {
        const name = item.itemId?.name || item.itemId?.nome || item.name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    return list;
  }, [activeTab, activeBuffs, inventory, searchTerm]);

  const TABS = [
    { id: 'itens', label: 'ITENS', icon: Gift, count: inventory.filter((i: any) => i.category !== 'RANK_SKILL').length },
    { id: 'skills', label: 'SKILLS', icon: Zap, count: inventory.filter((i: any) => i.category === 'RANK_SKILL').length },
    { id: 'buffs', label: 'BUFFS', icon: Sparkles, count: activeBuffs.length },
    { id: 'tickets', label: 'TICKETS', icon: Ticket, count: myTickets.length },
  ];

  if (loadingTickets && activeTab === 'tickets' && myTickets.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center animate-pulse flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
          <p className="font-press text-xs text-blue-400">ABRINDO MOCHILA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden relative">
      
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn("absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[100px]", !isMobile && "animate-pulse")} />
        <div className={cn("absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[100px]", !isMobile && "animate-pulse")} />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-6 pb-24 md:pl-28">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 pt-16 md:pt-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center shadow-lg">
              <Backpack className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-press text-lg sm:text-xl text-white">MOCHILA</h1>
              <div className="flex items-center gap-2">
                <p className="font-vt323 text-lg text-slate-400">INVENTÁRIO</p>
                {currentRank && (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 uppercase",
                    currentRank.border || "border-slate-700",
                    currentRank.color?.replace('text-', 'bg-') + "/10",
                    currentRank.color
                  )}>
                    <Crown size={10} /> {currentRank.name}
                  </span>
                )}

                {/* ✅ RELATÓRIO: Indicador de buffs ativos no header */}
                {activeBuffs.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 border-orange-700/50 text-orange-400 bg-orange-900/20">
                    <Flame size={10} className="animate-pulse" />
                    {activeBuffs.length} BUFF{activeBuffs.length > 1 ? 'S' : ''} ATIVO{activeBuffs.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg font-mono text-sm text-white bg-slate-900 border border-slate-800 focus:border-blue-500/50 outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-vt323 text-lg whitespace-nowrap transition-colors border",
                activeTab === tab.id
                  ? tab.id === 'buffs' && activeBuffs.length > 0
                    ? "bg-orange-600/20 border-orange-500/50 text-orange-100" // Aba Buffs ativa com cor especial
                    : "bg-blue-600/20 border-blue-500/50 text-blue-100"
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800"
              )}
            >
              <tab.icon size={16} className={tab.id === 'buffs' && activeBuffs.length > 0 ? "text-orange-400" : ""} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono",
                  tab.id === 'buffs' && activeBuffs.length > 0
                    ? "bg-orange-500/20 text-orange-300"
                    : "bg-black/40"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ✅ RELATÓRIO: Banner informativo na aba Buffs */}
        {activeTab === 'buffs' && activeBuffs.length > 0 && (
          <div className="mb-4 p-3 rounded-xl border border-orange-800/40 bg-orange-900/10 flex items-center gap-3">
            <Flame className="text-orange-400 shrink-0" size={18} />
            <p className="font-mono text-xs text-orange-300/80 leading-relaxed">
              Buffs são <strong>poderes passivos</strong> — ficam ativos automaticamente quando um monitor te der pontos. Nenhuma ação necessária. 🔥
            </p>
          </div>
        )}

        {/* Grid de Itens / Skills / Buffs */}
        {(activeTab === 'itens' || activeTab === 'skills' || activeTab === 'buffs') && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((slot: any, idx: number) => (
                <ItemCard
                  key={slot._id || idx}
                  slot={slot}
                  // ✅ RELATÓRIO: Buffs NÃO são clicáveis (sem modal de ação)
                  onClick={activeTab !== 'buffs' ? () => setSelectedItem(slot) : undefined}
                  index={idx}
                  isMobile={isMobile}
                  isBuff={activeTab === 'buffs'}
                />
              ))
            ) : (
              <div className="col-span-full py-16 text-center opacity-50">
                {activeTab === 'buffs' ? (
                  <>
                    <Sparkles className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="font-vt323 text-xl text-slate-500">SEM BUFFS ATIVOS</p>
                    <p className="font-mono text-xs text-slate-600 mt-1">Use um item Dobrador ou Triplicador da sua mochila</p>
                  </>
                ) : (
                  <>
                    <PackageX className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="font-vt323 text-xl text-slate-500">VAZIO</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tickets */}
        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myTickets.length > 0 ? (
              myTickets.map((t: any) => {
                const isUsed = t.status === 'USADO';
                return (
                  <div 
                    key={t._id} 
                    className={cn(
                      "p-4 rounded-xl border flex justify-between items-center transition-all",
                      isUsed 
                        ? "bg-slate-900/40 border-slate-800 opacity-60" 
                        : "bg-slate-900 border-slate-700 hover:border-blue-500/50 cursor-pointer" 
                    )}
                    onClick={() => !isUsed && setTicketModal(t)} 
                  >
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isUsed ? "bg-slate-800" : "bg-blue-900/20")}>
                            <Ticket className={isUsed ? "text-slate-500" : "text-blue-400"} size={20} />
                        </div>
                        <div>
                          <h3 className={cn("font-vt323 text-lg", isUsed ? "text-slate-500 line-through" : "text-white")}>
                            {t.itemNome}
                          </h3>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-[10px] text-slate-500 uppercase">
                              {t.hash}
                            </p>
                            {isUsed && (
                              <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700 uppercase">
                                USADO
                              </span>
                            )}
                          </div>
                        </div>
                    </div>
                    
                    {!isUsed && (
                      <button className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40">
                        <QrCode size={18} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-10 text-slate-500 font-vt323 text-xl">SEM HISTÓRICO DE TICKETS</div>
            )}
          </div>
        )}

      </div>

      {/* Modal Detalhes — NÃO abre para Buffs */}
      <AnimatePresence>
        {selectedItem && activeTab !== 'buffs' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0f0f13] border border-slate-700 rounded-2xl overflow-hidden z-10 p-6 flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-4 bg-black/50 rounded-xl flex items-center justify-center border border-slate-800 shadow-inner">
                <SafeImage 
                  src={selectedItem.itemId?.imagem || selectedItem.itemId?.image || selectedItem.image || selectedItem.imagem} 
                  alt={selectedItem.itemId?.name || selectedItem.name} 
                  className="h-16 w-16 object-contain drop-shadow-md" 
                />
              </div>
              
              <h2 className="font-vt323 text-3xl text-white uppercase text-center leading-none mb-2">
                {selectedItem.itemId?.name || selectedItem.name}
              </h2>

              {/* ✅ Badge de buff no modal (informa o aluno o que acontece ao usar) */}
              {(selectedItem.category === 'BUFF' || selectedItem.buffEffect) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-700/50 bg-orange-900/20 mb-3">
                  <Flame size={14} className="text-orange-400" />
                  <span className="font-mono text-xs text-orange-300">
                    Ativa buff passivo de <strong>{selectedItem.buffEffect}</strong>
                  </span>
                </div>
              )}
              
              <div className="w-full bg-slate-900/50 border border-slate-800 rounded p-3 mb-4 max-h-24 overflow-y-auto custom-scrollbar">
                  <p className="font-mono text-xs text-slate-400 text-center leading-relaxed">
                      {selectedItem.itemId?.descricao || selectedItem.descricao || selectedItem.description || "Nenhuma descrição disponível para este item misterioso."}
                  </p>
              </div>
              
              <div className="flex gap-2 justify-center mb-6 w-full">
                {(() => {
                  const v = formatValidity(selectedItem);
                  return (
                    <span className={cn(
                      "text-[10px] font-mono px-3 py-1 rounded border tracking-widest",
                      v.isUrgent
                        ? "text-orange-400 border-orange-800 bg-orange-900/20"
                        : "text-green-400 border-green-800 bg-green-900/20"
                    )}>
                      {v.label}
                    </span>
                  );
                })()}
                
                {selectedItem.isHouseItem && (
                    <span className="text-[10px] font-press px-2 py-1 rounded border text-purple-300 border-purple-800 bg-purple-900/30">
                        SALA
                    </span>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleDiscard} 
                  disabled={discardMutation.isPending}
                  className="flex-1 py-3 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg font-mono text-xs flex items-center justify-center gap-2 hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                >
                  {discardMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> LIXO</>}
                </button>
                <button 
                  onClick={handleUseItem} 
                  disabled={useItemMutation.isPending}
                  className={cn(
                    "flex-[2] py-3 rounded-lg font-press text-xs shadow-lg flex items-center justify-center disabled:opacity-50 transition-all",
                    (selectedItem.category === 'BUFF' || selectedItem.buffEffect)
                      ? "bg-orange-600 text-white hover:bg-orange-500"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  )}
                >
                  {useItemMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (selectedItem.category === 'BUFF' || selectedItem.buffEffect) ? (
                    <><Flame size={14} className="mr-1.5" /> ATIVAR BUFF</>
                  ) : (
                    "USAR ITEM"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE TICKET */}
      <AnimatePresence>
        {ticketModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setTicketModal(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white rounded-2xl p-6 text-center z-10 w-full max-w-xs">
              <h2 className="font-vt323 text-2xl text-black uppercase mb-4">{ticketModal.itemNome}</h2>
              <QRCode value={ticketModal.hash} size={180} className="mx-auto mb-4" />
              <p className="font-mono text-sm text-gray-500 mb-4">{ticketModal.hash}</p>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => setTicketModal(null)} className="w-full py-3 bg-black text-white font-mono text-sm rounded-lg">
                    FECHAR
                </button>
                
                <button 
                    onClick={() => handleCancelTicket(ticketModal._id)} 
                    disabled={cancelTicketMutation.isPending}
                    className="w-full py-3 bg-red-100 text-red-600 border border-red-200 font-mono text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                    {cancelTicketMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><XCircle size={16} /> CANCELAR E DEVOLVER</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} onSuccess={() => refreshUser()} />
    </div>
  );
}
