import { motion } from 'framer-motion';
import { 
  Construction, ArrowRight, 
  Wrench, ShieldAlert, LogIn 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { PageTransition } from '../../components/layout/PageTransition';
import { api } from '../../api/axios-config';
import { queryKeys } from '../../utils/queryKeys';

export function Maintenance() {
  /* --- BUSCA APENAS NOME DO SITE (Sem automação de redirecionamento) --- */
  const { data: config } = useQuery({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      try {
        const { data } = await api.get('/public/config');
        return data as { siteName?: string };
      } catch (error) {
        // Se o backend barrar por causa da manutenção (503), não faz nada.
        return null; 
      }
    },
    retry: false, // Não fica floodando o backend de requisições
    staleTime: Infinity,
  });

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
      
      {/* Background Decorativo Leve */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-press text-[9px] text-red-500 uppercase tracking-widest">
            Protocolo de Reparo Ativo
          </span>
        </div>

        <PixelCard className="bg-slate-900/95 border-red-600/40 backdrop-blur-md shadow-2xl">
          <div className="p-2">
            
            {/* Header Visual */}
            <div className="text-center mb-8">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-red-600/10 blur-xl rounded-full" />
                <div className="relative w-full h-full bg-slate-800 border-2 border-red-600 rounded flex items-center justify-center">
                  <Construction className="text-red-500 w-10 h-10" />
                </div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 border border-orange-500 rounded-full flex items-center justify-center"
                >
                  <Wrench size={12} className="text-orange-500" />
                </motion.div>
              </div>

              <h1 className="font-vt323 text-4xl text-white uppercase mb-1">
                SISTEMA EM <span className="text-red-500">MANUTENÇÃO</span>
              </h1>
              <p className="font-mono text-[10px] text-slate-500 uppercase">
                {config?.siteName || 'ESTAÇÃO DE CONTROLE'} • v2.0
              </p>
            </div>

            {/* Content Boxes */}
            <div className="space-y-3 mb-8">
              <div className="bg-red-500/5 border border-red-500/10 rounded p-4 flex gap-4 items-center">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="font-mono text-[11px] text-slate-400 leading-tight">
                  Estamos aplicando melhorias na infraestrutura. A ETE Gamificada voltará ao ar em breve!
                </p>
              </div>
            </div>

            {/* 🔥 BOTÃO MANUAL SUGERIDO POR VOCÊ 🔥 */}
            <PixelButton 
              onClick={() => window.location.href = '/'}
              className="w-full h-14 bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="font-vt323 text-xl uppercase tracking-wider">
                  VOLTAR PARA A HOME
                </span>
                <ArrowRight size={18} />
              </div>
            </PixelButton>
          </div>
        </PixelCard>

        {/* Links de Rodapé e Acesso Admin */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex justify-center gap-4">
            <span className="text-slate-800">|</span>
            {/* O SEGREDO DO ADMIN CONTINUA AQUI */}
            <a href="/login" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
              <LogIn size={10} />
              <span className="font-mono text-[8px] uppercase font-bold text-orange-400">Acesso Administrativo</span>
            </a>
          </div>
          
          <p className="font-mono text-[9px] text-slate-700 text-center max-w-xs">
            Se o sistema já estiver liberado, o botão acima permitirá sua entrada.
          </p>
        </div>

      </div>
    </PageTransition>
  );
}
