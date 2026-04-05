import React, { useState } from 'react';
import { X, Rocket, Loader2, Info, Building2, Tag, DollarSign, PieChart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../api/axios-config';
// import { cn } from '../../../../utils/cn';
import { toast } from 'sonner';

interface CreateStartupModalProps {
  onClose: () => void;
}

export const CreateStartupModal: React.FC<CreateStartupModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tag: '',
    descricao: '',
    valuationInicial: 1000,
    totalAcoes: 10000
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/startups/create', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Startup enviada para incubação!');
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      onClose();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.response?.data?.issues?.[0]?.message || 'Erro ao criar startup.';
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Rocket size={12} />
              <span>Incubadora Gil Investe</span>
            </div>
            <h2 className="text-3xl font-vt323 text-white uppercase tracking-tighter">
              Lançar <span className="text-blue-500">Novo IPO</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <Building2 size={10} /> Nome da Empresa
              </label>
              <input 
                required
                type="text" 
                placeholder="Ex: CyberTech"
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-white font-vt323 text-xl focus:border-blue-500 outline-none transition-all"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <Tag size={10} /> Ticker (Tag)
              </label>
              <input 
                required
                type="text" 
                placeholder="Ex: CYBR"
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-white font-vt323 text-xl focus:border-blue-500 outline-none transition-all uppercase"
                value={formData.tag}
                onChange={e => setFormData({...formData, tag: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Descrição do Projeto</label>
            <textarea 
              required
              rows={3}
              placeholder="Descreva o propósito da sua startup..."
              className="w-full bg-slate-950 border border-slate-800 p-2.5 text-white font-sans text-sm focus:border-blue-500 outline-none transition-all resize-none"
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <DollarSign size={10} /> Valuation Inicial (PC$)
              </label>
              <input 
                required
                type="number" 
                min={1}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-white font-vt323 text-xl focus:border-blue-500 outline-none transition-all"
                value={formData.valuationInicial}
                onChange={e => setFormData({...formData, valuationInicial: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1">
                <PieChart size={10} /> Total de Ações
              </label>
              <input 
                required
                type="number" 
                min={1}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 text-white font-vt323 text-xl focus:border-blue-500 outline-none transition-all"
                value={formData.totalAcoes}
                onChange={e => setFormData({...formData, totalAcoes: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 p-3 flex gap-3 items-start">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-300/70 leading-relaxed uppercase font-bold">
              Ao lançar um IPO, o preço inicial da sua ação será de <span className="text-white">PC$ {(formData.valuationInicial / (formData.totalAcoes || 1)).toFixed(2)}</span>. 
              Sua empresa passará por análise da staff antes de ser listada.
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-4 bg-blue-600 text-white font-vt323 text-2xl uppercase tracking-[0.2em] hover:bg-blue-500 transition-all disabled:opacity-50 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
          >
            {mutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Enviando Proposta...</span>
              </div>
            ) : (
              <span>Confirmar Lançamento</span>
            )}
          </button>
        </form>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};
