import { useState, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Loader2, Search, WifiOff, Coins, Store, Ghost,
  Package, ShoppingBag,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { getImageUrl } from '../../utils/imageHelper';
import { useGameSound } from '../../hooks/useGameSound';
import { cn } from '../../utils/cn';
import { triggerSimpleConfetti, triggerEpicConfetti } from '../../utils/confetti';
import { queryKeys } from '../../utils/queryKeys';

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
// ESTILOS DE RARIDADE (CSS PURO)
// ========================
const RANK_STYLES: Record<string, string> = {
  'BRONZE': 'border-orange-700/50 text-orange-400 bg-orange-950/20',
  'PRATA': 'border-slate-500/50 text-slate-300 bg-slate-800/20',
  'OURO': 'border-yellow-500/50 text-yellow-400 bg-yellow-900/10',
  'DIAMANTE': 'border-cyan-500/50 text-cyan-400 bg-cyan-900/10',
  'ÉPICO': 'border-purple-500/50 text-purple-400 bg-purple-900/10',
  'LENDÁRIO': 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-900/10',
  'SUPREMO': 'border-red-600/50 text-red-400 bg-red-900/10',
  'MITHOLÓGICO': 'border-rose-800/50 text-rose-400 bg-rose-900/10',
  'MITOLÓGICO': 'border-rose-800/50 text-rose-400 bg-rose-900/10',
  'SOBERANO': 'border-yellow-200/50 text-yellow-100 bg-yellow-100/10',
  'COMUM': 'border-slate-700/50 text-slate-400 bg-slate-900/20',
  'EVENTO': 'border-green-500/50 text-green-400 bg-green-900/10',
  'RANK SKILL': 'border-blue-500/50 text-blue-400 bg-blue-900/10'
};

const getStyle = (rarity: string) => {
  if (!rarity) return RANK_STYLES['COMUM'];
  const r = rarity.toUpperCase().trim();
  if (r.includes('SOBERANO')) return RANK_STYLES['SOBERANO'];
  if (r.includes('MITOLÓGICO') || r.includes('MITHOLÓGICO') || r === 'MITOLOGICO') return RANK_STYLES['MITHOLÓGICO'];
  if (r.includes('SUPREMO')) return RANK_STYLES['SUPREMO'];
  if (r.includes('LENDÁRIO') || r.includes('LENDARIO')) return RANK_STYLES['LENDÁRIO'];
  if (r === 'ÉPICO' || r === 'EPICO') return RANK_STYLES['ÉPICO'];
  if (r.includes('DIAMANTE')) return RANK_STYLES['DIAMANTE'];
  if (r.includes('OURO') || r.includes('GOLD')) return RANK_STYLES['OURO'];
  if (r.includes('PRATA') || r.includes('SILVER')) return RANK_STYLES['PRATA'];
  if (r.includes('BRONZE')) return RANK_STYLES['BRONZE'];
  if (r.includes('EVENTO')) return RANK_STYLES['EVENTO'];
  if (r.includes('SKILL')) return RANK_STYLES['RANK SKILL'];
  return RANK_STYLES['COMUM'];
};

const TABS = ['Todos', 'Bronze', 'Prata', 'Ouro', 'Diamante', 'Épico', 'Épico Lendário', 'Épico Supremo', 'Épico Mitológico', 'Épico Soberano', 'Evento', 'Comum'];

interface StoreItem {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagem: string;
  raridade: string;
  cargoExclusivo: string;
  validadeDias?: number;
  isHouseItem?: boolean;
}

// ✅ RELATÓRIO 2.1: Interface para config do sistema
interface SystemConfig {
  becoDiagonalOpen: boolean;
  siteName?: string;
  maintenanceMode?: boolean;
}

// ========================
// COMPONENTE: Partícula (Somente Desktop)
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
// COMPONENTE: Card de Item
// ========================
interface ItemCardProps {
  item: StoreItem;
  user: any;
  buyingId: string | null;
  isBeco: boolean;
  onClick: () => void;
  index: number;
  isMobile: boolean;
}

const ItemCard = memo(({ item, user, buyingId, isBeco, onClick, index, isMobile }: ItemCardProps) => {
  const style = getStyle(item.raridade);
  const canAfford = (user?.saldoPc || 0) >= item.preco;
  const hasStock = item.estoque > 0;
  const borderColor = style.split(' ')[0];

  const motionProps = isMobile ? {
    initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.02 }
  } : {
    initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.03 }
  };

  return (
    <motion.div {...motionProps} onClick={onClick} className="group cursor-pointer h-full">
      <div 
        className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-xl transition-all duration-200 border",
          isMobile ? "bg-[#0f0f13]" : "bg-slate-900/60 backdrop-blur-xl",
          borderColor,
          !isMobile && "hover:-translate-y-1 hover:shadow-xl"
        )}
      >
        {isBeco && (
          <div className="absolute top-2 left-2 z-20">
            <div className="flex items-center gap-1 bg-purple-600/90 px-1.5 py-0.5 rounded border border-purple-400/30">
              <Ghost size={10} className="text-purple-200" />
              <span className="font-mono text-[8px] text-purple-100 uppercase">Sala</span>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 z-20">
          <span className={cn(
            "text-[9px] font-vt323 font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
            isMobile ? "bg-black/90" : "backdrop-blur-md bg-black/40",
            style
          )}>
            {item.raridade}
          </span>
        </div>

        <div className="h-32 bg-gradient-to-br from-black/60 to-slate-900/60 relative flex items-center justify-center p-4 mt-4">
          <motion.img
            src={getImageUrl(item.imagem)}
            alt={item.nome}
            className={cn(
              "h-24 w-24 object-contain drop-shadow-lg transition-transform duration-300",
              !hasStock && "grayscale opacity-50",
              !isMobile && "group-hover:scale-110"
            )}
            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store.png'; }}
          />
          {!hasStock && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-red-600/80 px-3 py-1.5 rounded-lg -rotate-6">
                <Package className="w-4 h-4 text-white" />
                <span className="font-press text-[10px] text-white">ESGOTADO</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col bg-black/20">
          <h3 className="font-vt323 text-lg text-white leading-tight mb-1 line-clamp-1 group-hover:text-pink-400 transition-colors">
            {item.nome}
          </h3>
          <div className="mt-auto pt-2 border-t border-white/5">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1">
                <Coins className={cn("w-3 h-3", canAfford ? "text-green-400" : "text-red-400")} />
                <span className={cn("font-vt323 text-lg", canAfford ? "text-green-400" : "text-red-400")}>
                  {item.preco.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                <Package className="w-3 h-3" /> {item.estoque}
              </span>
            </div>
            
            <button
              className={cn(
                "w-full py-2 rounded font-press text-[9px] flex items-center justify-center gap-2 transition-all",
                !canAfford || !hasStock
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-sm"
              )}
              disabled={!canAfford || !hasStock}
            >
              {!hasStock ? "SEM ESTOQUE" : !canAfford ? "FALTA GRANA" : buyingId === item._id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><ShoppingCart className="w-3 h-3" /> COMPRAR</>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
ItemCard.displayName = 'ItemCard';

// ========================
// COMPONENTE PRINCIPAL: Loja
// ========================
export function Loja() {
  const { user, refreshUser } = useAuth();
  const { playSuccess, playError } = useGameSound();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Estados Locais de UI
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [storeSection, setStoreSection] = useState<'NORMAL' | 'BECO'>('NORMAL');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // ✅ RELATÓRIO 2.1: Busca configuração pública do sistema
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const res = await api.get('/public/config');
      return {
        becoDiagonalOpen: res.data.becoDiagonalOpen ?? true,
        siteName: res.data.siteName,
        maintenanceMode: res.data.maintenanceMode,
      };
    },
    staleTime: 1000 * 30, // 30s — atualiza com frequência para capturar mudanças do Admin
    refetchInterval: 1000 * 60, // Polling a cada 60s em background
  });

  // ✅ RELATÓRIO 2.3: Trava de segurança — Admin fecha o Beco enquanto aluno está dentro
  useEffect(() => {
    if (storeSection === 'BECO' && systemConfig?.becoDiagonalOpen === false) {
      setStoreSection('NORMAL');
      toast.error('O Beco Diagonal foi fechado pelo Ministério!');
    }
  }, [systemConfig?.becoDiagonalOpen, storeSection]);

  // Busca itens da loja
  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['storeItems'],
    queryFn: async () => {
      const res = await api.get('/store/items');
      return res.data as StoreItem[];
    }
  });

  // Mutação de compra
  const buyMutation = useMutation({
    mutationFn: async (item: StoreItem) => {
      const res = await api.post(`/store/buy/${item._id}`);
      return { data: res.data, item };
    },
    onMutate: (item) => {
      setBuyingId(item._id);
    },
    onSuccess: (result) => {
      const item = result.item;
      playSuccess();
      const isRare = item.raridade.includes('Épico') || item.raridade.includes('Diamante');
      isRare ? triggerEpicConfetti() : triggerSimpleConfetti();
      toast.success("COMPRA REALIZADA!", { description: `${item.nome} adicionado.` });
      
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      setSelectedItem(null);
    },
    onError: (error: any) => {
      playError();
      toast.error(error.response?.data?.message || "Erro na compra");
    },
    onSettled: () => {
      setBuyingId(null);
    }
  });

  // Handler de compra
  const handleBuy = (item: StoreItem) => {
    if (!user) return;
    if (user.saldoPc < item.preco) {
      playError();
      toast.error("SALDO INSUFICIENTE!");
      return;
    }
    buyMutation.mutate(item);
  };

  // Filtros
  const filteredItems = useMemo(() => items.filter(item => {
    const isBecoItem = item.isHouseItem === true;
    if (storeSection === 'NORMAL' && isBecoItem) return false;
    if (storeSection === 'BECO' && !isBecoItem) return false;

    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeTab === 'Todos' || item.raridade === activeTab;
    return matchesSearch && matchesFilter;
  }), [items, storeSection, searchTerm, activeTab]);

  const particleCount = isMobile ? 0 : 15;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <ShoppingBag className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <p className="font-press text-xs text-pink-400">CARREGANDO LOJA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn("absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-pink-900/10 blur-[100px]", !isMobile && "animate-pulse")} />
        <div className={cn("absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[100px]", !isMobile && "animate-pulse")} />
      </div>

      {!isMobile && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(particleCount)].map((_, i) => (
            <FloatingParticle key={i} delay={i * 0.3} color={i % 2 === 0 ? 'bg-pink-400' : 'bg-purple-400'} />
          ))}
        </div>
      )}

      <div className="relative z-10 min-h-screen px-4 py-6 pb-24 md:pl-28">
        <div className="flex flex-col gap-4 mb-6 ml-16 md:ml-0 pt-16 md:pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-press text-lg sm:text-xl text-white">LOJA OFICIAL</h1>
                <p className="font-vt323 text-lg text-slate-400">GASTE COM SABEDORIA</p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl border border-green-500/30 bg-slate-900/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-slate-400 uppercase">Seu Saldo</p>
                <p className="font-vt323 text-xl text-green-400">{(user?.saldoPc || 0).toLocaleString()} PC$</p>
              </div>
            </div>
          </div>

          {/* ✅ RELATÓRIO 2.2 + 2.4: Botões de seção com controle condicional e animação suave no Beco */}
          <div className="flex gap-2">
            <button
              onClick={() => setStoreSection('NORMAL')}
              className={cn(
                "px-4 py-2 rounded-lg font-press text-xs flex items-center gap-2 transition-all border",
                storeSection === 'NORMAL' ? "bg-pink-600 border-pink-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400"
              )}
            >
              <Store size={14} /> LOJA
            </button>

            {/* ✅ RELATÓRIO 2.2: Renderização condicional — só aparece se Admin liberar */}
            <AnimatePresence>
              {systemConfig?.becoDiagonalOpen && (
                // ✅ RELATÓRIO 2.4: Animação suave de entrada ao ser liberado pelo Admin
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <button
                    onClick={() => setStoreSection('BECO')}
                    className={cn(
                      "px-4 py-2 rounded-lg font-press text-xs flex items-center gap-2 transition-all border",
                      storeSection === 'BECO' ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400"
                    )}
                  >
                    <Ghost size={14} /> BECO
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isError ? (
          <div className="rounded-xl p-8 text-center bg-red-900/20 border border-red-500/50">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-press text-xs text-red-400 mb-2">SERVIDOR OFF-LINE</h2>
            <button onClick={() => refetch()} className="px-4 py-2 bg-red-600 rounded text-white font-press text-[10px]">RECARREGAR</button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar item..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-pink-500/50 outline-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border font-vt323 text-lg whitespace-nowrap transition-colors",
                      activeTab === tab ? "bg-slate-800 text-white border-pink-500/50" : "bg-slate-900/50 text-slate-500 border-slate-800"
                    )}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    user={user}
                    buyingId={buyingId}
                    isBeco={storeSection === 'BECO'}
                    onClick={() => setSelectedItem(item)}
                    index={idx}
                    isMobile={isMobile}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center opacity-50">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="font-vt323 text-xl text-slate-500">NADA AQUI</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== MODAL DE DETALHES ========== */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelectedItem(null)} 
              />
              
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={cn(
                  "relative w-full max-w-sm bg-[#0f0f13] border-2 rounded-2xl overflow-hidden z-10",
                  getStyle(selectedItem.raridade).split(' ')[0]
                )}
              >
                <div className="p-6 text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-black/50 rounded-full flex items-center justify-center border border-white/10">
                    <img 
                      src={getImageUrl(selectedItem.imagem)} 
                      alt={selectedItem.nome} 
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  <h2 className="font-vt323 text-2xl text-white uppercase mb-2">{selectedItem.nome}</h2>
                  <span className={cn("text-xs font-mono px-2 py-0.5 rounded border uppercase", getStyle(selectedItem.raridade))}>
                    {selectedItem.raridade}
                  </span>

                  <p className="font-vt323 text-lg text-slate-300 mt-4 mb-6 leading-tight">
                    {selectedItem.descricao}
                  </p>

                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="font-mono text-[10px] text-slate-500 uppercase mb-1">Preço</p>
                    <p className={cn("font-vt323 text-3xl", (user?.saldoPc || 0) >= selectedItem.preco ? "text-green-400" : "text-red-500")}>
                      {selectedItem.preco.toLocaleString()} PC$
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuy(selectedItem)}
                    disabled={(user?.saldoPc || 0) < selectedItem.preco || selectedItem.estoque <= 0 || buyingId === selectedItem._id}
                    className={cn(
                      "w-full py-3 rounded-lg font-press text-xs flex items-center justify-center gap-2 transition-all",
                      (user?.saldoPc || 0) >= selectedItem.preco && selectedItem.estoque > 0
                        ? "bg-green-600 text-white hover:bg-green-500"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    )}
                  >
                    {buyingId === selectedItem._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selectedItem.estoque <= 0 ? (
                      "ESGOTADO"
                    ) : (user?.saldoPc || 0) < selectedItem.preco ? (
                      "SALDO INSUFICIENTE"
                    ) : (
                      "CONFIRMAR COMPRA"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
