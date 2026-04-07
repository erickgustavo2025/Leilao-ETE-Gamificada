import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Activity, PieChart as PieIcon,
    Loader2, AlertCircle, Microscope, GraduationCap, Star
} from 'lucide-react';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { AdminLayout } from '../../components/layout/AdminLayout';

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

        </div>
        </div >
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
