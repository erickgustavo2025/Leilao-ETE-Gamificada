import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3, 
  ArrowRightLeft,
  PieChart,
  ShieldCheck,
  
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import { api } from '../../api/axios-config';
import { AdminLayout } from '../../components/layout/AdminLayout';

interface EconomyStats {
  monetaryMass: number;
  transactionVolume: number;
  transactionCount: number;
  topRich: any[];
  startupStats: any[];
  volumeByType: any[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export function AdminEconomy() {
  const { data, isLoading, error } = useQuery<EconomyStats>({
    queryKey: ['admin', 'economy', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/economy/stats');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 text-white font-press animate-pulse">CARREGANDO DADOS ECONÔMICOS...</div>;
  if (error) return <div className="p-8 text-red-500 font-press">ERRO AO CARREGAR PAINEL.</div>;

  const { monetaryMass, transactionVolume, transactionCount, topRich, startupStats, volumeByType } = data!;

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-press text-white">PAINEL DE ECONOMIA</h1>
            <p className="text-slate-400 font-mono text-sm uppercase">Monitoramento em tempo real da massa monetária e transações</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 border border-blue-500/30 rounded-lg">
            <ShieldCheck className="text-blue-400" />
            <div className="font-mono text-[10px] text-slate-300">
              <p>STATUS DO SISTEMA</p>
              <p className="text-blue-400 font-bold">AUDITORIA ATIVA</p>
            </div>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="MASSA MONETÁRIA TOTAL" 
            value={`${monetaryMass.toLocaleString()} PC$`} 
            subtitle="Soma de todos os saldos de alunos"
            icon={DollarSign}
            color="blue"
          />
          <StatCard 
            title="VOLUME TRANSACIONADO" 
            value={`${transactionVolume.toLocaleString()} PC$`} 
            subtitle="Volume bruto nos últimos 30 dias"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard 
            title="TOTAL DE OPERAÇÕES" 
            value={transactionCount.toString()} 
            subtitle="Quantidade de transações (30d)"
            icon={ArrowRightLeft}
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico: Volume por Tipo */}
          <ChartCard title="Volume por Tipo de Operação" icon={BarChart3}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="_id" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.replace('INVESTMENT_', '')} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Gráfico: Status das Startups */}
          <ChartCard title="Mercado de Startups" icon={PieChart}>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={startupStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {startupStats.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="w-1/3 space-y-2">
                {startupStats.map((s, i) => (
                  <div key={s._id} className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="uppercase">{s._id}: {s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Ranking de Riqueza */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
            <h3 className="font-press text-xs text-white flex items-center gap-2">
              <Users size={16} className="text-blue-400" /> TOP 10 - MAIS RICOS (ESTUDANTES)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-slate-900/80 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Posição</th>
                  <th className="px-6 py-3">Aluno</th>
                  <th className="px-6 py-3">Matrícula</th>
                  <th className="px-6 py-3">Turma</th>
                  <th className="px-6 py-3 text-right">Saldo PC$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topRich.map((u, i) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-press text-blue-500 text-xs">#{i + 1}</td>
                    <td className="px-6 py-4 text-white font-bold">{u.nome}</td>
                    <td className="px-6 py-4 text-slate-400">{u.matricula}</td>
                    <td className="px-6 py-4 text-slate-400">{u.turma}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-bold">{u.saldoPc.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    purple: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} space-y-2`}>
      <div className="flex items-center justify-between">
        <p className="font-press text-[10px] uppercase tracking-tighter opacity-80">{title}</p>
        <Icon size={20} className="opacity-60" />
      </div>
      <p className="text-3xl font-mono font-bold tracking-tight text-white">{value}</p>
      <p className="text-[10px] font-mono text-slate-500 uppercase">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Icon size={18} className="text-blue-400" />
        <h3 className="font-press text-xs text-white uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}
