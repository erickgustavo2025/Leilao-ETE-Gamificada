import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import {
  CheckCircle,
  XCircle,
  Loader2,

  User,
  Calendar,
  TrendingUp,
  Settings,
  Star,
  DollarSign,
  Save,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';

const AdminStartupApprovals: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pendentes' | 'listadas'>('pendentes');
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

  // Estados para o Modal Shark Tank (Aprovação)
  const [newValuation, setNewValuation] = useState<number>(0);
  const [performanceInicial, setPerformanceInicial] = useState<number>(100);

  // Estados para o Modal de Performance (Gestão Contínua)
  const [novaNota, setNovaNota] = useState<number>(100);
  const [motivo, setMotivo] = useState<string>('');

  // 1. Queries
  const { data: startupsPendentes, isLoading: loadingPendentes } = useQuery({
    queryKey: ['admin', 'startups', 'pending'],
    queryFn: async () => {
      const response = await api.get('/startups', { params: { status: 'INCUBACAO' } });
      return response.data;
    }
  });

  const { data: startupsListadas, isLoading: loadingListadas } = useQuery({
    queryKey: ['admin', 'startups', 'listadas'],
    queryFn: async () => {
      const response = await api.get('/startups', { params: { status: 'LISTADA' } });
      return response.data;
    }
  });

  // 2. Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, newValuation, performanceInicial }: any) => {
      const response = await api.put(`/startups/${id}/approve`, { newValuation, performanceInicial });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Startup listada com sucesso! Shark Tank finalizado.');
      setIsApproveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'startups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao aprovar startup.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/startups/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('IPO Rejeitado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'startups', 'pending'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao rejeitar startup.');
    }
  });

  const performanceMutation = useMutation({
    mutationFn: async ({ id, novaNota, motivo }: any) => {
      const response = await api.put(`/startups/${id}/performance`, { novaNota, motivo });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Performance acadêmica atualizada!');
      setIsPerformanceModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'startups', 'listadas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar nota.');
    }
  });

  // 3. Handlers
  const openApproveModal = (startup: any) => {
    setSelectedStartup(startup);
    setNewValuation(startup.valuationInicial);
    setPerformanceInicial(100);
    setIsApproveModalOpen(true);
  };

  const openPerformanceModal = (startup: any) => {
    setSelectedStartup(startup);
    setNovaNota(startup.performanceAcademica);
    setMotivo('');
    setIsPerformanceModalOpen(true);
  };

  const currentPricePreview = newValuation && selectedStartup ? newValuation / selectedStartup.totalAcoes : 0;

  return (
    <AdminLayout>
      <div className="pt-24 space-y-6 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20">
              <TrendingUp className="text-white" size={32} />
            </div>
            <div>
              <h1 className="font-press text-2xl text-white tracking-tighter">GESTÃO DE STARTUPS</h1>
              <p className="font-vt323 text-slate-400 text-xl">Shark Tank & Auditoria Acadêmica</p>
            </div>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`px-6 py-2 rounded-lg font-press text-[10px] transition-all ${activeTab === 'pendentes' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              PENDENTES ({startupsPendentes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('listadas')}
              className={`px-6 py-2 rounded-lg font-press text-[10px] transition-all ${activeTab === 'listadas' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              LISTADAS ({startupsListadas?.length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'pendentes' ? (
          <div className="grid gap-6">
            {loadingPendentes ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
            ) : startupsPendentes?.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="font-vt323 text-2xl text-slate-500 uppercase tracking-widest">Nenhuma proposta na incubadora</p>
              </div>
            ) : (
              startupsPendentes.map((startup: any) => (
                <div key={startup._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-3xl border border-blue-500/20">
                          {startup.tag}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{startup.nome}</h3>
                          <div className="flex items-center gap-4 text-slate-500 font-vt323 text-xl">
                            <span className="flex items-center gap-2"><User size={18} className="text-blue-500" /> {startup.fundador?.nome}</span>
                            <span className="flex items-center gap-2"><Calendar size={18} /> {new Date(startup.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Tese de Negócio</p>
                        <p className="text-slate-300 text-lg leading-relaxed font-vt323">{startup.descricao}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Valuation Proposto</p>
                          <p className="text-2xl font-bold text-emerald-400 font-vt323">{formatCurrency(startup.valuationInicial)}</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ações Totais</p>
                          <p className="text-2xl font-bold text-white font-vt323">{startup.totalAcoes.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Preço Alvo</p>
                          <p className="text-2xl font-bold text-blue-400 font-vt323">{formatCurrency(startup.valorPorAcao)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-4 justify-center shrink-0">
                      <button
                        onClick={() => openApproveModal(startup)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-press text-[11px] transition-all shadow-lg shadow-emerald-900/20"
                      >
                        <CheckCircle size={18} /> APROVAR IPO
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja REJEITAR este IPO?')) {
                            rejectMutation.mutate(startup._id);
                          }
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-2xl font-press text-[11px] transition-all border border-slate-700 hover:border-rose-500"
                      >
                        <XCircle size={18} /> REJEITAR
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {loadingListadas ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
            ) : startupsListadas?.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="font-vt323 text-2xl text-slate-500 uppercase tracking-widest">Nenhuma empresa listada na bolsa</p>
              </div>
            ) : (
              startupsListadas.map((startup: any) => (
                <div key={startup._id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-2xl border border-emerald-500/20">
                      {startup.tag}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{startup.nome}</h3>
                      <div className="flex items-center gap-4 text-slate-500 font-vt323 text-lg">
                        <span className="flex items-center gap-2 text-emerald-500"><Star size={16} /> Performance: {startup.performanceAcademica}/100</span>
                        <span className="flex items-center gap-2"><DollarSign size={16} /> Preço: {formatCurrency(startup.valorPorAcao)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openPerformanceModal(startup)}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl font-press text-[10px] transition-all border border-slate-700"
                  >
                    <Settings size={16} /> NOVA AVALIAÇÃO
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODAL SHARK TANK (APROVAÇÃO) */}
        <AnimatePresence>
          {isApproveModalOpen && selectedStartup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsApproveModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-slate-900 border-2 border-emerald-500/50 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-[210]">
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                    <div>
                      <h2 className="text-2xl font-press text-white flex items-center gap-3">SHARK TANK <span className="text-emerald-500 text-sm">APROVAÇÃO</span></h2>
                      <p className="font-vt323 text-slate-400 text-xl">Auditando {selectedStartup.nome}</p>
                    </div>
                    <button onClick={() => setIsApproveModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><X className="text-slate-500" /></button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-press text-slate-500 mb-3 uppercase tracking-widest">Ajustar Valuation (PC$)</label>
                        <input
                          type="number"
                          value={newValuation}
                          onChange={(e) => setNewValuation(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-400 font-vt323 text-3xl focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-press text-slate-500 mb-3 uppercase tracking-widest">Performance Inicial (0-100)</label>
                        <input
                          type="range"
                          min="0" max="100"
                          value={performanceInicial}
                          onChange={(e) => setPerformanceInicial(Number(e.target.value))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between mt-2 font-vt323 text-xl text-slate-400">
                          <span>0%</span>
                          <span className="text-emerald-500 font-bold">{performanceInicial}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                      <h4 className="font-press text-[10px] text-slate-500 mb-4">PREVISÃO DE MERCADO</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-vt323 text-lg">Ações Totais</span>
                        <span className="text-white font-vt323 text-xl">{selectedStartup.totalAcoes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                        <span className="text-slate-500 font-vt323 text-lg">Preço por Ação</span>
                        <span className="text-blue-400 font-vt323 text-3xl font-bold">{formatCurrency(currentPricePreview)}</span>
                      </div>
                      <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 mt-6">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Impacto de Dividendos</p>
                        <p className="text-slate-400 text-xs leading-tight">Com performance de {performanceInicial}%, esta empresa pagará dividendos saudáveis no próximo ciclo.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => approveMutation.mutate({ id: selectedStartup._id, newValuation, performanceInicial })}
                    disabled={approveMutation.isPending}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-press text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30"
                  >
                    {approveMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    LISTAR EMPRESA NA BOLSA
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL PERFORMANCE (GESTÃO CONTÍNUA) */}
        <AnimatePresence>
          {isPerformanceModalOpen && selectedStartup && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPerformanceModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border-2 border-blue-500/50 w-full max-w-lg rounded-3xl overflow-hidden relative z-[210]">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-press text-white">NOVA AVALIAÇÃO</h2>
                    <button onClick={() => setIsPerformanceModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-press text-slate-500 mb-4 uppercase">Nota de Performance (0-100)</label>
                      <div className="flex items-center gap-6">
                        <input
                          type="range" min="0" max="100"
                          value={novaNota}
                          onChange={(e) => setNovaNota(Number(e.target.value))}
                          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-3xl font-vt323 text-blue-400 w-16 text-right">{novaNota}%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-press text-slate-500 mb-3 uppercase">Motivo / Feedback</label>
                      <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ex: Entrega do MVP concluída com excelência..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-vt323 text-xl focus:border-blue-500 outline-none min-h-[120px]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => performanceMutation.mutate({ id: selectedStartup._id, novaNota, motivo })}
                    disabled={performanceMutation.isPending}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-press text-[10px] transition-all flex items-center justify-center gap-3"
                  >
                    {performanceMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    SALVAR AVALIAÇÃO
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminStartupApprovals;
export { AdminStartupApprovals };
