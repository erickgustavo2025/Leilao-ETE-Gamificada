import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Image as ImageIcon, Coins, Pencil, XCircle, Home, Tag } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';
import { toast } from 'sonner';
import { queryKeys } from '../../utils/queryKeys';
import { getImageUrl } from '../../utils/imageHelper';

const PRICE_TABLE: Record<string, number> = {
  'Bronze': 100, 'Prata': 200, 'Ouro': 300, 'Diamante': 400, 'Épico': 500,
  'Épico Lendário': 600, 'Épico Supremo': 700, 'Épico Mitológico': 800,
  'Épico Soberano': 900, 'Comum': 50, 'Evento': 0
};

const RANK_STYLES: Record<string, string> = {
  'Bronze': 'text-orange-700 border-orange-800',
  'Prata': 'text-slate-400 border-slate-500',
  'Ouro': 'text-yellow-400 border-yellow-600',
  'Diamante': 'text-cyan-400 border-cyan-600',
  'Épico': 'text-purple-500 border-purple-700',
  'Épico Lendário': 'text-fuchsia-500 border-fuchsia-700',
  'Épico Supremo': 'text-red-500 border-red-700',
  'Épico Mitológico': 'text-rose-900 border-rose-950',
  'Épico Soberano': 'text-yellow-200 border-yellow-100',
  'Comum': 'text-slate-500 border-slate-700',
  'Evento': 'text-green-400 border-green-600'
};

const ROLES = [
  'Todos', 'Estudante Honorário', 'Monitor de Disciplina', 'Monitor da Escola',
  'Armada de Dumbledore', 'Monitor da Biblioteca', 'Monitor da Quadra',
  'Integrante da Banda', 'Representante de Sala', 'Colaborador'
];

const BECO_CATEGORIES = ['NENHUMA', 'VASSOURAS', 'VARINHAS', 'POCOES', 'MAROTO', 'MINISTERIO', 'MAGIC_BOOK'];

interface StoreItem {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  raridade: string;
  cargoExclusivo: string;
  validadeDias: number;
  isHouseItem: boolean;
  lojaTematica: string;
  imagem: string;
}

export function AdminStore() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔥 ESTADO DE PREVIEW DE IMAGEM
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    editingId: '',
    nome: '',
    descricao: '',
    preco: '',
    estoque: '0',
    raridade: 'Comum',
    cargoExclusivo: 'Todos',
    validadeDias: '90',
    isHouseItem: false,
    lojaTematica: 'NENHUMA'
  });

  const { data: items = [], isLoading } = useQuery<StoreItem[]>({
    queryKey: queryKeys.admin.store.items,
    queryFn: async () => {
      const res = await api.get('/store/items');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await api.post('/store/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Item criado!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.store.items });
      resetForm();
    },
    onError: () => toast.error("Erro ao criar item.")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fd }: { id: string; fd: FormData }) => {
      const res = await api.put(`/store/items/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Item atualizado!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.store.items });
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar item.")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/store/items/${id}`),
    onSuccess: () => {
      toast.success("Item removido.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.store.items });
    }
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'raridade' && PRICE_TABLE[value] !== undefined && formData.preco === '') {
       setFormData(prev => ({ ...prev, raridade: value, preco: PRICE_TABLE[value].toString() }));
       return;
    }

    if (name === 'isHouseItem' && !checked) {
        setFormData(prev => ({ ...prev, isHouseItem: false, lojaTematica: 'NENHUMA' }));
        return;
    }

    if (name === 'isHouseItem' && checked && formData.lojaTematica === 'NENHUMA') {
        setFormData(prev => ({ ...prev, isHouseItem: true, lojaTematica: 'VASSOURAS' }));
        return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 🔥 HANDLER DE IMAGEM CORRIGIDO (O bypass do React Strict Mode)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview); // Limpa só na hora de trocar
      }
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.nome || !formData.preco) return toast.error("Preencha nome e preço!");

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'editingId') fd.append(key, String(value));
    });

    if (fileInputRef.current?.files?.[0]) {
      fd.append('imagem', fileInputRef.current.files[0]);
    }

    if (formData.editingId) {
      updateMutation.mutate({ id: formData.editingId, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const resetForm = () => {
    setFormData({
      editingId: '', nome: '', descricao: '', preco: '', estoque: '0',
      raridade: 'Comum', cargoExclusivo: 'Todos', validadeDias: '90', isHouseItem: false, lojaTematica: 'NENHUMA'
    });
    setImagePreview(null); // Zera a imagem
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (item: StoreItem) => {
    setFormData({
      editingId: item._id,
      nome: item.nome,
      descricao: item.descricao || '',
      preco: item.preco.toString(),
      estoque: item.estoque.toString(),
      raridade: item.raridade || 'Comum',
      cargoExclusivo: item.cargoExclusivo || 'Todos',
      validadeDias: item.validadeDias?.toString() || '90',
      isHouseItem: item.isHouseItem || false,
      lojaTematica: item.lojaTematica || 'NENHUMA'
    });
    // Setando o preview com a URL do backend
    setImagePreview(getImageUrl(item.imagem));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apagar este item permanentemente?")) deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-vt323 text-4xl text-purple-400">LOJA DO SISTEMA</h1>
            <p className="font-vt323 text-lg text-slate-500">Cadastre benefícios e itens do Beco Diagonal.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* FORMULÁRIO */}
          <PixelCard className={cn("bg-slate-900 h-fit shadow-2xl sticky top-6", formData.editingId ? "border-yellow-400" : "border-purple-500")}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={cn("font-press text-sm flex items-center gap-2", formData.editingId ? "text-yellow-400" : "text-purple-400")}>
                {formData.editingId ? <><Pencil size={16} /> EDITANDO ITEM</> : <><Plus size={16} /> NOVO ITEM</>}
              </h2>
              {formData.editingId && (
                <button onClick={resetForm} type="button" className="text-slate-500 hover:text-red-400 flex items-center gap-1 text-[10px] font-press">
                  <XCircle size={14} /> CANCELAR
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-press text-slate-400">NOME DO ITEM</label>
                <input name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-2xl focus:border-purple-500 outline-none" />
              </div>

              {/* 🔥 MÓDULO BECO DIAGONAL 🔥 */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home size={16} className={formData.isHouseItem ? "text-purple-500" : "text-slate-600"} />
                    <div>
                      <p className="font-press text-[10px] text-white">IR PARA O BECO DIAGONAL?</p>
                      <p className="text-[8px] text-slate-500 font-mono">Item para baú da Taça das Casas</p>
                    </div>
                  </div>
                  <input type="checkbox" name="isHouseItem" checked={formData.isHouseItem} onChange={handleChange} className="w-10 h-5 rounded-full accent-purple-600" />
                </div>
                
                {formData.isHouseItem && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-slate-800">
                    <label className="text-[9px] font-press text-purple-400 mb-1 flex items-center gap-1"><Tag size={10}/> CATEGORIA DA LOJA</label>
                    <select name="lojaTematica" value={formData.lojaTematica} onChange={handleChange} className="w-full bg-black border border-purple-900/50 text-purple-300 p-2 text-xs font-press outline-none focus:border-purple-500">
                      {BECO_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-press text-slate-400">RANK</label>
                  <select name="raridade" value={formData.raridade} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 text-sm font-vt323 outline-none">
                    {Object.keys(RANK_STYLES).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-press text-slate-400">EXCLUSIVO</label>
                  <select name="cargoExclusivo" value={formData.cargoExclusivo} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-sm outline-none">
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-press text-slate-400">PREÇO (PC$)</label>
                  <div className="relative">
                    <Coins size={14} className="absolute left-2 top-3 text-yellow-400" />
                    <input type="number" name="preco" value={formData.preco} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 pl-7 text-yellow-400 font-vt323 text-xl focus:border-purple-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-press text-slate-400">VALIDADE (DIAS)</label>
                  <input type="number" name="validadeDias" value={formData.validadeDias} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-xl focus:border-purple-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-press text-slate-400">DESCRIÇÃO</label>
                <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="w-full bg-black border border-slate-700 p-2 text-slate-300 font-vt323 text-lg h-20 focus:border-purple-500 outline-none" />
              </div>

              {/* 🔥 IMAGEM COM PREVIEW VISUAL CONSERTADO 🔥 */}
              <div>
                <label className="text-[10px] font-press text-slate-400 mb-2 block">IMAGEM DO ITEM</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed cursor-pointer bg-slate-800/50 group border-slate-700 hover:border-purple-500 rounded-lg overflow-hidden relative">
                  {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] font-press text-white">ALTERAR IMAGEM</span>
                        </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="text-slate-500 mb-1 group-hover:text-purple-400 transition-colors" />
                        <span className="text-[8px] font-press text-slate-500 group-hover:text-purple-400 transition-colors">FAZER UPLOAD</span>
                      </div>
                  )}
                  <input ref={fileInputRef} type="file" name="imagem" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>

              <PixelButton type="submit" className={cn("w-full flex items-center justify-center gap-2 text-white mt-4", formData.editingId ? "bg-yellow-600 hover:bg-yellow-500" : "bg-purple-600 hover:bg-purple-500")} isLoading={createMutation.isPending || updateMutation.isPending}>
                {formData.editingId ? <><Pencil size={16} /> SALVAR ALTERAÇÕES</> : <><Plus size={16} /> CADASTRAR ITEM</>}
              </PixelButton>
            </form>
          </PixelCard>

          {/* LISTA DE ITENS */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[85vh] pr-2 pb-20 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-10 text-slate-500 font-press animate-pulse">CARREGANDO LOJA...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-vt323 text-xl">NENHUM ITEM CADASTRADO</div>
            ) : (
              items.map(item => (
                <div key={item._id} className={cn("flex items-center gap-4 bg-slate-900 p-3 rounded border-l-4 relative group", RANK_STYLES[item.raridade]?.split(' ')[1] || 'border-slate-600')}>
                  {item.isHouseItem && (
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-press px-2 py-0.5 rounded-bl shadow-lg z-10 flex items-center gap-1">
                      <Home size={8} /> BECO: {item.lojaTematica}
                    </div>
                  )}

                  <div className="w-16 h-16 bg-black border border-slate-700 flex-shrink-0">
                    <img src={getImageUrl(item.imagem)} alt={item.nome} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store.png'; }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-vt323 px-1 rounded border uppercase", RANK_STYLES[item.raridade] || "text-slate-500 border-slate-700")}>{item.raridade}</span>
                      <span className="text-[10px] font-vt323 text-slate-400">{item.validadeDias > 0 ? `${item.validadeDias} DIAS` : "INFINITO"}</span>
                    </div>
                    <h3 className="font-vt323 text-2xl text-white truncate leading-none">{item.nome}</h3>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-yellow-400 font-vt323 text-2xl">{item.preco} PC$</span>
                    <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-slate-800">
                      <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-300 p-1.5"><Pencil size={14} /></button>
                      <div className="w-[1px] h-4 bg-slate-700"></div>
                      <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-300 p-1.5"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PageTransition>
    </AdminLayout>
  );
}