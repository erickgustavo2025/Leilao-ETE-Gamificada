import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { PageTransition } from '../../components/layout/PageTransition';
import { useGameSound } from '../../hooks/useGameSound';

interface NotasData {
  notas: {
    n1: number[];
    n2: number[];
    redacoes: number[];
    simulados: number[];
    ultimaAtualizacao: string | null;
    ultimaVenda: string | null;
  };
  potencialVenda: number;
}

export function MercadoNotas() {
  const queryClient = useQueryClient();
  const { playSuccess, playError, playClick } = useGameSound();

  const { data, isLoading, error } = useQuery<NotasData>({
    queryKey: ['my-notas'],
    queryFn: async () => {
      const res = await api.get('/notas/me');
      return res.data;
    }
  });

  const venderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/notas/vender');
      return res.data;
    },
    onSuccess: (data) => {
      playSuccess();
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['my-notas'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] }); // Atualiza saldo global
    },
    onError: (err: any) => {
      playError();
      toast.error(err.response?.data?.error || "Erro ao vender notas.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <AlertCircle className="mx-auto mb-4" />
        <p>Erro ao carregar mercado de notas.</p>
      </div>
    );
  }

  const { notas, potencialVenda } = data!;
  const jaVendeu = notas.ultimaVenda && notas.ultimaAtualizacao && 
                   new Date(notas.ultimaVenda) >= new Date(notas.ultimaAtualizacao);
  const semNotas = !notas.ultimaAtualizacao;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-press text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            MERCADO DE NOTAS
          </h1>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
            Converta seu desempenho acadêmico em PC$
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card de Potencial */}
          <PixelCard className="md:col-span-2 p-6 space-y-6 bg-slate-900/50 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calculator className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-press text-xs text-white">POTENCIAL DE VENDA</h3>
                  <p className="text-[10px] text-slate-500 uppercase">Valor das notas atuais</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-press text-blue-400">
                  {potencialVenda} <span className="text-sm">PC$</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-800">
              <div className="text-center space-y-1">
                <p className="text-[9px] text-slate-500 font-press">MÉDIA N1</p>
                <p className="text-lg font-mono text-white">
                  {notas.n1.length > 0 ? (notas.n1.reduce((a,b)=>a+b,0)/notas.n1.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[9px] text-slate-500 font-press">MÉDIA N2</p>
                <p className="text-lg font-mono text-white">
                  {notas.n2.length > 0 ? (notas.n2.reduce((a,b)=>a+b,0)/notas.n2.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[9px] text-slate-500 font-press">REDAÇÃO</p>
                <p className="text-lg font-mono text-white">
                  {notas.redacoes.length > 0 ? Math.max(...notas.redacoes) : '0'}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[9px] text-slate-500 font-press">SIMULADO</p>
                <p className="text-lg font-mono text-white">
                  {notas.simulados.length > 0 ? Math.max(...notas.simulados) : '0'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <PixelButton
                variant="primary"
                className="w-full sm:w-auto"
                disabled={jaVendeu || semNotas || potencialVenda <= 0 || venderMutation.isPending}
                onClick={() => {
                  playClick();
                  if(confirm("Deseja vender suas notas atuais? Esta operação não pode ser desfeita até o próximo lançamento.")) {
                    venderMutation.mutate();
                  }
                }}
              >
                {venderMutation.isPending ? 'PROCESSANDO...' : jaVendeu ? 'NOTAS JÁ VENDIDAS' : 'VENDER NOTAS AGORA'}
              </PixelButton>
              
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                <Clock size={12} />
                <span>Último lançamento: {notas.ultimaAtualizacao ? new Date(notas.ultimaAtualizacao).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </PixelCard>

          {/* Card de Info/Regras */}
          <div className="space-y-4">
            <PixelCard className="p-4 bg-slate-900/80 border-purple-500/30">
              <h4 className="font-press text-[10px] text-purple-400 mb-4 flex items-center gap-2">
                <TrendingUp size={14} /> TABELA DE VALORES
              </h4>
              <ul className="space-y-3 font-mono text-[11px] text-slate-300">
                <li className="flex justify-between border-b border-slate-800 pb-1">
                  <span>PONTO N1/N2</span>
                  <span className="text-white">10 PC$</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-1">
                  <span>PONTO REDAÇÃO</span>
                  <span className="text-white">0.1 PC$</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-1">
                  <span>PONTO SIMULADO</span>
                  <span className="text-white">0.05 PC$</span>
                </li>
              </ul>
            </PixelCard>

            <PixelCard className="p-4 bg-slate-900/80 border-amber-500/30">
              <h4 className="font-press text-[10px] text-amber-400 mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> COMO FUNCIONA?
              </h4>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Suas notas são ativos valiosos! Quando o professor lança novas notas, seu potencial de venda é atualizado. 
                Você pode vender cada "lote" de notas apenas uma vez. 
                Vender notas NÃO as remove do seu histórico escolar, apenas converte seu mérito em saldo para usar no sistema.
              </p>
            </PixelCard>
          </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <h3 className="font-press text-xs text-slate-400 uppercase ml-1">Status de Mercado</h3>
             <PixelCard className={`p-4 border-l-4 ${jaVendeu ? 'border-l-green-500' : 'border-l-blue-500'} bg-slate-900/40`}>
                <div className="flex items-center gap-4">
                  {jaVendeu ? <CheckCircle2 className="text-green-500" /> : <Clock className="text-blue-500" />}
                  <div>
                    <p className="text-xs font-press text-white uppercase">
                      {jaVendeu ? 'Lote Liquidado' : semNotas ? 'Aguardando Lançamento' : 'Disponível para Venda'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {jaVendeu 
                        ? `Venda realizada em ${new Date(notas.ultimaVenda!).toLocaleString()}` 
                        : semNotas 
                        ? 'Nenhuma nota foi registrada pelo professor ainda.'
                        : 'Você pode converter suas notas em saldo agora.'}
                    </p>
                  </div>
                </div>
             </PixelCard>
          </div>

          <div className="space-y-4">
             <h3 className="font-press text-xs text-slate-400 uppercase ml-1">Histórico de Ativos</h3>
             <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-800">
                <div className="flex items-center justify-center h-20 text-slate-600 font-mono text-[10px] uppercase italic">
                  Nenhuma transação anterior registrada
                </div>
             </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
