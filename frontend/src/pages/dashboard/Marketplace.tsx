import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ShoppingBag, PlusCircle, Search, DollarSign, X, Package, Filter, Gavel, Loader2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';
import { TradeManagerModal } from '../../components/features/TradeManagerModal';

const MarketCard = memo(({ listing, isMine, onBuy, onCancel }: { listing: any, isMine: boolean, onBuy: (id: string) => void, onCancel: (id: string) => void }) => {
  const isLuckyBlock = listing.item?.name?.toLowerCase().includes('lucky') || listing.item?.name?.toLowerCase().includes('surpresa');
  const itemData = listing.item || listing.itemData || {};
  const itemName = itemData.name || "Item Desconhecido";
  const itemImage = getImageUrl(itemData.image || itemData.imagem);
  const sellerName = listing.seller?.nome || 'Desconhecido';

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("relative flex flex-col bg-[#0f0f13] border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all", isMine ? "border-blue-900/30" : "")}>
      <div className="px-3 py-2 bg-black/20 flex items-center justify-between border-b border-slate-800/50">
        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">{isMine ? 'VOCÊ' : sellerName}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{new Date(listing.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="h-32 relative bg-gradient-to-b from-slate-900/50 to-transparent flex items-center justify-center p-4">
        <img src={itemImage} alt={itemName} className={cn("object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-110", isLuckyBlock ? "w-24 h-24 mt-2" : "w-16 h-16")} />
        {(itemData.quantity > 1 || listing.quantity > 1) && <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 px-1.5 rounded text-white border border-slate-700">x{itemData.quantity || listing.quantity}</span>}
      </div>
      <div className={cn("p-3 flex-1 flex flex-col", isLuckyBlock ? "pt-4" : "pt-3")}>
        <h3 className="font-vt323 text-lg text-white leading-tight line-clamp-2 min-h-[40px]">{itemName}</h3>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-yellow-400 font-press text-xs"><DollarSign size={12} />{listing.price?.toLocaleString()}</div>
          {isMine ? (
            <button onClick={() => onCancel(listing._id)} className="px-3 py-1.5 bg-red-900/20 text-red-400 text-[10px] font-mono rounded hover:bg-red-900/40 transition-colors border border-red-900/30">CANCELAR</button>
          ) : (
            <button onClick={() => onBuy(listing._id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-press rounded shadow-lg shadow-green-900/20 transition-all active:scale-95">COMPRAR</button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
MarketCard.displayName = 'MarketCard';

const SellModal = ({ isOpen, onClose, inventory, onSell, isLoadingInv }: any) => {
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const sellableItems = inventory.filter((i: any) => i.canSell !== false && i.category !== 'RANK_SKILL');

  const handleSubmit = () => {
    if (!selectedSlot || !price) return toast.error("Selecione um item e defina o preço.");

    // 🔥 FORÇA O FRONTEND A MANDAR O ITEM_ID DE PREFERÊNCIA, OU O SLOT_ID COMO FALLBACK
    const targetId = selectedSlot.itemId?._id || selectedSlot.itemId || selectedSlot._id;

    // Passa a flag isHouseItem se existir
    const isHouse = selectedSlot.isHouseItem === true || selectedSlot.origin === 'HOUSE_CUP';

    onSell(targetId, Number(price), quantity, isHouse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f13] border border-slate-700 w-full max-w-md rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 bg-black/40 flex justify-between items-center">
          <h2 className="font-press text-white text-sm flex items-center gap-2"><Gavel size={16} className="text-yellow-500" /> VENDER ITEM</h2>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar min-h-[200px]">
          {isLoadingInv ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-slate-500" /></div>
          ) : !selectedSlot ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sellableItems.map((slot: any) => (
                <div key={slot._id} onClick={() => setSelectedSlot(slot)} className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 cursor-pointer hover:border-blue-500 hover:bg-slate-800 transition-all flex flex-col items-center gap-2 relative">
                  <img src={getImageUrl(slot.image || slot.itemId?.imagem)} className="w-10 h-10 object-contain" onError={(e) => (e.currentTarget.src = '/assets/store.png')} />
                  <span className="text-[10px] text-center text-slate-300 line-clamp-2 leading-tight">{slot.name || slot.itemId?.nome}</span>
                  {slot.isHouseItem && <span className="absolute top-1 right-1 text-[7px] bg-purple-900 text-purple-300 px-1 rounded font-press">SALA</span>}
                </div>
              ))}
              {sellableItems.length === 0 && <p className="text-slate-500 col-span-full text-center py-4">Sua mochila está vazia.</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <img src={getImageUrl(selectedSlot.image || selectedSlot.itemId?.imagem)} className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="text-white font-bold">{selectedSlot.name || selectedSlot.itemId?.nome}</h3>
                  {selectedSlot.isHouseItem && <span className="text-[10px] text-purple-400 font-press">ITEM DA SALA</span>}
                  <button onClick={() => setSelectedSlot(null)} className="text-xs text-blue-400 hover:underline block mt-1">Trocar item</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Preço (PC$)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-white font-mono focus:border-yellow-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Quantidade</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} max={selectedSlot.quantity || 1} className="w-full bg-black border border-slate-700 rounded p-2 text-white font-mono focus:border-blue-500 outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-800 bg-black/40">
          <button onClick={handleSubmit} disabled={!selectedSlot || !price} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-press text-sm rounded transition-all">ANUNCIAR NA LOJA</button>
        </div>
      </motion.div>
    </div>
  );
};

export function Marketplace() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'global' | 'my_sales'>('global');
  const [searchTerm, setSearchTerm] = useState('');

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isTradeManagerOpen, setIsTradeManagerOpen] = useState(false);

  // 🎒 BUSCA A MOCHILA REAL (COM ITENS DO BECO) SÓ QUANDO ABRIR O MODAL DE VENDA
  const { data: fullInventory = [], isLoading: isLoadingInv } = useQuery({
    queryKey: ['inventory', 'full'],
    queryFn: async () => { const res = await api.get('/inventory/my'); return res.data; },
    enabled: isSellModalOpen
  });

  const { data: globalListings = [], isLoading: isLoadingGlobal } = useQuery({
    queryKey: ['market', 'global'],
    queryFn: async () => { const res = await api.get('/market'); return Array.isArray(res.data) ? res.data : []; },
    staleTime: 30000,
  });

  const { data: mySales = [], isLoading: isLoadingMine } = useQuery({
    queryKey: ['market', 'mine'],
    queryFn: async () => { const res = await api.get('/market/mine'); return Array.isArray(res.data) ? res.data : []; },
    staleTime: 60000,
  });

  const buyItemMutation = useMutation({
    mutationFn: async (listingId: string) => { await api.post('/market/buy', { listingId }); },
    onSuccess: () => {
      toast.success("Compra realizada!");
      queryClient.invalidateQueries({ queryKey: ['market', 'global'] });
      refreshUser();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Erro ao comprar.")
  });

  const cancelListingMutation = useMutation({
    mutationFn: async (listingId: string) => { await api.delete(`/market/${listingId}`); },
    onSuccess: async () => {
      toast.success("Anúncio removido e item devolvido à mochila!");

      // Força a recarga imediata das listas do mercado e do seu inventário
      await queryClient.invalidateQueries({ queryKey: ['market', 'mine'] });
      await queryClient.invalidateQueries({ queryKey: ['market', 'global'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory', 'full'] });

      refreshUser();
    }
  });

  const sellItemMutation = useMutation({
    mutationFn: async ({ slotId, price, quantity, isHouseItem }: any) => {
      await api.post('/market/sell', { itemId: slotId, price, quantity, isHouseItem });
    },
    onSuccess: () => {
      toast.success("Item anunciado na loja!");
      queryClient.invalidateQueries({ queryKey: ['market', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'full'] });
      refreshUser();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Erro ao anunciar.")
  });

  const handleBuy = useCallback((id: string) => confirm("Confirmar compra?") && buyItemMutation.mutate(id), [buyItemMutation]);
  const handleCancel = useCallback((id: string) => confirm("Remover anúncio?") && cancelListingMutation.mutate(id), [cancelListingMutation]);
  const handleSell = useCallback((id: string, price: number, qtd: number, isHouseItem: boolean) => sellItemMutation.mutate({ slotId: id, price, quantity: qtd, isHouseItem }), [sellItemMutation]);

  const currentList = activeTab === 'global' ? globalListings : mySales;
  const filteredListings = currentList.filter(item => (item.item?.name || item.itemData?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const isLoading = activeTab === 'global' ? isLoadingGlobal : isLoadingMine;

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px]" />
      </div>

      <div className="relative z-10 px-4 py-6 pb-24 md:pl-28 min-h-screen flex flex-col">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pt-16 md:pt-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-press text-xl text-white">MERCADO PÚBLICO</h1>
              <p className="font-mono text-xs text-slate-400">COMPRA E VENDA DE ITENS</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Buscar ofertas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-yellow-600/50 outline-none transition-all" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsTradeManagerOpen(true)} className="flex-1 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/50 text-purple-300 hover:text-white font-press text-[10px] sm:text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg">
                <ArrowRightLeft size={16} /> <span className="hidden sm:inline">TROCAS P2P</span>
              </button>
              <button onClick={() => setIsSellModalOpen(true)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-press text-[10px] sm:text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                <PlusCircle size={16} /> <span className="hidden sm:inline">VENDER</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('global')} className={cn("pb-3 text-sm font-mono flex items-center gap-2 transition-all border-b-2 whitespace-nowrap", activeTab === 'global' ? "text-white border-yellow-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
            <ShoppingBag size={14} /> GERAL
          </button>
          <button onClick={() => setActiveTab('my_sales')} className={cn("pb-3 text-sm font-mono flex items-center gap-2 transition-all border-b-2 whitespace-nowrap", activeTab === 'my_sales' ? "text-white border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300")}>
            <Package size={14} /> MINHAS VENDAS
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
            <p className="font-mono text-xs">BUSCANDO OFERTAS...</p>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredListings.map((listing) => (
                <MarketCard key={listing._id} listing={listing} isMine={listing.seller?._id === user?._id} onBuy={handleBuy} onCancel={handleCancel} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl m-4">
            <Filter className="w-12 h-12 mb-2 opacity-50" />
            <p className="font-mono text-sm">NENHUMA OFERTA ENCONTRADA</p>
          </div>
        )}

      </div>

      {/* MODAL DE VENDER (Agora com itens do Beco!) */}
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} inventory={fullInventory} isLoadingInv={isLoadingInv} onSell={handleSell} />

      {/* O PODEROSO GERENCIADOR DE TROCAS */}
      <TradeManagerModal isOpen={isTradeManagerOpen} onClose={() => setIsTradeManagerOpen(false)} />

    </div>
  );
}