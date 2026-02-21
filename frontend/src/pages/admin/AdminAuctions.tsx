// frontend/src/pages/admin/AdminAuctions.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, Trash2, Image as ImageIcon, Loader2, Gavel, DollarSign, 
  XCircle, Users, Trophy, Home, User as UserIcon, CalendarClock, 
  Search, ExternalLink, X 
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';

// ========================
// CONSTANTES
// ========================
const RANKS = [
  "BRONZE", "PRATA", "OURO", "DIAMANTE", "ÉPICO", "ÉPICO LENDÁRIO", 
  "ÉPICO SUPREMO", "ÉPICO MITHOLÓGICO", "ÉPICO SOBERANO"
];

// ========================
// TIPAGENS
// ========================
interface AuctionItem {
  _id: string;
  titulo: string;
  descricao: string;
  lanceMinimo: number;
  dataFim: string;
  validadeDias?: number;
  imagemUrl: string;
  seriesPermitidas: string[];
  rankMinimo: string;
  isHouseItem: boolean;
  status: string;
  maiorLance?: {
    valor: number;
    user: { nome: string };
  };
}

interface StoreItem {
  _id: string;
  nome: string;
  descricao: string;
  imagem: string;
  validadeDias?: number;
  isHouseItem: boolean;
}

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function AdminAuctions() {
  const { playSuccess, playError, playClick } = useGameSound();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================
  // ESTADOS
  // ========================
  const [editingId, setEditingId] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalItemId, setOriginalItemId] = useState<string>('');
  const [showStoreSearch, setShowStoreSearch] = useState(false);
  const [storeSearchTerm, setStoreSearchTerm] = useState('');

  // ========================
  // QUERIES
  // ========================

  // ✅ GET Auctions
  const { data: items = [], isLoading } = useQuery<AuctionItem[]>({
    queryKey: queryKeys.admin.auctions,
    queryFn: async () => {
      const res = await api.get('/auction');
      return res.data;
    }
  });

  // ✅ GET Store Items (para busca inteligente)
  const { data: storeItems = [] } = useQuery<StoreItem[]>({
    queryKey: queryKeys.admin.store.all,
    queryFn: async () => {
      const res = await api.get('/store/all');
      return res.data;
    }
  });

  // Filtrar items da store pela busca
  const filteredStoreItems = storeItems.filter(item =>
    item.nome.toLowerCase().includes(storeSearchTerm.toLowerCase())
  );

  // ========================
  // MUTATIONS
  // ========================

  // ✅ CREATE Mutation
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await api.post('/auction', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      playSuccess();
      toast.success("Leilão Criado!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.auctions });
      handleReset();
    },
    onError: (err: any) => {
      playError();
      toast.error(err.response?.data?.message || "Erro ao criar.");
    }
  });

  // ✅ UPDATE Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      await api.put(`/auction/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      playSuccess();
      toast.success("Leilão Atualizado!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.auctions });
      handleReset();
    },
    onError: (err: any) => {
      playError();
      toast.error(err.response?.data?.message || "Erro ao atualizar.");
    }
  });

  // ✅ DELETE Mutation (Optimistic)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auction/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.auctions });
      const previous = queryClient.getQueryData<AuctionItem[]>(queryKeys.admin.auctions);

      queryClient.setQueryData<AuctionItem[]>(
        queryKeys.admin.auctions,
        (old) => old?.filter(item => item._id !== id) || []
      );

      return { previous };
    },
    onError: (_err: any, _id: string, context: any) => {
      queryClient.setQueryData(queryKeys.admin.auctions, context?.previous);
      playError();
      toast.error("Erro ao deletar.");
    },
    onSuccess: () => {
      playSuccess();
      toast.success("Leilão Removido.");
    }
  });

  // ✅ CLOSE EARLY Mutation
  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/auction/${id}/close`);
    },
    onSuccess: () => {
      playSuccess();
      toast.success("Leilão encerrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.auctions });
    },
    onError: () => {
      playError();
      toast.error("Erro ao encerrar.");
    }
  });

  // ========================
  // HANDLERS
  // ========================

  // 🖼️ Preview de Imagem
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limpa preview anterior
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      
      // Cria novo preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Limpa originalItemId (nova imagem = não usar store)
      setOriginalItemId('');
    }
  }, [previewUrl]);

  // 🔍 Selecionar Item da Store
  const handleStoreItemSelect = useCallback((item: StoreItem) => {
    const form = document.getElementById('auction-form') as HTMLFormElement;
    if (!form) return;

    // Auto-preencher campos
    (form.elements.namedItem('titulo') as HTMLInputElement).value = item.nome;
    (form.elements.namedItem('descricao') as HTMLTextAreaElement).value = item.descricao || '';
    (form.elements.namedItem('validadeDias') as HTMLInputElement).value = item.validadeDias?.toString() || '0';
    (form.elements.namedItem('isHouseItem') as HTMLInputElement).checked = item.isHouseItem;

    // Salvar ID do item original
    setOriginalItemId(item._id);
    
    // Mostrar preview da imagem da store
    setPreviewUrl(getImageUrl(item.imagem));

    // Fechar modal
    setShowStoreSearch(false);
    setStoreSearchTerm('');
    
    playClick();
    toast.success(`Item "${item.nome}" carregado da loja!`);
  }, [playClick]);

  // 📝 Submit Handler (CORRIGIDO COM SÉRIES JSON)
  const handleCreate = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData();

    // ✅ Campos básicos
    const titulo = (form.elements.namedItem('titulo') as HTMLInputElement).value;
    const descricao = (form.elements.namedItem('descricao') as HTMLTextAreaElement).value;
    const lanceMinimo = (form.elements.namedItem('lanceMinimo') as HTMLInputElement).value;
    const dataFim = (form.elements.namedItem('dataFim') as HTMLInputElement).value;
    const validadeDias = (form.elements.namedItem('validadeDias') as HTMLInputElement).value;
    const rankMinimo = (form.elements.namedItem('rankMinimo') as HTMLSelectElement).value;
    const isHouseItem = (form.elements.namedItem('isHouseItem') as HTMLInputElement).checked;

    // Validação
    if (!titulo || !lanceMinimo || !dataFim) {
      return toast.warning("Preencha os campos obrigatórios!");
    }

    // ✅ Coletar séries selecionadas (CHECKBOXES → JSON STRING)
    const seriesPermitidas: string[] = [];
    ['1', '2', '3'].forEach(ano => {
      const checkbox = form.elements.namedItem(`serie_${ano}`) as HTMLInputElement;
      if (checkbox?.checked) {
        seriesPermitidas.push(ano);
      }
    });

    // ✅ Adicionar campos ao FormData
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('lanceMinimo', lanceMinimo);
    formData.append('dataFim', dataFim);
    formData.append('validadeDias', validadeDias);
    formData.append('rankMinimo', rankMinimo);
    
    // ✅ isHouseItem como STRING (backend aceita "true"/"false")
    formData.append('isHouseItem', isHouseItem.toString());
    
    // ✅ seriesPermitidas como JSON STRING
    formData.append('seriesPermitidas', JSON.stringify(seriesPermitidas));

    // ✅ Imagem ou originalItemId
    const fileInput = form.elements.namedItem('image') as HTMLInputElement;
    const hasFile = fileInput?.files && fileInput.files.length > 0;

    if (hasFile) {
      // Upload de nova imagem
      formData.append('image', fileInput.files![0]);
    } else if (originalItemId) {
      // Usar imagem da store
      formData.append('originalItemId', originalItemId);
    } else if (!editingId) {
      // Criação sem imagem = erro
      return toast.warning("Selecione uma imagem ou item da loja!");
    }

    // ✅ Criar ou Atualizar
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData });
    } else {
      createMutation.mutate(formData);
    }
  }, [editingId, originalItemId, createMutation, updateMutation]);

  // 🗑️ Delete Handler
  const handleDelete = useCallback((id: string) => {
    if (!confirm("Remover este leilão permanentemente?")) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // ⏸️ Close Early Handler (FORA DO RENDER)
  const handleCloseEarly = useCallback((id: string) => {
    if (!confirm("Encerrar agora e entregar o item ao maior lance atual?")) return;
    closeMutation.mutate(id);
  }, [closeMutation]);

  // ✏️ Edit Handler
  const handleEdit = useCallback((item: AuctionItem) => {
    const form = document.getElementById('auction-form') as HTMLFormElement;
    if (!form) return;

    // Definir ID de edição
    setEditingId(item._id);

    // Preencher campos
    (form.elements.namedItem('titulo') as HTMLInputElement).value = item.titulo;
    (form.elements.namedItem('descricao') as HTMLTextAreaElement).value = item.descricao;
    (form.elements.namedItem('lanceMinimo') as HTMLInputElement).value = item.lanceMinimo.toString();
    (form.elements.namedItem('validadeDias') as HTMLInputElement).value = item.validadeDias?.toString() || '0';
    (form.elements.namedItem('isHouseItem') as HTMLInputElement).checked = item.isHouseItem;
    (form.elements.namedItem('rankMinimo') as HTMLSelectElement).value = item.rankMinimo || '';

    // Data de fim (ajuste timezone)
    const d = new Date(item.dataFim);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    (form.elements.namedItem('dataFim') as HTMLInputElement).value = d.toISOString().slice(0, 16);

    // Séries (checkboxes)
    ['1', '2', '3'].forEach(ano => {
      const checkbox = form.elements.namedItem(`serie_${ano}`) as HTMLInputElement;
      if (checkbox) checkbox.checked = item.seriesPermitidas.includes(ano);
    });

    // Preview da imagem existente
    setPreviewUrl(getImageUrl(item.imagemUrl));
    setOriginalItemId(''); // Limpar link com store

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 🔄 Reset Handler
  const handleReset = useCallback(() => {
    const form = document.getElementById('auction-form') as HTMLFormElement;
    if (form) form.reset();
    
    setEditingId('');
    setOriginalItemId('');
    
    // Limpar preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  // ========================
  // CLEANUP
  // ========================
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ========================
  // RENDER
  // ========================
  return (
    <AdminLayout>
      <PageTransition>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-vt323 text-4xl text-yellow-500 uppercase tracking-tighter">CASA DE LEILÕES</h1>
            <p className="font-vt323 text-lg text-slate-500">Crie itens e gerencie lances em tempo real.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ======================== */}
          {/* FORMULÁRIO */}
          {/* ======================== */}
          <PixelCard className="bg-slate-900 border-yellow-600 h-fit sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-press text-sm text-yellow-500 flex items-center gap-2 uppercase">
                <Gavel size={16} /> {editingId ? 'Editar Item' : 'Novo Item'}
              </h2>
              {editingId && (
                <button
                  onClick={handleReset}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  title="Cancelar Edição"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <form id="auction-form" onSubmit={handleCreate} className="space-y-4">
              {/* Preview de Imagem */}
              <motion.label
                whileHover={{ scale: 1.01 }}
                className="relative cursor-pointer group w-full h-32 bg-black border-2 border-dashed border-slate-700 rounded flex items-center justify-center overflow-hidden hover:border-yellow-500 transition-colors"
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <ImageIcon className="mx-auto mb-1" />
                    <span className="text-[10px] font-press uppercase">FOTO DO ITEM</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="image"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </motion.label>

              {/* Botão Buscar na Loja */}
              <PixelButton
                type="button"
                onClick={() => setShowStoreSearch(true)}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center gap-2 h-10"
              >
                <Search size={14} />
                <span className="text-xs">BUSCAR NA LOJA</span>
              </PixelButton>

              {/* Título */}
              <div>
                <label className="text-[10px] font-press text-slate-400">TÍTULO</label>
                <input
                  name="titulo"
                  className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-xl focus:border-yellow-500 outline-none uppercase"
                  placeholder="EX: CAIXA DE BOMBOM"
                />
              </div>

              {/* Item de Sala */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-slate-600" />
                  <div>
                    <p className="font-press text-[10px] text-slate-500">ITEM DE SALA</p>
                    <p className="text-[8px] text-slate-600 font-mono leading-none">Vai para a Turma do Vencedor</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="isHouseItem"
                  className="w-10 h-5 rounded-full accent-purple-600"
                />
              </div>

              {/* Lance Inicial + Encerramento */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-press text-slate-400">LANCE INICIAL</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-2 top-3 text-green-500" />
                    <input
                      type="number"
                      name="lanceMinimo"
                      className="w-full bg-black border border-slate-700 p-2 pl-7 text-green-400 font-vt323 text-xl focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-press text-slate-400">ENCERRAMENTO</label>
                  <input
                    type="datetime-local"
                    name="dataFim"
                    className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-xs focus:border-yellow-500 outline-none"
                  />
                </div>
              </div>

              {/* Validade */}
              <div>
                <label className="text-[10px] font-press text-slate-400">VALIDADE DO ITEM (DIAS)</label>
                <div className="relative">
                  <CalendarClock size={14} className="absolute left-2 top-3 text-blue-500" />
                  <input
                    type="number"
                    name="validadeDias"
                    defaultValue={0}
                    className="w-full bg-black border border-slate-700 p-2 pl-7 text-white font-vt323 text-xl focus:border-blue-500 outline-none"
                    placeholder="0 = Infinito"
                  />
                </div>
              </div>

              {/* Séries + Rank */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                <div>
                  <label className="text-[10px] font-press text-slate-400">SÉRIES</label>
                  <div className="flex gap-1 mt-1">
                    {['1', '2', '3'].map(ano => (
                      <label key={ano} className="flex-1 relative">
                        <input 
                          type="checkbox" 
                          name={`serie_${ano}`} 
                          value={ano} 
                          className="peer sr-only" 
                        />
                        <div className="py-1.5 text-[10px] font-press border text-center cursor-pointer bg-black border-slate-700 text-slate-500 hover:border-yellow-500 peer-checked:bg-yellow-600 peer-checked:text-black peer-checked:border-yellow-500 transition-all">
                          {ano}º
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-press text-slate-400">RANK MÍN.</label>
                  <select
                    name="rankMinimo"
                    className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-sm focus:border-yellow-500 outline-none h-[34px] mt-1"
                  >
                    <option value="">Qualquer Rank</option>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-press text-slate-400 uppercase">Descrição do Prêmio</label>
                <textarea
                  name="descricao"
                  className="w-full bg-black border border-slate-700 p-2 text-slate-300 font-vt323 text-lg h-16 resize-none focus:border-yellow-500 outline-none"
                  placeholder="..."
                />
              </div>

              {/* Botão Submit */}
              <PixelButton
                type="submit"
                className="w-full text-black bg-yellow-600 hover:bg-yellow-500"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : editingId ? (
                  'ATUALIZAR'
                ) : (
                  'LANÇAR'
                )}
              </PixelButton>

              {editingId && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full text-slate-500 hover:text-white font-press text-xs py-2 transition-colors"
                >
                  CANCELAR EDIÇÃO
                </button>
              )}
            </form>
          </PixelCard>

          {/* ======================== */}
          {/* LISTAGEM */}
          {/* ======================== */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              <div className="text-center py-10 text-slate-500 font-press animate-pulse">CARREGANDO LEILÕES...</div>
            ) : items.length === 0 ? (
              <div className="text-center text-slate-500 font-vt323 text-xl py-10">NENHUM LEILÃO ATIVO NO MOMENTO.</div>
            ) : (
              <AnimatePresence>
                {items.map((item, idx) => {
                  const isActive = item.status === 'ativo' && new Date(item.dataFim) > new Date();
                  return (
                    <motion.div
                      key={item._id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 10, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <PixelCard className={cn(
                        "flex flex-col md:flex-row gap-4 p-4 border-l-4 group transition-all",
                        isActive ? "border-l-green-500 bg-slate-900" : "border-l-red-500 bg-slate-900/50 opacity-80"
                      )}>
                        {/* Imagem */}
                        <div className="w-24 h-24 bg-black border border-slate-700 flex-shrink-0 relative overflow-hidden">
                          <img 
                            src={getImageUrl(item.imagemUrl)} 
                            alt={item.titulo}
                            className="w-full h-full object-contain" 
                          />
                          {!isActive && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-press text-[8px] text-red-500 uppercase tracking-widest">
                              Encerrado
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-vt323 text-3xl text-white truncate flex items-center gap-2 uppercase tracking-tighter">
                            {item.titulo}
                            {item.isHouseItem && (
                              <span className="text-[8px] bg-purple-600 px-1.5 py-0.5 rounded font-press text-white">SALA</span>
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.seriesPermitidas?.length > 0 && (
                              <span className="text-[10px] bg-slate-800 border border-slate-600 px-2 py-0.5 rounded font-press text-slate-300 flex items-center gap-1 uppercase tracking-tighter">
                                <Users size={10} /> {item.seriesPermitidas.join('º, ')}º ANO
                              </span>
                            )}
                            {item.rankMinimo && (
                              <span className="text-[10px] bg-purple-900/30 border border-purple-600 px-2 py-0.5 rounded font-press text-purple-300 flex items-center gap-1 uppercase tracking-tighter">
                                <Trophy size={10} /> {item.rankMinimo}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm font-mono text-slate-400 mt-1">
                            <span className="flex items-center gap-1 text-yellow-400">
                              <DollarSign size={14} /> LANCE: {item.maiorLance?.valor || item.lanceMinimo}
                            </span>
                            <span className="flex items-center gap-1 uppercase">
                              <UserIcon size={14} className="mr-1" /> {item.maiorLance?.user?.nome || 'Ninguém'}
                            </span>
                            {item.validadeDias && item.validadeDias > 0 && (
                              <span className="flex items-center gap-1 text-blue-400 text-[10px]">
                                <CalendarClock size={12} /> {item.validadeDias} DIAS
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-row md:flex-col gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 bg-slate-800 text-blue-400 hover:bg-blue-500/20 rounded border border-slate-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleCloseEarly(item._id)}
                              className="p-2 bg-slate-800 text-orange-400 hover:bg-orange-500/20 rounded border border-slate-600 transition-colors"
                              title="Encerrar Manualmente"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 bg-slate-800 text-red-500 hover:bg-red-500/20 rounded border border-slate-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </PixelCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ======================== */}
        {/* MODAL BUSCA NA LOJA */}
        {/* ======================== */}
        <AnimatePresence>
          {showStoreSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              onClick={() => setShowStoreSearch(false)}
            >
              <motion.div
                initial={{ y: 50, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.9 }}
                className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <h3 className="font-vt323 text-3xl text-white uppercase tracking-widest">BUSCAR NA LOJA</h3>
                  <button onClick={() => setShowStoreSearch(false)}>
                    <X className="text-slate-400 hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={storeSearchTerm}
                      onChange={(e) => setStoreSearchTerm(e.target.value)}
                      className="w-full bg-black border border-slate-700 pl-10 pr-4 py-3 text-white font-vt323 text-xl focus:border-yellow-500 outline-none"
                      placeholder="DIGITE O NOME DO ITEM..."
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                  {filteredStoreItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 font-vt323 text-xl">
                      NENHUM ITEM ENCONTRADO
                    </div>
                  ) : (
                    filteredStoreItems.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => handleStoreItemSelect(item)}
                        className="w-full flex items-center gap-4 p-3 rounded border border-slate-800 bg-black/20 hover:bg-slate-800 hover:border-yellow-500 transition-all group text-left"
                      >
                        <div className="w-16 h-16 bg-black rounded flex items-center justify-center border border-slate-700 flex-shrink-0">
                          <img 
                            src={getImageUrl(item.imagem)} 
                            alt={item.nome}
                            className="w-14 h-14 object-contain" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-vt323 text-2xl text-white group-hover:text-yellow-400 transition-colors truncate">
                            {item.nome}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono truncate">{item.descricao || 'Sem descrição'}</p>
                          <div className="flex gap-2 mt-1">
                            {item.isHouseItem && (
                              <span className="text-[8px] bg-purple-600 px-1.5 py-0.5 rounded font-press text-white">SALA</span>
                            )}
                            {item.validadeDias && item.validadeDias > 0 && (
                              <span className="text-[8px] bg-blue-900 px-1.5 py-0.5 rounded font-press text-blue-300">{item.validadeDias}D</span>
                            )}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-slate-600 group-hover:text-yellow-500 transition-colors" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </AdminLayout>
  );
}