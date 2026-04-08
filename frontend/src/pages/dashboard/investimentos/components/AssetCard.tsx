import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatCurrency } from '../../../../utils/formatters';

export interface Asset {
  _id: string;
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  logourl: string;
  assetType: 'STOCK' | 'CRYPTO' | 'STARTUP';
}

interface AssetCardProps {
  asset: Asset;
  isMobile?: boolean;
  onClick?: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, isMobile, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const isPositive = asset.regularMarketChange >= 0;

  return (
    <div 
      onClick={() => onClick && onClick(asset)}
      className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 group cursor-pointer active:scale-[0.98]",
      isPositive 
        ? "border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5" 
        : "border-rose-500/30 hover:border-rose-500 bg-rose-500/5",
      isMobile ? "p-3" : "p-4"
    )}>
      {/* Glitch Effect on Hover (Desktop only) */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-white mix-blend-overlay transition-opacity" />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {!imageError && asset.logourl ? (
              <img 
                src={asset.logourl} 
                alt={asset.symbol}
                className="w-10 h-10 rounded-full object-contain bg-white p-1 border border-slate-700"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                {asset.symbol.substring(0, 2)}
              </div>
            )}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] font-bold",
              asset.assetType === 'STOCK' ? "bg-blue-500 text-white" : 
              asset.assetType === 'STARTUP' ? "bg-purple-500 text-white" : "bg-yellow-500 text-black"
            )}>
              {asset.assetType === 'STOCK' ? 'A' : asset.assetType === 'STARTUP' ? 'S' : 'C'}
            </div>
          </div>
          <div>
            <h3 className="font-vt323 text-xl leading-none text-white uppercase tracking-wider">
              {asset.symbol}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase truncate max-w-[120px]">
              {asset.shortName}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={cn(
            "flex items-center justify-end gap-1 font-vt323 text-lg",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{asset.regularMarketChangePercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Preço Atual</span>
          <span className="font-vt323 text-2xl text-white">
            {formatCurrency(asset.regularMarketPrice)}
          </span>
        </div>
        
        <div className="h-[1px] w-full bg-slate-800" />
        
        <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{asset.regularMarketTime ? new Date(asset.regularMarketTime).toLocaleTimeString() : '--:--'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={10} />
            <span>Terminal {asset.assetType}</span>
          </div>
        </div>
      </div>

      {/* Cyberpunk Decorative Elements */}
      <div className={cn(
        "absolute top-0 right-0 w-2 h-2 border-t border-r",
        isPositive ? "border-emerald-500" : "border-rose-500"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-2 h-2 border-b border-l",
        isPositive ? "border-emerald-500" : "border-rose-500"
      )} />
    </div>
  );
};
