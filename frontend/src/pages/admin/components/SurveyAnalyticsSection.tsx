import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Microscope, Loader2, AlertCircle, Info } from 'lucide-react';
import { api } from '../../../api/axios-config';
import { cn } from '../../../utils/cn';

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#eab308', '#22c55e', '#ef4444'];

interface SurveyStat {
    qid: string;
    text: string;
    type: string;
    data: { name: string; value: number }[];
    average?: string;
}

interface AnalyticsRes {
    total: number;
    stats: SurveyStat[];
}

export function SurveyAnalyticsSection({ surveyId }: { surveyId: string }) {
    const { data, isLoading, error } = useQuery<AnalyticsRes>({
        queryKey: ['admin', 'survey-analytics', surveyId],
        queryFn: async () => {
            const res = await api.get(`/surveys/analytics/${surveyId}`);
            return res.data;
        },
        enabled: !!surveyId
    });

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
    if (error || !data) return <div className="p-8 text-rose-400 flex gap-2 items-center"><AlertCircle size={20}/> Erro ao carregar dados da pesquisa.</div>;

    if (data.total === 0) {
        return (
            <div className="p-12 bg-slate-900/40 border border-slate-800 rounded-3xl text-center">
                <Info className="mx-auto text-slate-500 mb-4" size={32} />
                <p className="font-press text-[10px] text-slate-500 uppercase">Nenhuma resposta coletada ainda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-vt323 text-4xl text-white">Resultados da Pesquisa Científica</h2>
                    <p className="font-mono text-[10px] text-purple-400 uppercase tracking-widest mt-1">
                        Base de Dados: {data.total} participações validadas
                    </p>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <span className="font-press text-[10px] text-purple-400">STATUS: SINCRONIZADO</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.stats.map((stat, idx) => (
                    <motion.div 
                        key={stat.qid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-slate-800 p-6 rounded-[2rem] backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <h3 className="font-vt323 text-xl text-slate-200 leading-tight">
                                <span className="text-purple-500 mr-2">#{idx + 1}</span>
                                {stat.text}
                            </h3>
                            {stat.average && (
                                <div className="flex flex-col items-end">
                                    <span className="text-emerald-400 font-press text-[12px]">{stat.average}</span>
                                    <span className="text-[8px] font-mono text-slate-500 uppercase">Média</span>
                                </div>
                            )}
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {stat.type === 'rating' || stat.data.length > 4 ? (
                                    <BarChart data={stat.data} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                ) : (
                                    <PieChart>
                                        <Pie
                                            data={stat.data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stat.data.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

const motion = { div: ({ children, className, initial, animate }: any) => <div className={cn(className)}>{children}</div> }; // Simples mockup de motion para compatibilidade
