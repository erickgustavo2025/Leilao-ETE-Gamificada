import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Search, 
  Terminal, 
  AlertTriangle,  
  RefreshCcw, 
  Loader2,
  Wallet,
  Briefcase,
  ArrowRightLeft,
  BookOpen,
  X
} from 'lucide-react';
import { MarketEducation } from './components/MarketEducation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../api/axios-config';
import { queryKeys } from '../../../utils/queryKeys';
import { cn } from '../../../utils/cn';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../contexts/AuthContext';
import { formatCurrency } from '../../../utils/formatters';
import { AssetCard, type Asset } from './components/AssetCard';
import { BuySellModal } from './components/BuySellModal';
import { CreateStartupModal } from './components/CreateStartupModal';

interface StartupAsset {
    _id: string;
    tag: string;
    nome: string;
    valorPorAcao: number;
    acoesDisponiveis: number;
    performanceAcademica: number;
    status: string;
    logo?: string;
}

const GilInveste: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STOCK' | 'CRYPTO' | 'STARTUP'>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isIPOModalOpen, setIsIPOModalOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);

  const { 
    data: assets, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useQuery<Asset[]>({
    queryKey: queryKeys.investments.cotacoes(activeFilter !== 'ALL' ? activeFilter : undefined),
    queryFn: async () => {
      if (activeFilter === 'STARTUP') {
        const response = await api.get('/startups', { params: { status: 'LISTADA' } });
        // Mapear GilEmpresa para Asset
        return response.data.map((s: StartupAsset) => ({
          _id: s._id,
          symbol: s.tag,
          shortName: s.nome,
          regularMarketPrice: s.valorPorAcao,
          regularMarketChange: 0, // Inicia em 0 até ter histórico
          regularMarketChangePercent: 0,
          logourl: s.logo || '',
          assetType: 'STARTUP'
        }));
      }
      const params = activeFilter !== 'ALL' ? { assetType: activeFilter } : {};
      const response = await api.get('/investimentos/cotacoes', { params });
      return response.data;
    },
    refetchInterval: 1000 * 60 * 5,
  });

  const filteredAssets = assets?.filter(asset => 
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo do Portfólio
  const userInvestments = user?.investments;
  
  const portfolioData = useMemo(() => {
    if (!userInvestments || !assets) return { items: [], totalValue: 0, totalProfit: 0 };

    const items = userInvestments.map(inv => {
      const currentAsset = assets.find(a => a.symbol === inv.symbol);
      const currentPrice = currentAsset?.regularMarketPrice || inv.averagePrice;
      const currentValue = currentPrice * inv.quantity;
      const costBasis = inv.averagePrice * inv.quantity;
      const profit = currentValue - costBasis;
      const profitPercent = (profit / costBasis) * 100;

      return {
        ...inv,
        currentPrice,
        currentValue,
        profit,
        profitPercent,
        assetData: currentAsset
      };
    });

    const totalValue = items.reduce((acc, item) => acc + item.currentValue, 0);
    const totalCost = items.reduce((acc, item) => acc + (item.averagePrice * item.quantity), 0);
    const totalProfit = totalValue - totalCost;

    return { items, totalValue, totalProfit };
  }, [userInvestments, assets]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans p-4 md:p-8 pb-24 pt-24 md:pt-32">
      {/* Header Cyberpunk */}
      <header className="mb-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Terminal size={16} className="animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">GIL INVESTE</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-vt323 text-white uppercase tracking-tighter leading-none">
              HOME <span className="text-emerald-500">BROKER</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-2 md:p-3 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={20} className={cn("text-emerald-500", isFetching && "animate-spin")} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Status Mercado</p>
                <p className="text-sm font-vt323 text-white tracking-widest uppercase">
                  {isFetching ? "Sincronizando..." : isError ? "Offline" : "Sincronizado"}
                </p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-2 md:p-3 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Saldo Disponível</p>
                <p className="text-sm font-vt323 text-white tracking-widest uppercase">
                  {formatCurrency(user?.saldoPc || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-4 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500/50 via-slate-800 to-transparent" />
      </header>

      {/* 📖 BLOCO DE CONHECIMENTO (ESTACIONÁRIO NO TOPO DIREITO) */}
      <button 
        onClick={() => setIsEduModalOpen(true)}
        className="absolute top-4 right-4 z-[100] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-slate-900/90 border-2 border-emerald-500/50 rounded-xl cursor-pointer outline-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-all hover:scale-105 group backdrop-blur-sm"
        title="Escola de Investidores"
      >
        <div className="flex flex-col items-center gap-0.5">
          <BookOpen size={20} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="font-press text-[5px] text-emerald-500 hidden md:block">MANUAL</span>
        </div>
      </button>

      {/* Minha Carteira (Portfolio) */}
      {user?.investments && user.investments.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-blue-400" />
            <h2 className="text-xl font-vt323 text-white uppercase tracking-widest">Minha Carteira</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/30 border border-slate-800 p-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Patrimônio em Ativos</p>
              <p className="text-3xl font-vt323 text-white">{formatCurrency(portfolioData.totalValue)}</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-800 p-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Lucro/Prejuízo Total</p>
              <p className={cn(
                "text-3xl font-vt323",
                portfolioData.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {portfolioData.totalProfit >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalProfit)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 bg-slate-900/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Ativo</th>
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Qtd</th>
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Preço Médio</th>
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Preço Atual</th>
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Resultado</th>
                  <th className="p-3 text-[10px] text-slate-500 uppercase font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="font-vt323 text-lg">
                {portfolioData.items.map((item) => (
                  <tr key={item.symbol} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 text-white uppercase">{item.symbol}</td>
                    <td className="p-3 text-slate-300">{item.quantity}</td>
                    <td className="p-3 text-slate-400">{formatCurrency(item.averagePrice)}</td>
                    <td className="p-3 text-white">{formatCurrency(item.currentPrice)}</td>
                    <td className={cn("p-3", item.profit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {item.profitPercent.toFixed(2)}%
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => item.assetData && setSelectedAsset(item.assetData)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/50 text-blue-400 text-xs uppercase font-bold hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <ArrowRightLeft size={12} />
                        Operar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Mercado (Market) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h2 className="text-xl font-vt323 text-white uppercase tracking-widest">Mercado de Ativos</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR ATIVO (EX: PETR4, BTC)..."
              className="w-full bg-slate-900/50 border-2 border-slate-800 focus:border-emerald-500/50 outline-none p-2.5 pl-10 text-xs font-bold tracking-wider text-white transition-all uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'STOCK', 'CRYPTO', 'STARTUP'].map((f) => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={cn(
                  "px-4 py-2 text-[10px] font-bold tracking-widest uppercase border-2 transition-all whitespace-nowrap",
                  activeFilter === f ? "bg-emerald-500 border-emerald-500 text-black" : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-700"
                )}
              >
                {f === 'ALL' ? 'Todos' : f === 'STOCK' ? 'Ações B3' : f === 'CRYPTO' ? 'Cripto' : 'Startups'}
              </button>
            ))}
            <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block" />
            <button 
              onClick={() => setIsIPOModalOpen(true)}
              className="px-4 py-2 bg-blue-600 border-2 border-blue-600 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-blue-500 transition-all whitespace-nowrap shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
            >
              Lançar IPO
            </button>
            <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block" />
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 border-2 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCcw size={18} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Assets Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="font-vt323 text-2xl text-emerald-500 animate-pulse uppercase tracking-widest">
              Acessando Terminal Financeiro...
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-rose-500/30 bg-rose-500/5">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
            <p className="font-vt323 text-2xl text-rose-500 uppercase tracking-widest">
              Falha na Conexão com o Servidor
            </p>
            <button onClick={() => refetch()} className="mt-4 px-6 py-2 bg-rose-500 text-black font-bold text-xs uppercase hover:bg-rose-400 transition-all">
              Tentar Reconectar
            </button>
          </div>
        ) : filteredAssets?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800">
            <p className="font-vt323 text-2xl text-emerald-500 uppercase tracking-widest text-center">
              {searchTerm ? `Nenhum ativo encontrado para: "${searchTerm}"` : "Preparando mercado..."}
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {filteredAssets?.map((asset) => (
              <AssetCard 
                key={asset._id} 
                asset={asset} 
                isMobile={isMobile} 
                onClick={(a) => setSelectedAsset(a)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal de Operação */}
      {selectedAsset && (
        <BuySellModal 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)}
          userBalance={user?.saldoPc || 0}
          userQuantity={user?.investments?.find(i => i.symbol === selectedAsset.symbol)?.quantity || 0}
        />
      )}

      {/* Modal de IPO */}
      {isIPOModalOpen && (
        <CreateStartupModal onClose={() => setIsIPOModalOpen(false)} />
      )}

      {/* Modal de Educação Financeira (Oráculo) */}
      <AnimatePresence>
        {isEduModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/30 p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(16,185,129,0.1)] rounded-[2rem]"
            >
              <button 
                onClick={() => setIsEduModalOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <MarketEducation />

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setIsEduModalOpen(false)}
                  className="px-10 py-4 bg-emerald-600 text-white font-press text-[10px] rounded-2xl hover:bg-emerald-500 transition-all shadow-lg"
                >
                  ENTENDI, ORÁCULO!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Gil Investe</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-700 uppercase font-bold tracking-tighter">
          © 2026 ETE GAMIFICADA - GIL INVESTE - TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  );
};

export { GilInveste };
export default GilInveste;
