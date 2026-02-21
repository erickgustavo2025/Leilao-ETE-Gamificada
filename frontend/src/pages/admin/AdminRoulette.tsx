import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Dice6, DollarSign, Percent, Gift, Search, Link as LinkIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';
import { getImageUrl } from '../../utils/imageHelper';

// Interface do Item da Loja (Para busca)
interface StoreItem {
    _id: string;
    nome: string;
    imagem: string;
    raridade: string;
    isHouseItem?: boolean;
}

// Interface do Item na Roleta
interface RouletteOption {
    id: string;
    prizeId?: string;
    label: string; // Só para controle visual do frontend
    name: string;  // 🔥 O NOME REAL PRO MONGOOSE
    premio: string;
    image?: string;
    type?: 'PC' | 'ITEM';
    value?: number;
    probability: number; // 🔥 PRO MONGOOSE
    probabilidade: number; // Legado do form
    rarity?: string;
    isHouseItem?: boolean;
    validadeDias?: number;
}

interface Roulette {
    _id: string;
    name: string;
    title?: string; // Suporte ao legado
    cost: number;
    options: RouletteOption[];
    items?: RouletteOption[]; // Suporte ao legado
    isActive: boolean;
    active?: boolean; // Suporte ao legado
    type?: 'ROLETADA' | 'SORTEIO'; // 🔥 RECUPERADO!
    validDays?: number; // 🔥 RECUPERADO!
}

const DEFAULT_OPTION: RouletteOption = {
    id: String(Date.now()),
    label: 'NOVO',
    name: 'NOVO PRÊMIO', // 🔥 Nasce com nome válido
    premio: '0',
    type: 'PC',
    value: 0,
    probabilidade: 10,
    probability: 10, // 🔥 Nasce com número válido
    validadeDias: 0
};

export function AdminRoulette() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string>('');
    const [name, setName] = useState('');
    const [cost, setCost] = useState(100);
    const [type, setType] = useState<'ROLETADA' | 'SORTEIO'>('ROLETADA');
    const [options, setOptions] = useState<RouletteOption[]>([{ ...DEFAULT_OPTION }]);

    // Estado para os itens da loja (Busca)
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadStoreItems();
    }, []);

    // ✅ GET Roulettes
    const { data: roulettes = [], isLoading } = useQuery<Roulette[]>({
        queryKey: queryKeys.admin.roulettes,
        queryFn: async () => {
            // 🔥 ROTA CORRETA DE BUSCA DO ADMIN DE VOLTA!
            const res = await api.get('/roulette/admin/all');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    const loadStoreItems = async () => {
        try {
            const { data } = await api.get('/store/all');
            if (Array.isArray(data)) {
                setStoreItems(data);
            } else if (data && data.items && Array.isArray(data.items)) {
                setStoreItems(data.items);
            } else {
                setStoreItems([]);
            }
        } catch (error) {
            console.error("Erro busca itens:", error);
            setStoreItems([]);
        }
    };

    // ✅ SAVE Mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            // 🔥 Manda tudo pro POST /admin/save. O backend já sabe se atualiza ou cria!
            await api.post('/roulette/admin/save', data);
        },
        onSuccess: () => {
            toast.success(editingId ? "Roleta atualizada!" : "Roleta criada!");
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.roulettes });
            handleReset();
        },
        onError: () => {
            toast.error("Erro ao salvar roleta.");
        }
    });

    // ✅ DELETE Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // 🔥 Adicionado o /admin/ na rota de deletar!
            await api.delete(`/roulette/admin/${id}`);
        },
        onSuccess: () => {
            toast.success("Roleta removida.");
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.roulettes });
        }
    });
    // 📝 Handlers
    const handleAddOption = () => {
        setOptions([...options, { ...DEFAULT_OPTION, id: String(Date.now()) }]);
    };

    const handleRemoveOption = (id: string) => {
        if (options.length <= 1) {
            return toast.warning("Roleta precisa de pelo menos 1 opção!");
        }
        setOptions(options.filter(opt => opt.id !== id));
    };

    const handleUpdateOption = (id: string, field: keyof RouletteOption, value: any) => {
        setOptions(options.map(opt => {
            if (opt.id === id) {
                const newOpt = { ...opt, [field]: value };

                // 🔥 Sincronização automática de idiomas
                if (field === 'label') newOpt.name = value;
                if (field === 'probabilidade') newOpt.probability = Number(value) || 0;

                return newOpt;
            }
            return opt;
        }));
    };

    const handleSave = () => {
        if (!name.trim()) return toast.warning("Digite um nome para a roleta!");

        const totalProb = options.reduce((sum, opt) => sum + (Number(opt.probabilidade) || 0), 0);
        if (Math.abs(totalProb - 100) > 0.01) {
            return toast.error(`Probabilidades devem somar 100% (Atual: ${totalProb.toFixed(1)}%)`);
        }

        // Limpeza final para ter certeza absoluta que o Mongoose vai sorrir
        const itemsForBackend = options.map(opt => ({
            name: String(opt.label || opt.name || 'Premio').trim(),
            image: opt.image || '',
            type: opt.type || 'PC',
            value: Number(opt.value || opt.premio) || 0,
            probability: Number(opt.probabilidade || opt.probability) || 0,
            rarity: opt.rarity || 'Comum',
            isHouseItem: Boolean(opt.isHouseItem),
            prizeId: opt.prizeId || undefined,
            validadeDias: Number(opt.validadeDias) || 0
        }));

        saveMutation.mutate({
            id: editingId || undefined,
            title: name, // Banco antigo usa title
            name: name,  // Novo banco
            cost: Number(cost) || 0,
            type,
            active: true,
            validDays: 90, // Padrão da roleta
            items: itemsForBackend
        });
    };
    const handleEdit = (roulette: Roulette) => {
        setEditingId(roulette._id);
        setName(roulette.name || roulette.title || '');
        setCost(roulette.cost || 0);
        setType(roulette.type || 'ROLETADA');

        // Trata os options antigos x novos
        const rawOptions = roulette.options || roulette.items || [];
        setOptions(rawOptions.map((opt: any) => ({
            ...opt,
            id: String(Math.random()),
            label: opt.label || opt.name || 'Prêmio',
            premio: opt.premio || opt.name || 'Item',
            type: opt.type || 'ITEM',
            validadeDias: opt.validadeDias || 0
        })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Remover esta roleta permanentemente?")) return;
        deleteMutation.mutate(id);
    };

    const handleReset = () => {
        setEditingId('');
        setName('');
        setCost(100);
        setType('ROLETADA');
        setOptions([{ ...DEFAULT_OPTION }]);
    };

    // 🔥 VÍNCULO AUTOMÁTICO (Busca -> Form)
    const linkItemToRoulette = (id: string, storeItem: StoreItem) => {
        setOptions(options.map(opt => {
            if (opt.id === id) {
                return {
                    ...opt,
                    label: storeItem.nome,
                    premio: storeItem.nome,
                    image: storeItem.imagem,
                    rarity: storeItem.raridade,
                    isHouseItem: storeItem.isHouseItem || false,
                    prizeId: storeItem._id,
                    type: 'ITEM'
                };
            }
            return opt;
        }));
        toast.success(`Item "${storeItem.nome}" vinculado!`);
        setSearchTerm('');
    };

    const totalProb = options.reduce((sum, opt) => sum + opt.probabilidade, 0);
    const isTotalValid = Math.abs(totalProb - 100) < 0.01;

    return (
        <AdminLayout>
            <PageTransition>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="font-vt323 text-4xl text-fuchsia-400 uppercase">GESTÃO DE ROLETAS</h1>
                        <p className="font-vt323 text-lg text-slate-500">Configure prêmios, custos e vínculos.</p>
                    </div>
                    {!editingId && (
                        <PixelButton onClick={handleReset} className="bg-green-600">
                            <Plus size={16} className="mr-2" /> NOVA ROLETA
                        </PixelButton>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* FORMULÁRIO EDITOR */}
                    <PixelCard className={cn("bg-slate-900 h-fit lg:sticky lg:top-6 border-2", editingId ? "border-yellow-500" : "border-fuchsia-500")}>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                            <h2 className={cn("font-press text-xs flex items-center gap-2", editingId ? "text-yellow-400" : "text-fuchsia-400")}>
                                <Dice6 size={16} /> {editingId ? "EDITANDO ROLETA" : "CRIAR ROLETA"}
                            </h2>
                            {editingId && <button onClick={handleReset} className="text-[10px] font-mono text-red-400 hover:text-red-300">CANCELAR</button>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-press text-slate-400">NOME</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-xl focus:border-fuchsia-500 outline-none uppercase" placeholder="EX: ROLETA ÉPICA" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-press text-slate-400">TIPO</label>
                                    <select value={type} onChange={e => setType(e.target.value as 'ROLETADA' | 'SORTEIO')} className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-xs focus:border-fuchsia-500 outline-none">
                                        <option value="ROLETADA">ROLETADA</option>
                                        <option value="SORTEIO">SORTEIO (TICKET)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-press text-slate-400">CUSTO (PC$)</label>
                                    <div className="relative">
                                        <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-yellow-400" />
                                        <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-black border border-slate-700 p-2 pl-6 text-yellow-400 font-vt323 text-xl focus:border-fuchsia-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-press text-slate-400">PRÊMIOS</label>
                                    <span className={cn("text-[10px] font-press", isTotalValid ? "text-green-400" : "text-red-400")}>
                                        TOTAL: {totalProb.toFixed(1)}% {isTotalValid ? <CheckCircle2 size={10} className="inline" /> : <AlertTriangle size={10} className="inline" />}
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                    {options.map(option => (
                                        <div key={option.id} className="bg-black border border-slate-700 p-2 rounded">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-2">
                                                    <div className="w-8 h-8 bg-slate-900 rounded border border-slate-800 flex items-center justify-center">
                                                        {option.image ? <img src={getImageUrl(option.image)} className="w-6 h-6 object-contain" /> : <Gift size={14} className="text-slate-600" />}
                                                    </div>
                                                    <div>
                                                        <input value={option.label} onChange={e => handleUpdateOption(option.id, 'label', e.target.value)} className="bg-transparent text-white font-vt323 text-lg outline-none w-full leading-none" placeholder="Nome no Gráfico" />
                                                        <div className="flex gap-2 mt-1">
                                                            <select value={option.type} onChange={e => handleUpdateOption(option.id, 'type', e.target.value)} className="bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-300 p-0.5 rounded outline-none">
                                                                <option value="PC">Dar PC$</option>
                                                                <option value="ITEM">Dar Item DB</option>
                                                            </select>
                                                            {option.type === 'ITEM' && option.prizeId && (
                                                                <span className="text-[8px] bg-green-900/30 text-green-400 border border-green-800 px-1 rounded flex items-center"><LinkIcon size={8} className="mr-1" /> Vinculado</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveOption(option.id)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                                            </div>

                                            {/* BUSCA DE ITEM SE FOR TIPO ITEM */}
                                            {option.type === 'ITEM' && !option.prizeId && (
                                                <div className="relative mb-2">
                                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2">
                                                        <Search size={12} className="text-slate-500 mr-1" />
                                                        <input type="text" placeholder="Buscar no BD..." className="w-full bg-transparent p-1 text-[10px] text-white outline-none font-mono" onChange={(e) => setSearchTerm(e.target.value)} />
                                                    </div>
                                                    {searchTerm.length > 2 && (
                                                        <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-600 max-h-32 overflow-y-auto z-50 rounded shadow-xl mt-1">
                                                            {(storeItems || []).filter(i => (i.nome || '').toLowerCase().includes(searchTerm.toLowerCase())).map(dbItem => (
                                                                <div key={dbItem._id} className="p-1.5 hover:bg-slate-700 cursor-pointer flex items-center gap-2 border-b border-slate-700/50" onMouseDown={() => linkItemToRoulette(option.id, dbItem)}>
                                                                    <img src={getImageUrl(dbItem.imagem)} className="w-5 h-5 object-contain" />
                                                                    <span className="text-[10px] text-white font-mono">{dbItem.nome}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1.5 rounded">
                                                {option.type === 'PC' ? (
                                                    <div>
                                                        <label className="text-[8px] text-slate-500 font-press uppercase">Valor (PC$)</label>
                                                        <input type="number" value={option.value || option.premio} onChange={e => { handleUpdateOption(option.id, 'value', Number(e.target.value)); handleUpdateOption(option.id, 'premio', e.target.value); }} className="w-full bg-black border border-slate-700 p-1 text-yellow-400 font-mono text-xs rounded outline-none" />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="text-[8px] text-slate-500 font-press uppercase">Validade (Dias)</label>
                                                        <input type="number" value={option.validadeDias || 0} onChange={e => handleUpdateOption(option.id, 'validadeDias', Number(e.target.value))} className="w-full bg-black border border-slate-700 p-1 text-blue-400 font-mono text-xs rounded outline-none" placeholder="0 = Eterno" />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-[8px] text-slate-500 font-press uppercase">Chance (%)</label>
                                                    <div className="relative">
                                                        <input type="number" step="0.1" value={option.probabilidade} onChange={e => handleUpdateOption(option.id, 'probabilidade', Number(e.target.value))} className="w-full bg-black border border-slate-700 p-1 pr-4 text-green-400 font-mono text-xs rounded outline-none" />
                                                        <Percent size={10} className="absolute right-1 top-1.5 text-slate-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleAddOption} className="w-full mt-2 border border-dashed border-slate-700 hover:border-fuchsia-500 p-2 text-slate-500 hover:text-white font-press text-[10px] transition-colors rounded">
                                    <Plus size={12} className="inline mr-1" /> NOVO PRÊMIO
                                </button>
                            </div>

                            <PixelButton onClick={handleSave} isLoading={saveMutation.isPending} disabled={!isTotalValid} className={cn("w-full", isTotalValid ? "bg-green-600" : "bg-slate-700")}>
                                <Save size={16} className="mr-2" /> SALVAR ROLETA
                            </PixelButton>
                        </div>
                    </PixelCard>

                    {/* LISTAGEM */}
                    <div className="lg:col-span-2 space-y-3">
                        {isLoading ? (
                            <div className="text-center py-10 text-slate-500 font-press animate-pulse text-xs">BUSCANDO CASSINOS...</div>
                        ) : roulettes.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 font-vt323 text-xl border-2 border-dashed border-slate-800 rounded-xl">Nenhuma roleta configurada.</div>
                        ) : (
                            roulettes.map(roulette => {
                                const optArray = roulette.options || roulette.items || [];
                                return (
                                    <PixelCard key={roulette._id} className="p-4 border-l-4 border-l-fuchsia-500 bg-slate-900/80">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-vt323 text-3xl text-white uppercase leading-none">{roulette.name || roulette.title}</h3>
                                                <div className="flex gap-3 mt-1 font-mono text-xs text-slate-400">
                                                    <span className="text-yellow-400">CUSTO: {roulette.cost} PC$</span>
                                                    <span className={cn("px-1 rounded border text-[9px]", roulette.type === 'ROLETADA' ? "border-blue-800 text-blue-400" : "border-purple-800 text-purple-400")}>{roulette.type || 'ROLETADA'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(roulette)} className="p-2 bg-slate-800 text-blue-400 hover:bg-blue-500/20 rounded border border-slate-700 transition-colors"><Save size={16} /></button>
                                                <button onClick={(e) => handleDelete(roulette._id, e)} className="p-2 bg-slate-800 text-red-400 hover:bg-red-500/20 rounded border border-slate-700 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {optArray.map((opt: any, idx: number) => (
                                                <div key={idx} className="bg-black border border-slate-800 p-2 rounded flex items-center gap-2">
                                                    {opt.image && <img src={getImageUrl(opt.image)} className="w-6 h-6 object-contain" />}
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-[9px] text-white truncate leading-none mb-1 uppercase">{opt.label || opt.name}</p>
                                                        <div className="flex gap-1 text-[9px] font-press">
                                                            <span className="text-green-400">{opt.probabilidade}%</span>
                                                            {opt.validadeDias > 0 && <span className="text-blue-400">| {opt.validadeDias}D</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </PixelCard>
                                );
                            })
                        )}
                    </div>
                </div>
            </PageTransition>
        </AdminLayout>
    );
}