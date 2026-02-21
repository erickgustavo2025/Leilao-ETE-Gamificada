import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { Bug, Lightbulb, AlertTriangle, ThumbsUp, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

interface Feedback {
  _id: string;
  tipo: 'sugestao' | 'bug' | 'critica' | 'elogio';
  mensagem: string;
  nome: string;
  turma: string;
  status: 'pendente' | 'resolvido';
  createdAt: string;
}

export function FeedbackList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'resolvido'>('pendente');

  // ==================== QUERIES ====================
  
  const { data: feedbacks = [], isLoading, refetch } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const { data } = await api.get('/feedback');
      return data as Feedback[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // ==================== MUTATIONS ====================
  
  const markResolvedMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/feedback/${id}/resolve`);
    },
    // Optimistic Update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['feedbacks'] });
      const previousFeedbacks = queryClient.getQueryData<Feedback[]>(['feedbacks']);
      
      queryClient.setQueryData<Feedback[]>(['feedbacks'], (old = []) => 
        old.map(item => item._id === id ? { ...item, status: 'resolvido' as const } : item)
      );
      
      return { previousFeedbacks };
    },
    onSuccess: () => {
      toast.success('Resolvido! ✅');
    },
    onError: (_, __, context) => {
      if (context?.previousFeedbacks) {
        queryClient.setQueryData(['feedbacks'], context.previousFeedbacks);
      }
      toast.error('Erro ao atualizar');
    }
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/feedback/${id}`);
    },
    // Optimistic Update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['feedbacks'] });
      const previousFeedbacks = queryClient.getQueryData<Feedback[]>(['feedbacks']);
      
      queryClient.setQueryData<Feedback[]>(['feedbacks'], (old = []) => 
        old.filter(item => item._id !== id)
      );
      
      return { previousFeedbacks };
    },
    onSuccess: () => {
      toast.success('Mensagem apagada. 🗑️');
    },
    onError: (_, __, context) => {
      if (context?.previousFeedbacks) {
        queryClient.setQueryData(['feedbacks'], context.previousFeedbacks);
      }
      toast.error('Erro ao apagar');
    }
  });

  // ==================== HANDLERS ====================

  const handleMarkResolved = (id: string) => {
    markResolvedMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que quer apagar essa mensagem?')) return;
    deleteFeedbackMutation.mutate(id);
  };

  // ==================== HELPERS ====================
  
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'bug': return <Bug size={18} className="text-red-500" />;
      case 'sugestao': return <Lightbulb size={18} className="text-yellow-500" />;
      case 'critica': return <AlertTriangle size={18} className="text-orange-500" />;
      default: return <ThumbsUp size={18} className="text-green-500" />;
    }
  };

  // ==================== DERIVAÇÕES ====================
  
  const filteredFeedbacks = feedbacks.filter(f => 
    filter === 'todos' ? true : f.status === filter
  );

  return (
    <div className="p-6 md:p-10 space-y-8 bg-black/90 min-h-full text-green-500 font-mono">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-green-900 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-vt323 text-green-400">INBOX_FEEDBACKS</h1>
          <p className="text-xs text-green-700">MENSAGENS DOS USUÁRIOS</p>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2">
            {(['pendente', 'resolvido', 'todos'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                        "px-3 py-1 text-xs border uppercase transition-all",
                        filter === f 
                            ? "bg-green-500 text-black border-green-500 font-bold" 
                            : "bg-black text-green-700 border-green-900 hover:border-green-500"
                    )}
                >
                    {f}
                </button>
            ))}
            <button onClick={() => refetch()} className="text-xs border border-green-700 px-3 py-1 hover:bg-green-900/30 ml-2">↻</button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
            <p className="animate-pulse">SCANNING_DATABASE...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20 text-green-800">
              <p>NENHUMA MENSAGEM ENCONTRADA COM ESTE FILTRO.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeedbacks.map((item) => (
            <div key={item._id} className={cn(
                "bg-black border p-4 relative group transition-all flex flex-col justify-between",
                item.status === 'resolvido' ? "border-green-900/30 opacity-60" : "border-green-900 hover:border-green-500"
            )}>
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                    {getIcon(item.tipo)}
                    <span className="text-xs font-bold uppercase tracking-widest text-green-300">{item.tipo}</span>
                    </div>
                    {item.status === 'resolvido' && <span className="text-[10px] bg-green-900/50 text-green-400 px-2 rounded">RESOLVIDO</span>}
                </div>
                
                <p className="text-sm text-green-100 font-mono mb-4 h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                    "{item.mensagem}"
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-green-900/50 flex justify-between items-end">
                <div className="text-xs text-green-700">
                  <p className="font-bold text-green-600">{item.nome}</p>
                  <p className="text-[10px]">{item.turma} • {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="flex gap-2">
                  {item.status === 'pendente' && (
                      <button onClick={() => handleMarkResolved(item._id)} title="Marcar Resolvido" className="p-2 hover:bg-green-500 text-green-500 hover:text-black border border-green-900 hover:border-green-500 rounded transition-all">
                        <CheckCircle size={16} />
                      </button>
                  )}
                  <button onClick={() => handleDelete(item._id)} title="Deletar" className="p-2 hover:bg-red-500 text-red-500 hover:text-white border border-red-900/30 hover:border-red-500 rounded transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}