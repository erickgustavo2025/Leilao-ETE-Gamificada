// frontend/src/pages/admin/AdminConfig.tsx
import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { Save, Lock, ShieldAlert, KeyRound, Globe, Image as ImageIcon, Upload, Power, MessageSquare, Ghost } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';
import { api } from '../../api/axios-config';
import { queryKeys } from '../../utils/queryKeys';

interface ConfigData {
    siteName: string;
    landingMessage: string;
    vipCode: string;
    maintenanceMode: boolean;
    logoUrl: string;
    becoDiagonalOpen: boolean; // ✅ RELATÓRIO 1.1: Nova propriedade
}

export function AdminConfig() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ GET Config
    const { data: config, isLoading: fetching } = useQuery<ConfigData>({
        queryKey: queryKeys.admin.config,
        queryFn: async () => {
            const { data } = await api.get('/admin/config');
            return {
                siteName: data.siteName || '',
                landingMessage: data.landingMessage || '',
                vipCode: data.vipCode || '',
                maintenanceMode: data.maintenanceMode || false,
                logoUrl: data.logoUrl || '',
                becoDiagonalOpen: data.becoDiagonalOpen ?? true, // ✅ RELATÓRIO 1.2: Fallback true
            };
        }
    });

    // ✅ UPDATE Config Mutation
    const updateConfigMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await api.put('/admin/config', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: (_data: any) => {
            toast.success('Sistema atualizado com sucesso!');

            // ✅ RELATÓRIO 1.4: Invalida admin + public para refletir em todo sistema
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
            queryClient.invalidateQueries({ queryKey: queryKeys.public.config });
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao salvar configurações.');
        }
    });

    // 📝 Form Handler
    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        formData.append('maintenanceMode', String(config?.maintenanceMode || false));
        formData.append('becoDiagonalOpen', String(config?.becoDiagonalOpen ?? true));

        updateConfigMutation.mutate(formData);
    };

    // 🔄 Toggle Maintenance Mode (Optimistic Update)
    const toggleMaintenance = () => {
        if (!config) return;

        const newValue = !config.maintenanceMode;

        queryClient.setQueryData<ConfigData>(queryKeys.admin.config, (old) =>
            old ? { ...old, maintenanceMode: newValue } : old
        );

        const formData = new FormData();
        formData.append('maintenanceMode', String(newValue));

        updateConfigMutation.mutate(formData, {
            onError: () => {
                queryClient.setQueryData<ConfigData>(queryKeys.admin.config, (old) =>
                    old ? { ...old, maintenanceMode: !newValue } : old
                );
            }
        });
    };

    // ✅ RELATÓRIO 1.3: Toggle Beco Diagonal (Optimistic Update)
    const toggleBecoDiagonal = () => {
        if (!config) return;

        const newValue = !config.becoDiagonalOpen;

        // Optimistic update local
        queryClient.setQueryData<ConfigData>(queryKeys.admin.config, (old) =>
            old ? { ...old, becoDiagonalOpen: newValue } : old
        );

        const formData = new FormData();
        formData.append('becoDiagonalOpen', String(newValue));

        updateConfigMutation.mutate(formData, {
            onSuccess: () => {
                toast.success(
                    newValue
                        ? '🛒 Beco Diagonal ABERTO para os alunos!'
                        : '🔒 Beco Diagonal FECHADO pelo Ministério!'
                );
                // ✅ RELATÓRIO 1.4: Invalida cache admin + public
                queryClient.invalidateQueries({ queryKey: queryKeys.admin.config });
                queryClient.invalidateQueries({ queryKey: queryKeys.public.config });
            },
            onError: () => {
                // Reverte em caso de erro
                queryClient.setQueryData<ConfigData>(queryKeys.admin.config, (old) =>
                    old ? { ...old, becoDiagonalOpen: !newValue } : old
                );
                toast.error('Erro ao alterar status do Beco Diagonal.');
            }
        });
    };

    if (fetching) {
        return (
            <AdminLayout>
                <PageTransition>
                    <div className="text-center py-20 text-slate-500 font-press animate-pulse">
                        CARREGANDO SISTEMA...
                    </div>
                </PageTransition>
            </AdminLayout>
        );
    }

    if (!config) return null;

    return (
        <AdminLayout>
            <PageTransition>
                <div className="space-y-6 pb-20">
                    {/* HEADER */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                            <ShieldAlert className="text-yellow-500" size={32} />
                        </div>
                        <div>
                            <h1 className="font-vt323 text-4xl text-white">PAINEL DE CONTROLE GLOBAL</h1>
                            <p className="font-mono text-xs text-slate-400">Defina a identidade e segurança do sistema</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* COLUNA 1: IDENTIDADE VISUAL */}
                        <div className="space-y-6">
                            <h2 className="font-press text-xs text-purple-400 mb-2 flex items-center gap-2">
                                <Globe size={16} /> IDENTIDADE VISUAL
                            </h2>

                            <PixelCard className="p-6 space-y-6 bg-slate-900/50">
                                {/* LOGO UPLOAD */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-slate-500 uppercase">Logo do Sistema</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50 group"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            name="file"
                                            className="hidden"
                                            accept="image/*"
                                        />

                                        {config.logoUrl ? (
                                            <div className="relative">
                                                <img src={getImageUrl(config.logoUrl)} alt="Preview" className="h-24 w-24 object-contain mb-2 drop-shadow-lg" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                                    <Upload className="text-white" size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <ImageIcon className="mx-auto text-slate-600 mb-2 group-hover:text-purple-400" size={32} />
                                                <span className="text-xs text-slate-500">Clique para enviar logo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* NOME DO SITE */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-slate-500 uppercase">Nome do Evento/Site</label>
                                    <input
                                        type="text"
                                        name="siteName"
                                        defaultValue={config.siteName}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white font-vt323 text-xl focus:border-purple-500 outline-none"
                                        placeholder="Ex: GINCANA 2026"
                                    />
                                </div>

                                {/* MENSAGEM DA LANDING PAGE */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-2">
                                        <MessageSquare size={12} /> Frase de Impacto (Landing Page)
                                    </label>
                                    <input
                                        type="text"
                                        name="landingMessage"
                                        defaultValue={config.landingMessage}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:border-purple-500 outline-none"
                                        placeholder="Ex: Transformando educação em conquista."
                                    />
                                </div>
                            </PixelCard>
                        </div>

                        {/* COLUNA 2: SEGURANÇA E SISTEMA */}
                        <div className="space-y-6">
                            <h2 className="font-press text-xs text-yellow-500 mb-2 flex items-center gap-2">
                                <Lock size={16} /> SEGURANÇA & SISTEMA
                            </h2>

                            <PixelCard className="p-6 space-y-6 bg-slate-900/50">
                                {/* VIP CODE */}
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] text-slate-500 uppercase">Código VIP Secreto</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="text"
                                            name="vipCode"
                                            defaultValue={config.vipCode}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 pl-10 text-white font-mono tracking-widest focus:border-yellow-500 outline-none uppercase"
                                            placeholder="VIP-2026-XYZ"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                        * Compartilhe apenas com alunos merecedores.
                                    </p>
                                </div>

                                <div className="h-px bg-slate-800 my-4" />

                                {/* MODO MANUTENÇÃO */}
                                <div className={cn(
                                    "p-4 rounded-xl border-2 transition-all duration-300",
                                    config.maintenanceMode
                                        ? "bg-red-900/20 border-red-500/50"
                                        : "bg-green-900/10 border-green-500/30"
                                )}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className={cn(
                                            "font-press text-sm flex items-center gap-2",
                                            config.maintenanceMode ? "text-red-400" : "text-green-400"
                                        )}>
                                            <Power size={18} />
                                            {config.maintenanceMode ? "MODO MANUTENÇÃO ATIVO" : "SISTEMA ONLINE"}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={toggleMaintenance}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                                config.maintenanceMode ? "bg-red-500" : "bg-slate-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300",
                                                config.maintenanceMode ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                        {config.maintenanceMode
                                            ? "⚠️ O acesso de alunos está BLOQUEADO. Apenas Admins e Devs podem entrar."
                                            : "✅ O sistema está aberto para todos os alunos."}
                                    </p>
                                </div>

                                {/* ✅ RELATÓRIO 1.3: BECO DIAGONAL TOGGLE */}
                                <div className={cn(
                                    "p-4 rounded-xl border-2 transition-all duration-300",
                                    config.becoDiagonalOpen
                                        ? "bg-purple-900/20 border-purple-500/50"
                                        : "bg-slate-900/30 border-slate-700/50"
                                )}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className={cn(
                                            "font-press text-sm flex items-center gap-2",
                                            config.becoDiagonalOpen ? "text-purple-400" : "text-slate-500"
                                        )}>
                                            <Ghost size={18} />
                                            {config.becoDiagonalOpen ? "BECO DIAGONAL ABERTO" : "BECO DIAGONAL FECHADO"}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={toggleBecoDiagonal}
                                            disabled={updateConfigMutation.isPending}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-colors duration-300 disabled:opacity-50",
                                                config.becoDiagonalOpen ? "bg-purple-500" : "bg-slate-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300",
                                                config.becoDiagonalOpen ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                        {config.becoDiagonalOpen
                                            ? "👻 Alunos podem acessar a seção Beco da loja."
                                            : "🔒 A aba Beco está oculta para todos os alunos."}
                                    </p>
                                </div>
                            </PixelCard>

                            {/* BOTÃO SALVAR */}
                            <div className="pt-4">
                                <PixelButton
                                    type="submit"
                                    isLoading={updateConfigMutation.isPending}
                                    className="w-full bg-blue-600 hover:bg-blue-500 py-4 text-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                >
                                    <Save size={18} className="mr-2" />
                                    SALVAR CONFIGURAÇÕES GLOBAIS
                                </PixelButton>
                            </div>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </AdminLayout>
    );
}
