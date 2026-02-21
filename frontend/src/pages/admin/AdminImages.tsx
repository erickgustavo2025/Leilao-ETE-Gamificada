import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Image as ImageIcon, Store, Users, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';
import { PageTransition } from '../../components/layout/PageTransition';

// --- Interfaces Alinhadas com o Backend ---
interface ImageDoc { name: string; url: string; size: string; createdAt: string; }
interface StoreItem { _id: string; nome: string; imagem: string; isHouseItem: boolean; }
interface Classroom { _id: string; serie: string; nome: string; logo: string; }

type TabType = 'GALERIA' | 'ITENS' | 'TURMAS';

export function AdminImages() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Controle de Abas e Upload Centralizado
    const [activeTab, setActiveTab] = useState<TabType>('ITENS');
    const [uploadTarget, setUploadTarget] = useState<{ type: TabType, id?: string } | null>(null);

    // ==================== QUERIES ====================
    // 1. Galeria Raw (CORRIGIDO PARA /admin/images)
    const { data: images = [], isLoading: loadImg } = useQuery<ImageDoc[]>({
        queryKey: ['adminImagesRaw'],
        queryFn: async () => (await api.get('/admin/images')).data
    });

    // 2. Itens (Loja e Beco)
    const { data: items = [], isLoading: loadItems } = useQuery<StoreItem[]>({
        queryKey: ['adminImagesItems'],
        queryFn: async () => (await api.get('/store/items')).data
    });

    // 3. Turmas (Casas)
    const { data: classes = [], isLoading: loadClasses } = useQuery<Classroom[]>({
        queryKey: ['adminImagesClasses'],
        queryFn: async () => (await api.get('/classrooms')).data
    });

    // ==================== MUTATIONS ====================
    
    // 🔥 UPLOAD MÁGICO
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            
            if (uploadTarget?.type === 'ITENS' && uploadTarget.id) {
                formData.append('imagem', file); 
                return await api.put(`/store/items/${uploadTarget.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } 
            else if (uploadTarget?.type === 'TURMAS' && uploadTarget.id) {
                formData.append('logo', file); 
                return await api.put(`/admin/classes/${uploadTarget.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } 
            else {
                // Upload Genérico para a Galeria
                // CORRIGIDO PARA 'file' e ROTA '/admin/images'
                formData.append('file', file);
                return await api.post('/admin/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
        },
        onSuccess: () => {
            toast.success("Imagem atualizada com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['adminImagesRaw'] });
            queryClient.invalidateQueries({ queryKey: ['adminImagesItems'] });
            queryClient.invalidateQueries({ queryKey: ['adminImagesClasses'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'store', 'items'] });
        },
        onError: () => toast.error("Erro ao processar o upload da imagem."),
        onSettled: () => {
            setUploadTarget(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    });

    // 🗑️ DELETE MUTATION (CORRIGIDO PARA O NOME DO ARQUIVO)
    const deleteMutation = useMutation({
        mutationFn: async (filename: string) => await api.delete(`/admin/images/${filename}`),
        onSuccess: () => {
            toast.success("Imagem apagada do servidor.");
            queryClient.invalidateQueries({ queryKey: ['adminImagesRaw'] });
        },
        onError: () => toast.error("Erro ao deletar imagem.")
    });

    // ==================== HANDLERS ====================
    const triggerUpload = (type: TabType, id?: string) => {
        setUploadTarget({ type, id });
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
    };

    const handleDelete = (filename: string) => {
        if (!confirm("Tem certeza? Se algum item ainda estiver usando essa imagem, ele ficará sem foto!")) return;
        deleteMutation.mutate(filename);
    };

    return (
        <AdminLayout>
            <PageTransition>
                
                {/* INPUT ESCONDIDO */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                <div className="max-w-7xl mx-auto space-y-6 pb-20">
                    
                    {/* HEADER & ABAS */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h1 className="font-vt323 text-4xl text-white uppercase tracking-widest flex items-center gap-3">
                                <ImageIcon className="text-purple-500" /> CENTRAL DE MÍDIA
                            </h1>
                            <p className="font-mono text-xs text-slate-400">Gerencie o visual de todos os elementos do sistema.</p>
                        </div>

                        <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                            {[
                                { id: 'ITENS', label: 'LOJA / BECO', icon: Store },
                                { id: 'TURMAS', label: 'BRASÕES', icon: Users },
                                { id: 'GALERIA', label: 'ARQUIVOS RAW', icon: ImageIcon }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded text-xs font-press transition-colors",
                                        activeTab === tab.id ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* STATUS DE UPLOAD */}
                    <AnimatePresence>
                        {uploadMutation.isPending && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                                className="bg-purple-900/50 border border-purple-500/50 text-purple-200 p-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                                <Loader2 className="animate-spin" /> PROCESSANDO IMAGEM NA REDE...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CONTEÚDO DINÂMICO */}
                    <div className="min-h-[50vh]">
                        
                        {/* 🛒 ABA: ITENS (LOJA & BECO) */}
                        {activeTab === 'ITENS' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {loadItems ? <p className="text-slate-500 font-press text-xs col-span-full">CARREGANDO ITENS...</p> : items.map(item => (
                                    <PixelCard key={item._id} className="p-0 overflow-hidden group cursor-pointer border-slate-800 hover:border-purple-500 transition-colors" onClick={() => triggerUpload('ITENS', item._id)}>
                                        <div className="aspect-square bg-black relative flex items-center justify-center p-2">
                                            <img src={getImageUrl(item.imagem)} alt={item.nome} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/store.png'; }} />
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                                <Upload className="text-white mb-2" size={24} />
                                                <span className="font-press text-[8px] text-white text-center px-2">ALTERAR IMAGEM</span>
                                            </div>
                                            {item.isHouseItem && <div className="absolute top-0 right-0 bg-purple-600 text-[8px] font-press px-1 rounded-bl">BECO</div>}
                                        </div>
                                        <div className="p-2 border-t border-slate-800 bg-slate-900/50">
                                            <p className="font-vt323 text-lg text-white truncate text-center leading-none">{item.nome}</p>
                                        </div>
                                    </PixelCard>
                                ))}
                            </div>
                        )}

                        {/* 🛡️ ABA: TURMAS (BRASÕES) */}
                        {activeTab === 'TURMAS' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {loadClasses ? <p className="text-slate-500 font-press text-xs col-span-full">CARREGANDO TURMAS...</p> : classes.map(cls => (
                                    <PixelCard key={cls._id} className="p-0 overflow-hidden group cursor-pointer border-slate-800 hover:border-yellow-500 transition-colors" onClick={() => triggerUpload('TURMAS', cls._id)}>
                                        <div className="aspect-video bg-black relative flex items-center justify-center p-4">
                                            <img src={getImageUrl(cls.logo)} alt={cls.nome} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/etegamificada.png'; }} />
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                                <Upload className="text-yellow-400 mb-2" size={24} />
                                                <span className="font-press text-[8px] text-yellow-400 text-center px-2">ATUALIZAR BRASÃO</span>
                                            </div>
                                        </div>
                                        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
                                            <p className="font-vt323 text-2xl text-white truncate leading-none">{cls.serie}</p>
                                            <p className="font-mono text-[10px] text-slate-500 truncate">{cls.nome}</p>
                                        </div>
                                    </PixelCard>
                                ))}
                            </div>
                        )}

                        {/* 🖼️ ABA: GALERIA GERAL (Com opção de apagar) */}
                        {activeTab === 'GALERIA' && (
                            <>
                                <button onClick={() => triggerUpload('GALERIA')} className="mb-6 w-full py-6 border-2 border-dashed border-slate-700 rounded-2xl hover:border-purple-500 hover:bg-purple-900/10 transition-colors flex flex-col items-center justify-center gap-2 group">
                                    <Upload className="text-slate-500 group-hover:text-purple-400" size={32} />
                                    <span className="font-press text-xs text-slate-400 group-hover:text-purple-300">UPLOAD DE ARQUIVO LIVRE</span>
                                </button>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {loadImg ? <p className="text-slate-500 font-press text-xs col-span-full">CARREGANDO RAW...</p> : images.map(img => (
                                        // CORREÇÃO: key e dados usando img.name, pois o backend não envia _id aqui
                                        <PixelCard key={img.name} className="p-0 overflow-hidden relative group aspect-square border-slate-800 hover:border-red-500 transition-colors">
                                            
                                            {/* Imagem em si */}
                                            <div className="w-full h-full bg-black/60 flex items-center justify-center p-3">
                                                <img src={getImageUrl(img.url)} alt={img.name} className="max-w-full max-h-full object-contain group-hover:opacity-30 transition-opacity" />
                                            </div>
                                            
                                            {/* Overlay de Ação (Aparece no Hover) */}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <p className="text-[9px] font-mono text-slate-300 truncate mb-3 text-center">
                                                    {img.name}
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(img.name); }}
                                                    disabled={deleteMutation.isPending}
                                                    className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-[10px] font-press flex items-center justify-center gap-2 transition-transform active:scale-95"
                                                >
                                                    <Trash2 size={14} /> APAGAR
                                                </button>
                                            </div>
                                        </PixelCard>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </PageTransition>
        </AdminLayout>
    );
}