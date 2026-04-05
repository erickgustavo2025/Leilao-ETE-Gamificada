import React, { useState } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
import { cn } from '../../../../utils/cn';
import { formatCurrency } from '../../../../utils/formatters';
import { type Asset } from './AssetCard';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';

interface BuySellModalProps {
  asset: Asset;
  onClose: () => void;
  userBalance: number;
  userQuantity: number;
}

export const BuySellModal: React.FC<BuySellModalProps> = ({ asset, onClose, userBalance, userQuantity }) => {
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(1);
  const { refreshUser } = useAuth();

  const totalValue = asset.regularMarketPrice * quantity;
  const brokerageFee = 1;
  const finalValue = mode === 'BUY' ? totalValue + brokerageFee : totalValue - brokerageFee;

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = mode === 'BUY' ? '/investimentos/buy' : '/investimentos/sell';
      const response = await api.post(endpoint, {
        symbol: asset.symbol,
        quantity: quantity
      });
      return response.data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || 'Operação realizada com sucesso!');
      // 🚀 SINCRONIZAÇÃO INSTANTÂNEA: Atualiza o perfil global do aluno
      await refreshUser();
      onClose();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Erro ao processar operação.';
      toast.error(msg);
    }
  });

  const canExecute = mode === 'BUY' 
    ? userBalance >= finalValue && quantity > 0
    : userQuantity >= quantity && quantity > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={cn(
        "w-full max-w-md bg-slate-900 border-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden",
        mode === 'BUY' ? "border-emerald-500" : "border-rose-500"
      )}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Info size={12} />
              <span>Terminal de Operação</span>
            </div>
            <h2 className="text-3xl font-vt323 text-white uppercase tracking-tighter">
              {asset.symbol} <span className="text-slate-500">/ {asset.shortName}</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setMode('BUY')}
            className={cn(
              "flex-1 py-2 font-vt323 text-xl uppercase tracking-widest border-2 transition-all",
              mode === 'BUY' ? "bg-emerald-500 border-emerald-500 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]" : "bg-transparent border-slate-800 text-slate-500"
            )}
          >
            Comprar
          </button>
          <button 
            onClick={() => setMode('SELL')}
            className={cn(
              "flex-1 py-2 font-vt323 text-xl uppercase tracking-widest border-2 transition-all",
              mode === 'SELL' ? "bg-rose-500 border-rose-500 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]" : "bg-transparent border-slate-800 text-slate-500"
            )}
          >
            Vender
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950 border border-slate-800 p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Preço Unitário</p>
            <p className="text-xl font-vt323 text-white">{formatCurrency(asset.regularMarketPrice)}</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Disponível</p>
            <p className="text-xl font-vt323 text-white">
              {mode === 'BUY' ? formatCurrency(userBalance) : `${userQuantity} Un`}
            </p>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="mb-6">
          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">
            Quantidade de Ativos
          </label>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="w-12 h-12 border-2 border-slate-800 text-white font-vt323 text-2xl hover:bg-slate-800 transition-colors"
            >
              -
            </button>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 h-12 bg-slate-950 border-2 border-slate-800 text-center text-white font-vt323 text-2xl focus:border-slate-600 outline-none"
            />
            <button 
              onClick={() => setQuantity(prev => prev + 1)}
              className="w-12 h-12 border-2 border-slate-800 text-white font-vt323 text-2xl hover:bg-slate-800 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-950 border-2 border-slate-800 p-4 mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 uppercase">Valor dos Ativos</span>
            <span className="text-white font-bold">{formatCurrency(totalValue)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 uppercase">Taxa de Corretagem</span>
            <span className="text-white font-bold">{formatCurrency(brokerageFee)}</span>
          </div>
          <div className="h-[1px] bg-slate-800 my-2" />
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total da Ordem</span>
            <span className={cn(
              "text-2xl font-vt323",
              mode === 'BUY' ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatCurrency(finalValue)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          disabled={!canExecute || mutation.isPending}
          onClick={() => mutation.mutate()}
          className={cn(
            "w-full py-4 font-vt323 text-2xl uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            mode === 'BUY' ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-rose-500 text-black hover:bg-rose-400"
          )}
        >
          {mutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" />
              <span>Processando...</span>
            </div>
          ) : (
            <span>Confirmar {mode === 'BUY' ? 'Compra' : 'Venda'}</span>
          )}
        </button>

        {/* Decorative elements */}
        <div className={cn(
          "absolute top-0 right-0 w-8 h-8 opacity-20",
          mode === 'BUY' ? "bg-emerald-500 rotate-45 translate-x-4 -translate-y-4" : "bg-rose-500 rotate-45 translate-x-4 -translate-y-4"
        )} />
      </div>
    </div>
  );
};
