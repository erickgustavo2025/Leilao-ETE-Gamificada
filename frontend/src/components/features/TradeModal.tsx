import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Search, Plus, Trash2, Scale, Coins, AlertTriangle, CheckCircle, Loader2, User, UserCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { PixelCard } from '../ui/PixelCard';
import { PixelButton } from '../ui/PixelButton';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../utils/imageHelper';
import { cn } from '../../utils/cn';
import { useGameSound } from '../../hooks/useGameSound';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUser: { _id: string; nome: string; matricula: string };
}

interface TradeItem {
    inventoryId: string;
    itemId: string;
    name: string;
    basePrice: number;
    image: string;
    descricao?: string;
    expiresAt?: string;
    quantity: number;
    isHouseItem: boolean;
    category: string;
    rarity: string;
}

export function TradeModal({ isOpen, onClose, targetUser }: TradeModalProps) {
    const { user } = useAuth();
    const { playClick, playSuccess, playError } = useGameSound();

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileTab, setMobileTab] = useState<'my' | 'target'>('my');

    const [myInventory, setMyInventory] = useState<any[]>([]);
    const [targetInventory, setTargetInventory] = useState<any[]>([]);

    const [myOfferItems, setMyOfferItems] = useState<TradeItem[]>([]);
    const [myOfferPc, setMyOfferPc] = useState<string>('');

    const [targetOfferItems, setTargetOfferItems] = useState<TradeItem[]>([]);
    const [targetOfferPc, setTargetOfferPc] = useState<string>('');

    const [fairnessRatio, setFairnessRatio] = useState(1);
    const [isFair, setIsFair] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadInventories();
        }
    }, [isOpen, targetUser]);

    useEffect(() => {
        const myTotal = myOfferItems.reduce((acc, i) => acc + (i.basePrice || 0), 0) + (parseInt(myOfferPc) || 0);
        const targetTotal = targetOfferItems.reduce((acc, i) => acc + (i.basePrice || 0), 0) + (parseInt(targetOfferPc) || 0);

        const maxVal = Math.max(myTotal, targetTotal);
        const minVal = Math.min(myTotal, targetTotal);

        // Se não tem nada de nenhum lado, é 100% justo (0%)
        if (maxVal === 0) {
            setFairnessRatio(1);
            setIsFair(true);
            return;
        }

        // Calcula a razão de diferença (ex: 800 / 1000 = 0.8)
        const ratio = minVal / maxVal;
        setFairnessRatio(ratio);

        // 🔥 AGORA SIM! Só é justo se a diferença for NO MÁXIMO 20% (Ratio >= 0.80)
        setIsFair(ratio >= 0.80);
    }, [myOfferItems, myOfferPc, targetOfferItems, targetOfferPc]);

    async function loadInventories() {
        setLoading(true);
        try {
            const myRes = await api.get('/inventory/my');
            const targetRes = await api.get(`/inventory/public/${targetUser._id}`);
            setMyInventory(myRes.data);
            setTargetInventory(targetRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar inventários.");
        } finally {
            setLoading(false);
        }
    }

    const handleAddItem = (item: any, side: 'my' | 'target') => {
        // 🔥 BUSCA INTELIGENTE DO PREÇO BASE
        const precoCalculado = item.basePrice || item.preco || item.itemId?.preco || item.itemId?.basePrice || 0;

        const tradeItem: TradeItem = {
            inventoryId: item._id,
            itemId: item.itemId?._id || item.itemId,
            name: item.name || item.nome,
            basePrice: precoCalculado,
            descricao: item.descricao || item.description || item.itemId?.descricao, // 🔥 COPIA A DESCRIÇÃO
            expiresAt: item.expiresAt,
            image: item.image || item.imagem || item.itemId?.imagem || '',
            quantity: 1,
            isHouseItem: item.isHouseItem || item.itemId?.isHouseItem || false,
            category: item.category || item.itemId?.category || 'CONSUMIVEL',
            rarity: item.rarity || item.raridade || item.itemId?.raridade || 'Comum'
        };

        if (side === 'my') {
            if (myOfferItems.find(i => i.inventoryId === item._id)) return;
            setMyOfferItems([...myOfferItems, tradeItem]);
        } else {
            if (targetOfferItems.find(i => i.inventoryId === item._id)) return;
            setTargetOfferItems([...targetOfferItems, tradeItem]);
        }
        playClick();
    };

    const handleRemoveItem = (id: string, side: 'my' | 'target') => {
        if (side === 'my') {
            setMyOfferItems(myOfferItems.filter(i => i.inventoryId !== id));
        } else {
            setTargetOfferItems(targetOfferItems.filter(i => i.inventoryId !== id));
        }
    };

    const handleSubmit = async () => {
        const myMoney = parseInt(myOfferPc) || 0;
        const currentBalance = user?.saldoPc || 0;

        if (myMoney > currentBalance) {
            return toast.error("SALDO INSUFICIENTE!");
        }

        if (!isFair) {
            return toast.error("TROCA DESBALANCEADA!", { description: "A diferença de valor é muito grande." });
        }

        setLoading(true);
        try {
            await api.post('/trade/create', {
                targetId: targetUser._id,
                offerInitiator: { pc: myMoney, items: myOfferItems },
                offerTarget: { pc: parseInt(targetOfferPc) || 0, items: targetOfferItems }
            });
            playSuccess();
            toast.success("PROPOSTA ENVIADA!", { description: `${targetUser.nome} recebeu uma notificação.` });
            onClose();
        } catch (error: any) {
            playError();
            toast.error(error.response?.data?.error || "Erro ao enviar proposta.");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 FILTRO BLINDADO CONTRA SKILLS
    const filterItems = (items: any[]) => items.filter(i => {
        const cat = String(i.category || i.itemId?.category).toUpperCase();
        const isSkill = cat === 'RANK_SKILL' || cat === 'HABILIDADE' || i.isSkill || i.itemId?.isSkill;
        const matchName = (i.name || i.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
        return !isSkill && matchName;
    });

    const handleSetMaxMoney = () => {
        if (user?.saldoPc) {
            setMyOfferPc(String(user.saldoPc));
            playClick();
        }
    };

    if (!isOpen) return null;

    const TradeSide = ({ side, inventory, offerItems, offerPc, setOfferPc }: any) => {
        const isMySide = side === 'my';
        const currentBalance = user?.saldoPc || 0;
        const inputMoney = parseInt(offerPc) || 0;
        const hasEnoughMoney = isMySide ? inputMoney <= currentBalance : true;

        return (
            <div className={cn("flex-1 flex flex-col bg-slate-900/50 h-full", isMySide ? "border-r-0 md:border-r border-slate-700" : "")}>
                <div className={cn("p-2 border-b border-slate-700 font-vt323 text-xl text-center uppercase flex items-center justify-center gap-2", isMySide ? "bg-blue-900/20 text-blue-300" : "bg-red-900/20 text-red-300")}>
                    {isMySide ? <User size={16} /> : <UserCheck size={16} />}
                    {isMySide ? `SUA OFERTA` : `OFERTA DE ${targetUser.nome.split(' ')[0]}`}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-2 max-h-[35vh] custom-scrollbar">
                    {offerItems.length === 0 && (
                        <p className="text-center text-slate-600 font-mono text-xs py-4">Nenhum item adicionado.</p>
                    )}
                    {offerItems.map((item: TradeItem) => (
                        <div key={item.inventoryId} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-600 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="flex items-center gap-2">
                                <img src={getImageUrl(item.image)} className="w-8 h-8 object-cover bg-black rounded" alt={item.name} />
                                <div>
                                    <p className="font-vt323 text-lg leading-none text-white truncate max-w-[120px]">{item.name}</p>
                                    <div className="flex gap-2">
                                        <p className="text-[10px] text-yellow-500 font-mono">{item.basePrice} PC$</p>
                                        {item.isHouseItem && <p className="text-[9px] text-purple-400 font-press uppercase">SALA</p>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveItem(item.inventoryId, side)} className="text-red-400 hover:text-white p-2"><Trash2 size={16} /></button>
                        </div>
                    ))}

                    <div className={cn("flex flex-col gap-1 bg-slate-800 p-2 rounded border mt-2 transition-colors", hasEnoughMoney ? "border-slate-600" : "border-red-500 bg-red-900/10")}>
                        <div className="flex items-center gap-2">
                            <Coins className={cn("transition-colors", hasEnoughMoney ? "text-yellow-400" : "text-red-400")} size={20} />
                            <input type="number" value={offerPc} onChange={e => setOfferPc(e.target.value)} placeholder="0" className="bg-transparent text-white font-vt323 text-2xl w-full outline-none placeholder:text-slate-600" />
                            <span className="text-xs font-press text-slate-500">PC$</span>
                        </div>

                        {isMySide && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-700/50 mt-1">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                    <Wallet size={10} /><span>Saldo: {currentBalance}</span>
                                </div>
                                <button onClick={handleSetMaxMoney} className="text-[10px] font-press text-yellow-500 hover:text-white hover:underline transition-colors">MAX</button>
                            </div>
                        )}
                        {!hasEnoughMoney && <span className="text-[9px] text-red-400 font-press text-right">SALDO INSUFICIENTE</span>}
                    </div>
                </div>

                <div className="h-[40%] border-t border-slate-700 bg-black/20 flex flex-col">
                    <div className="p-2 bg-slate-900 border-b border-slate-700 sticky top-0 z-10 flex justify-between items-center">
                        <p className="text-lg font-vt323 text-slate-400 uppercase tracking-wider">{isMySide ? 'SEU INVENTÁRIO' : 'INVENTÁRIO DELE(A)'}</p>
                        <span className="text-[10px] font-mono text-slate-600">{filterItems(inventory).length} ITENS</span>
                    </div>
                    <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                        {loading ? <Loader2 className="animate-spin mx-auto text-slate-500 mt-4" /> : (
                            <div className="grid grid-cols-3 gap-2">
                                {filterItems(inventory).map((item: any) => (
                                    <div key={item._id} onClick={() => handleAddItem(item, side)} className={cn("cursor-pointer hover:bg-slate-800 border p-1 flex flex-col items-center group transition-all relative rounded bg-slate-900", isMySide ? "border-slate-700 hover:border-blue-500" : "border-slate-700 hover:border-red-500")}>
                                        <img src={getImageUrl(item.image || item.imagem)} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" alt={item.name} />
                                        <div className={cn("absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-white rounded-bl-sm", isMySide ? "bg-blue-500" : "bg-red-500")}><Plus size={10} /></div>
                                        <span className="text-[8px] truncate w-full text-center mt-1 text-slate-400 group-hover:text-white">{item.name || item.nome}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm">
                    <PixelCard className="w-full h-full md:h-[90vh] md:max-w-5xl flex flex-col p-0 overflow-hidden relative shadow-2xl rounded-none md:rounded-lg" color="#facc15">
                        {/* HEADER */}
                        <div className="p-3 md:p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3 md:gap-4">
                                <ArrowRightLeft className="text-yellow-400" size={24} />
                                <div><h2 className="font-vt323 text-2xl md:text-3xl text-white leading-none">NEGOCIAÇÃO</h2></div>
                            </div>

                            <div className="relative w-32 md:w-64">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-slate-600 rounded py-1 pl-8 pr-2 text-xs text-white font-mono focus:border-yellow-400 outline-none" />
                            </div>

                            <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                        </div>

                        {/* ABAS MOBILE */}
                        <div className="flex md:hidden border-b border-slate-700">
                            <button onClick={() => setMobileTab('my')} className={cn("flex-1 py-3 text-sm font-press text-[10px] flex items-center justify-center gap-2", mobileTab === 'my' ? "bg-slate-800 text-blue-300 border-b-2 border-blue-500" : "bg-slate-900 text-slate-500")}><User size={14} /> EU</button>
                            <button onClick={() => setMobileTab('target')} className={cn("flex-1 py-3 text-sm font-press text-[10px] flex items-center justify-center gap-2", mobileTab === 'target' ? "bg-slate-800 text-red-300 border-b-2 border-red-500" : "bg-slate-900 text-slate-500")}><UserCheck size={14} /> {targetUser.nome.split(' ')[0]}</button>
                        </div>

                        {/* CORPO */}
                        <div className="flex-1 overflow-hidden relative bg-slate-900">
                            <div className="flex h-full w-full">
                                <div className={cn("flex-1 h-full", mobileTab === 'my' ? "block" : "hidden md:block")}>
                                    <TradeSide side="my" inventory={myInventory} offerItems={myOfferItems} offerPc={myOfferPc} setOfferPc={setMyOfferPc} />
                                </div>
                                <div className="hidden md:flex w-12 bg-black flex-col items-center justify-center border-x border-slate-700 relative shrink-0 z-20">
                                    <div className="absolute top-1/2 -translate-y-1/2 bg-slate-800 p-2 rounded-full border-2 border-slate-600 z-10"><ArrowRightLeft className="text-white w-4 h-4" /></div>
                                    <div className="h-full w-[1px] bg-slate-700"></div>
                                </div>
                                <div className={cn("flex-1 h-full", mobileTab === 'target' ? "block" : "hidden md:block")}>
                                    <TradeSide side="target" inventory={targetInventory} offerItems={targetOfferItems} offerPc={targetOfferPc} setOfferPc={setTargetOfferPc} />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
                            <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                                <div className={cn("p-2 rounded-full border-2", isFair ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500 animate-pulse")}>
                                    <Scale className={isFair ? "text-green-400" : "text-red-400"} size={20} />
                                </div>
                                <div>
                                    <p className="font-press text-[8px] md:text-[10px] text-slate-400 mb-1">BALANÇA DA JUSTIÇA</p>
                                    <div className="flex items-center gap-2">
                                        {isFair ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}
                                        <p className={cn("font-vt323 text-xl md:text-2xl leading-none", isFair ? "text-green-400" : "text-red-400")}>
                                            {isFair ? "JUSTO" : "DESBALANCEADO"} ({(fairnessRatio * 100).toFixed(0)}%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <PixelButton onClick={handleSubmit} disabled={!isFair || loading} className={cn("w-full md:w-auto px-8 py-4", !isFair ? "bg-slate-700 cursor-not-allowed text-slate-500" : "bg-green-600 hover:bg-green-500 text-white")}>
                                {loading ? "ENVIANDO..." : "ENVIAR PROPOSTA"}
                            </PixelButton>
                        </div>
                    </PixelCard>
                </div>
            )}
        </AnimatePresence>
    );
}