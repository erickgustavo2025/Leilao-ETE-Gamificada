import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p className="font-press text-xs text-slate-500 animate-pulse uppercase">Sincronizando Sistema...</p>
    </div>
  );
}
