// frontend/src/pages/admin/AdminGifts.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageTransition } from '../../components/layout/PageTransition';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import {
  Gift, Plus, Trash2, Search, Save, Package, Clock, Crown,
  CalendarClock, CheckSquare, ChevronDown, Coins, ShieldCheck,
  Sparkles, Timer, Box
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import { queryKeys } from '../../utils/queryKeys';
import { cn } from '../../utils/cn';

// --- INTERFACES ---
interface StoreItem {
  _id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem?: string;
  tipo?: string;
  estoque: number;
}

interface Classroom {
  _id: string;
  name: string;
}

interface GiftItemPayload {
  item: string;
  quantidade: number;
  validadeValor?: number;
  unidadeValidade?: string;
  tempName?: string;
  tempImage?: string;
}

// ── Section Header Component ────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, color }: {
  icon: any;
  title: string;
  subtitle?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };
  const classes = colorMap[color] || colorMap.pink;
  const textColor = classes.split(' ')[0];

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn('p-2 rounded-lg border', classes)}>
        <Icon size={18} />
      </div>
      <div>
        <h3 className={cn('font-vt323 text-xl md:text-2xl', textColor)}>{title}</h3>
        {subtitle && <p className="font-mono text-[10px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Form Field Component ────────────────────────────────────
function FormField({ label, children, className }: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-press text-slate-500 uppercase block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white outline-none transition-colors text-sm';

export function AdminGifts() {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    recompensaPc: 0,
    limitePorUsuario: 1,
    rankMinimo: 'Iniciante',
    dataExpiracao: '',
    turmasPermitidas: 'TODAS' as string | string[],
    permitirBonusVip: false,
  });

  const [selectedClasses, setSelectedClasses] = useState<string[]>(['TODAS']);
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemValidity, setItemValidity] = useState<number>(0);
  const [timeUnit, setTimeUnit] = useState('DIAS');
  const [addedItems, setAddedItems] = useState<GiftItemPayload[]>([]);

  // ── Queries ───────────────────────────────────────────────

  const {
    data: storeItems = [],
    isLoading: loadingItems,
    isFetching: fetchingItems,
  } = useQuery<StoreItem[]>({
    queryKey: queryKeys.admin.store.items,
    queryFn: async () => {
      let itemsRes;
      try {
        itemsRes = await api.get('/store/items');
      } catch {
        itemsRes = await api.get('/admin/store');
      }
      const storeData = itemsRes.data;
      if (Array.isArray(storeData)) return storeData;
      return storeData?.items || storeData?.data || storeData?.products || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
  });

  const {
    data: classrooms = [],
    isLoading: loadingClasses,
    isFetching: fetchingClasses,
  } = useQuery<Classroom[]>({
    queryKey: queryKeys.admin.classes,
    queryFn: async () => {
      const classRes = await api.get('/classrooms');
      const classData = classRes.data;
      let arr: any[] = [];
      if (Array.isArray(classData)) arr = classData;
      else arr = classData?.classrooms || classData?.data || classData?.turmas || [];

      return arr.map((c: any) => ({
        _id: c._id || Math.random().toString(),
        name: String(c.name || c.turma || c.serie || 'Sem Nome'),
      }));
    },
    staleTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const isLoadingPage =
    loadingItems ||
    loadingClasses ||
    (classrooms.length === 0 && fetchingClasses) ||
    (storeItems.length === 0 && fetchingItems);

  // ── Mutation ──────────────────────────────────────────────

  const createGiftMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/gifts', payload);
    },
    onSuccess: () => {
      toast.success('Presente criado com sucesso!');
      setFormData({
        titulo: '', descricao: '', recompensaPc: 0, limitePorUsuario: 1,
        rankMinimo: 'Iniciante', dataExpiracao: '', turmasPermitidas: 'TODAS',
        permitirBonusVip: false,
      });
      setSelectedClasses(['TODAS']);
      setAddedItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao criar presente.');
    },
  });

  // ── Helpers ───────────────────────────────────────────────

  const filteredItems = storeItems.filter((item: StoreItem) =>
    (item.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClass = (className: string) => {
    if (className === 'TODAS') {
      setSelectedClasses(selectedClasses.includes('TODAS') ? [] : ['TODAS']);
      return;
    }
    let newSelection = selectedClasses.filter(c => c !== 'TODAS');
    if (newSelection.includes(className)) {
      newSelection = newSelection.filter(c => c !== className);
    } else {
      newSelection.push(className);
    }
    setSelectedClasses(newSelection);
  };

  const handleAddItem = () => {
    if (!selectedItem) return toast.warning('Selecione um item!');
    if (!itemQty || itemQty < 1) return toast.warning('Quantidade inválida!');

    const storeItem = storeItems.find(i => i._id === selectedItem);
    if (!storeItem) return;

    setAddedItems([
      ...addedItems,
      {
        item: selectedItem,
        quantidade: itemQty,
        validadeValor: itemValidity > 0 ? itemValidity : undefined,
        unidadeValidade: itemValidity > 0 ? timeUnit : undefined,
        tempName: storeItem.nome,
        tempImage: storeItem.imagem,
      },
    ]);

    setSelectedItem('');
    setItemQty(1);
    setItemValidity(0);
    setTimeUnit('DIAS');
    setSearchTerm('');
    toast.success(`${storeItem.nome} adicionado!`);
  };

  const handleRemoveItem = (index: number) => {
    setAddedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClasses = selectedClasses.includes('TODAS') ? ['TODAS'] : selectedClasses;
    if (finalClasses.length === 0) {
      toast.warning('Selecione pelo menos uma turma!');
      return;
    }
    createGiftMutation.mutate({
      ...formData,
      turmasPermitidas: finalClasses,
      recompensaItens: addedItems.map(({ tempName, tempImage, ...rest }) => rest),
    });
  };

  // ── Resumo do pacote ──────────────────────────────────────

  const totalItens = addedItems.reduce((acc, i) => acc + i.quantidade, 0);
  const hasContent = formData.recompensaPc > 0 || addedItems.length > 0;

  // ── Render ────────────────────────────────────────────────

  return (
    <AdminLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto pb-28 md:pb-20">
          {/* ═══ HEADER ═══ */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 md:p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
              <Gift className="text-pink-500" size={28} />
            </div>
            <div>
              <h1 className="font-vt323 text-3xl md:text-4xl text-white leading-none">
                CRIAR PRESENTE
              </h1>
              <p className="font-mono text-[10px] md:text-xs text-slate-500">
                Distribua recompensas, itens e PC$ para os alunos
              </p>
            </div>
          </div>

          {isLoadingPage ? (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center gap-3">
                <Gift className="text-pink-500/50 animate-bounce" size={40} />
                <span className="text-slate-500 font-press text-xs animate-pulse">
                  CARREGANDO SISTEMA...
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">

              {/* ══════════════════════════════════════════════
                  COLUNA 1: DETALHES + REGRAS
                  ══════════════════════════════════════════════ */}
              <div className="space-y-4">

                {/* ── DETALHES DO PACOTE ── */}
                <PixelCard className="!p-4 md:!p-6 border-pink-500/30">
                  <SectionHeader
                    icon={Package}
                    title="DETALHES DO PACOTE"
                    subtitle="Informações básicas do presente"
                    color="pink"
                  />

                  <div className="space-y-3">
                    <FormField label="Título do Presente">
                      <input
                        required
                        type="text"
                        value={formData.titulo}
                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        className={cn(inputClass, 'focus:border-pink-500 font-vt323 text-lg')}
                        placeholder="Ex: Kit de Boas Vindas"
                      />
                    </FormField>

                    <FormField label="Descrição">
                      <textarea
                        value={formData.descricao}
                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                        className={cn(inputClass, 'focus:border-pink-500 h-20 resize-none')}
                        placeholder="Mensagem que aparece ao abrir..."
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Expira em">
                        <input
                          type="datetime-local"
                          step="60"
                          value={formData.dataExpiracao}
                          onChange={e => setFormData({ ...formData, dataExpiracao: e.target.value })}
                          className={cn(inputClass, 'focus:border-pink-500 text-xs')}
                        />
                      </FormField>

                      <FormField label="Rank Mínimo">
                        <div className="relative">
                          <select
                            value={formData.rankMinimo}
                            onChange={e => setFormData({ ...formData, rankMinimo: e.target.value })}
                            className={cn(inputClass, 'focus:border-pink-500 appearance-none pr-8 text-xs cursor-pointer')}
                          >
                            <option value="Iniciante">Iniciante</option>
                            <option value="🥉 Bronze">🥉 Bronze</option>
                            <option value="🥈 Prata">🥈 Prata</option>
                            <option value="🥇 Ouro">🥇 Ouro</option>
                            <option value="💎 Diamante">💎 Diamante</option>
                            <option value="👑 Épico">👑 Épico</option>
                            <option value="🌟 Épico Lendário">🌟 Épico Lendário</option>
                            <option value="🔥 Épico Supremo">🔥 Épico Supremo</option>
                            <option value="🔱 Épico Mitológico">🔱 Épico Mitológico</option>
                            <option value="⚡ Épico Soberano">⚡ Épico Soberano</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>
                      </FormField>
                    </div>
                  </div>
                </PixelCard>

                {/* ── TURMAS PERMITIDAS ── */}
                <PixelCard className="!p-4 md:!p-6 border-blue-500/30">
                  <SectionHeader
                    icon={ShieldCheck}
                    title="TURMAS PERMITIDAS"
                    subtitle={
                      selectedClasses.includes('TODAS')
                        ? 'Todas as turmas podem resgatar'
                        : `${selectedClasses.length} turma(s) selecionada(s)`
                    }
                    color="blue"
                  />

                  <div className="bg-black/30 border border-slate-700/50 rounded-lg p-3 max-h-52 overflow-y-auto custom-scrollbar">
                    {/* TODAS */}
                    <button
                      type="button"
                      onClick={() => toggleClass('TODAS')}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-lg mb-2 border-2 transition-all text-left',
                        selectedClasses.includes('TODAS')
                          ? 'bg-pink-500/10 border-pink-500/50'
                          : 'border-transparent hover:bg-slate-800/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center transition-colors flex-shrink-0',
                          selectedClasses.includes('TODAS')
                            ? 'bg-pink-500 border-pink-500'
                            : 'border-slate-600'
                        )}
                      >
                        {selectedClasses.includes('TODAS') && (
                          <CheckSquare size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm font-vt323 text-pink-400 uppercase tracking-wider">
                        ✨ TODAS AS TURMAS
                      </span>
                    </button>

                    <div className="border-t border-slate-800 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {classrooms.map((classroom: Classroom) => {
                        const isSelected = selectedClasses.includes(classroom.name);
                        const isDisabled = selectedClasses.includes('TODAS');

                        return (
                          <button
                            key={classroom._id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => toggleClass(classroom.name)}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg transition-all text-left',
                              isDisabled && 'opacity-30 cursor-not-allowed',
                              !isDisabled && 'active:scale-[0.97]',
                              isSelected && !isDisabled
                                ? 'bg-blue-500/15 border border-blue-500/40'
                                : 'border border-transparent hover:bg-slate-800/50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors flex-shrink-0',
                                isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                              )}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                            </div>
                            <span
                              className={cn(
                                'text-xs font-mono truncate',
                                isSelected ? 'text-white font-bold' : 'text-slate-400'
                              )}
                            >
                              {classroom.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {classrooms.length === 0 && (
                      <p className="text-[10px] text-slate-500 text-center py-4">
                        Nenhuma turma encontrada.
                      </p>
                    )}
                  </div>
                </PixelCard>

                {/* ── REGRAS & VIP ── */}
                <PixelCard className="!p-4 md:!p-6 border-yellow-500/30">
                  <SectionHeader
                    icon={Crown}
                    title="REGRAS & VIP"
                    subtitle="Limites e bônus especiais"
                    color="yellow"
                  />

                  <div className="space-y-3">
                    {/* Toggle VIP */}
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-2.5">
                        <Sparkles size={16} className="text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="font-vt323 text-lg text-white leading-none">BÔNUS VIP</p>
                          <p className="font-mono text-[9px] text-slate-500 mt-0.5">VIPs podem pegar +1 vez</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.permitirBonusVip}
                          onChange={e => setFormData({ ...formData, permitirBonusVip: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500" />
                      </label>
                    </div>

                    <FormField label="Limite por Usuário">
                      <input
                        type="number"
                        min="1"
                        value={isNaN(formData.limitePorUsuario) ? '' : formData.limitePorUsuario}
                        onChange={e => setFormData({ ...formData, limitePorUsuario: parseInt(e.target.value) || 0 })}
                        className={cn(inputClass, 'focus:border-yellow-500')}
                      />
                    </FormField>
                  </div>
                </PixelCard>
              </div>

              {/* ══════════════════════════════════════════════
                  COLUNA 2: CONTEÚDO DO PRESENTE
                  ══════════════════════════════════════════════ */}
              <div className="space-y-4">

                {/* ── RECOMPENSA EM PC$ ── */}
                <PixelCard className="!p-4 md:!p-6 border-green-500/30">
                  <SectionHeader
                    icon={Coins}
                    title="RECOMPENSA EM PC$"
                    subtitle="Moedas adicionadas ao saldo do aluno"
                    color="green"
                  />

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-vt323 text-green-500 text-xl pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={isNaN(formData.recompensaPc) ? '' : formData.recompensaPc}
                      onChange={e => setFormData({ ...formData, recompensaPc: parseInt(e.target.value) || 0 })}
                      className={cn(
                        inputClass,
                        'focus:border-green-500 font-vt323 text-3xl text-green-400 pl-8 text-center'
                      )}
                    />
                  </div>
                </PixelCard>

                {/* ── ITENS DO PACOTE ── */}
                <PixelCard className="!p-4 md:!p-6 border-green-500/30">
                  <SectionHeader
                    icon={Box}
                    title="ITENS DO PACOTE"
                    subtitle={
                      addedItems.length > 0
                        ? `${addedItems.length} tipo(s) · ${totalItens} item(ns) total`
                        : 'Adicione itens da loja ao presente'
                    }
                    color="green"
                  />

                  {/* ── Busca ── */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar item da loja..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className={cn(inputClass, 'pl-9 focus:border-blue-500')}
                    />
                  </div>

                  {/* ── Select + Quantidade ── */}
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1 min-w-0">
                      <select
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        className={cn(inputClass, 'focus:border-blue-500 appearance-none pr-8 cursor-pointer')}
                      >
                        <option value="">Selecione um item...</option>
                        {filteredItems.map((item: StoreItem) => (
                          <option key={item._id} value={item._id}>
                            {item.nome} ({item.tipo || 'Item'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    </div>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={isNaN(itemQty) ? '' : itemQty}
                      onChange={e => setItemQty(parseInt(e.target.value) || 0)}
                      className={cn(inputClass, 'w-20 focus:border-blue-500 text-center flex-shrink-0')}
                    />
                  </div>

                  {/* ── Validade + Botão ADD ── */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="flex flex-1 min-w-0">
                      <div className="relative flex-1">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        <input
                          type="number"
                          min="0"
                          placeholder="Validade (0 = ∞)"
                          value={isNaN(itemValidity) ? '' : itemValidity}
                          onChange={e => setItemValidity(parseInt(e.target.value) || 0)}
                          className={cn(inputClass, 'focus:border-orange-500 pl-9 rounded-r-none border-r-0')}
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={timeUnit}
                          onChange={e => setTimeUnit(e.target.value)}
                          className={cn(
                            inputClass,
                            'focus:border-orange-500 rounded-l-none w-24 sm:w-28 cursor-pointer appearance-none pr-7'
                          )}
                        >
                          <option value="MINUTOS">Min</option>
                          <option value="HORAS">Horas</option>
                          <option value="DIAS">Dias</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className={cn(
                        'flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-press text-[10px] transition-all active:scale-[0.97] flex-shrink-0',
                        'bg-green-600 hover:bg-green-500 text-white border border-green-500',
                        'sm:w-auto w-full'
                      )}
                    >
                      <Plus size={14} /> ADICIONAR
                    </button>
                  </div>

                  {/* ── Lista de Itens Adicionados ── */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <AnimatePresence>
                      {addedItems.map((addItem, idx) => (
                        <motion.div
                          key={`${addItem.item}-${idx}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-slate-700/50 group">
                            {/* Imagem */}
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {addItem.tempImage ? (
                                <img
                                  src={getImageUrl(addItem.tempImage)}
                                  className="w-full h-full object-contain"
                                  alt=""
                                />
                              ) : (
                                <Box size={16} className="text-slate-600" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-bold truncate">
                                {addItem.quantidade}x {addItem.tempName}
                              </p>
                              {addItem.validadeValor ? (
                                <span className="text-[10px] text-orange-400 flex items-center gap-1">
                                  <Clock size={9} /> Expira em {addItem.validadeValor}{' '}
                                  {addItem.unidadeValidade?.toLowerCase()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <CalendarClock size={9} /> Permanente
                                </span>
                              )}
                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {addedItems.length === 0 && (
                      <div className="text-center py-6 text-slate-600">
                        <Box size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-press text-[9px]">NENHUM ITEM ADICIONADO</p>
                        <p className="font-mono text-[10px] text-slate-700 mt-1">
                          Use o formulário acima para adicionar
                        </p>
                      </div>
                    )}
                  </div>
                </PixelCard>

                {/* ── RESUMO (só aparece quando tem conteúdo) ── */}
                <AnimatePresence>
                  {hasContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-1.5">
                        <p className="font-press text-[10px] text-green-500 uppercase mb-2">
                          📦 Resumo do Pacote
                        </p>
                        {formData.recompensaPc > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-mono">PC$</span>
                            <span className="text-green-400 font-vt323 text-lg">
                              +{formData.recompensaPc} PC$
                            </span>
                          </div>
                        )}
                        {addedItems.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-mono">Itens</span>
                            <span className="text-blue-400 font-vt323 text-lg">
                              {totalItens} item(ns)
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm border-t border-green-500/10 pt-1.5 mt-1.5">
                          <span className="text-slate-400 font-mono">Turmas</span>
                          <span className="text-pink-400 font-vt323 text-lg">
                            {selectedClasses.includes('TODAS')
                              ? 'Todas'
                              : `${selectedClasses.length} turma(s)`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ══════════════════════════════════════════════
                  BOTÃO SUBMIT — Desktop: inline · Mobile: sticky
                  ══════════════════════════════════════════════ */}

              {/* Desktop */}
              <div className="hidden md:block md:col-span-2 pt-4 border-t border-slate-800">
                <PixelButton
                  type="submit"
                  isLoading={createGiftMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Save size={20} className="mr-2" /> PUBLICAR PRESENTE
                </PixelButton>
              </div>
            </form>
          )}

          {/* Mobile: Sticky bottom */}
          {!isLoadingPage && (
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 md:hidden z-40">
              <button
                type="button"
                onClick={() => {
                  // Trigger the form submit
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                disabled={createGiftMutation.isPending}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-press text-sm transition-all active:scale-[0.98]',
                  'bg-green-600 hover:bg-green-500 text-white',
                  'shadow-[0_0_25px_rgba(34,197,94,0.3)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {createGiftMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} /> PUBLICAR PRESENTE
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
}
