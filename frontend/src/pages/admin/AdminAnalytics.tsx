import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Activity, PieChart as PieIcon,
    Loader2, AlertCircle, Microscope, GraduationCap, Star,
    Wallet, Globe, ChevronDown, Calendar
} from 'lucide-react';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { SurveyAnalyticsSection } from './components/SurveyAnalyticsSection';

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────
interface AnalyticsData {
    interactionsByDay: { date: string; total: number }[];
    performanceByMode: { modo: string; avgN1: number; avgN2: number; avgRedacao: number; avgEnem: number }[];
    distributionByMode: { name: string; value: number }[];
    distributionByRating: { name: string; value: number }[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444'];
const renderCustomizedLabel = ({ name, percent }: { name?: string; percent?: number }) => {
    if (!name || !percent) return `${name || 'N/A'}: 0%`;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
};

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
    const { data, isLoading, error } = useQuery<AnalyticsData>({
        queryKey: ['admin', 'analytics'],
        queryFn: async () => {
            const response = await api.get('/admin/analytics');
            return response.data;
        }
    });

    const [activeTab, setActiveTab] = React.useState<'education' | 'financial' | 'performance' | 'general'>('education');
    const [selectedSurveyId, setSelectedSurveyId] = React.useState<string | null>(null);

    const { data: surveys } = useQuery<any[]>({
        queryKey: ['admin', 'surveys', 'list'],
        queryFn: async () => {
            const res = await api.get('/surveys/list');
            return res.data;
        }
    });

    // Mapeamento de abas
    const tabs = [
        { id: 'education', label: 'Educação', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'financial', label: 'Mercado', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'performance', label: 'Desempenho', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'general', label: 'Outros', icon: Globe, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    ] as const;

    // Filtra pesquisas pela aba ativa
    const filteredSurveys = React.useMemo(() => {
        return surveys?.filter(s => (s.category || 'general') === activeTab) || [];
    }, [surveys, activeTab]);

    // Auto-seleciona a pesquisa mais recente ao trocar de aba
    React.useEffect(() => {
        if (filteredSurveys.length > 0) {
            // Se não houver seleção ou a seleção atual não estiver na aba nova, pega a primeira
            if (!selectedSurveyId || !filteredSurveys.find(s => s._id === selectedSurveyId)) {
                setSelectedSurveyId(filteredSurveys[0]._id);
            }
        } else {
            setSelectedSurveyId(null);
        }
    }, [filteredSurveys, selectedSurveyId]);

    const activeSurvey = surveys?.find(s => s._id === selectedSurveyId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="font-press text-[10px] text-purple-400 uppercase">Analisando dados científicos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-rose-400">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-press text-[10px] uppercase">Erro ao carregar laboratório de dados.</p>
            </div>
        );
    }

    return (

        <AdminLayout>
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                    <Microscope size={24} className="text-purple-400" />
                </div>
                <div>
                    <h1 className="font-vt323 text-4xl text-white leading-none">Dashboard Jovem Cientista</h1>
                    <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                        Análise de Impacto da IA no Rendimento Acadêmico
                    </p>
                </div>
            </div>

            {/* Grid de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Uso Diário do GIL */}
                <ChartCard title="Uso Diário do Oráculo GIL" icon={Activity} subtitle="Volume de interações por dia">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data?.interactionsByDay || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                itemStyle={{ color: '#8b5cf6', fontSize: '12px' }}
                            />
                            <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 2. Performance por Modo */}
                <ChartCard title="Performance por Modo de Uso" icon={GraduationCap} subtitle="Média de notas (N1/N2) por categoria de IA">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data?.performanceByMode || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="modo" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} domain={[0, 10]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Bar dataKey="avgN1" name="Média N1" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="avgN2" name="Média N2" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 3. Distribuição de Modos */}
                <ChartCard title="Distribuição de Modos" icon={PieIcon} subtitle="Preferência de interação dos alunos">
                    <div className="flex flex-col md:flex-row items-center justify-around">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data?.distributionByMode || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data?.distributionByMode.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* 4. Satisfação do Aluno */}
                <ChartCard title="Avaliação do Oráculo" icon={Star} subtitle="Feedback direto dos alunos (1-5 estrelas)">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data?.distributionByRating || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                labelLine={false}
                                label={renderCustomizedLabel}
                                dataKey="value"
                            >
                                {data?.distributionByMode.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Hub de Pesquisa Científica (Jovem Cientista) */}
            <div className="mt-12 pt-12 border-t border-slate-800/50">
                <div className="mb-8">
                    <h2 className="font-press text-[12px] text-white uppercase mb-6 flex items-center gap-3">
                        <Microscope className="text-purple-400" size={18} />
                        Laboratório de Pesquisas Comparativas
                    </h2>

                    {/* Tabs de Categoria */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300",
                                    activeTab === tab.id
                                        ? `bg-slate-800 border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]`
                                        : "bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                                )}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? tab.color : ""} />
                                <span className={cn("font-vt323 text-lg", activeTab === tab.id ? "text-white" : "")}>
                                    {tab.label}
                                </span>
                                {(surveys?.filter(s => (s.category || 'general') === tab.id)?.length || 0) > 0 && (
                                    <span className="w-5 h-5 flex items-center justify-center bg-slate-700 rounded-full text-[9px] font-press text-white">
                                        {surveys?.filter(s => (s.category || 'general') === tab.id)?.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Seletor de Pesquisa (Histórico) */}
                    {filteredSurveys.length > 0 && (
                        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-3xl flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="font-press text-[7px] text-slate-500 uppercase">Selecione o Estudo</p>
                                    <div className="relative mt-1">
                                        <select
                                            value={selectedSurveyId || ''}
                                            onChange={(e) => setSelectedSurveyId(e.target.value)}
                                            className="bg-transparent text-white font-vt323 text-2xl outline-none pr-8 appearance-none cursor-pointer hover:text-purple-400 transition-colors"
                                        >
                                            {filteredSurveys.map((s) => (
                                                <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                                                    [{new Date(s.createdAt).toLocaleDateString()}] {s.title} {s.isActive ? '(ATIVA)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                            {activeSurvey?.isActive && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="font-press text-[7px] text-emerald-400 uppercase">Coleta Ativa</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Área de Visualização */}
                {selectedSurveyId ? (
                    <SurveyAnalyticsSection surveyId={selectedSurveyId} />
                ) : (
                    <div className="p-20 bg-slate-900/20 border border-slate-800/50 border-dashed rounded-[3rem] text-center">
                        <Globe className="mx-auto text-slate-800 mb-6" size={48} />
                        <h3 className="font-vt323 text-3xl text-slate-600 mb-2">Sem dados nesta categoria</h3>
                        <p className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">
                            Inicie uma nova pesquisa científica de {tabs.find(t => t.id === activeTab)?.label} para começar.
                        </p>
                    </div>
                )}
            </div>

        </div>
        </div>
        </AdminLayout>
    );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: Card de Gráfico
// ─────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, icon: Icon, children, className }: any) {
    return (
        <div className={cn(
            "bg-black/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm",
            "hover:border-slate-700 transition-all duration-300",
            className
        )}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800/50 rounded-xl">
                    <Icon size={18} className="text-slate-400" />
                </div>
                <div>
                    <h3 className="font-press text-[10px] text-white uppercase">{title}</h3>
                    <p className="font-mono text-[9px] text-slate-500 mt-1 uppercase">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
