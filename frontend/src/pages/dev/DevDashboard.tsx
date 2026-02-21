import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    motion,
    useMotionValue,
    useSpring,
    useMotionTemplate,
} from 'framer-motion';
import {
    Terminal, Activity, ShieldAlert, Lock, Database, AlertOctagon,
    Power, RefreshCw, LogOut, Search,
    Wallet, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type LogCategory = 'ALL' | 'AUTH' | 'SECURITY' | 'ECONOMY' | 'SHOP' | 'AUCTION' | 'SYSTEM';

interface MaintenanceState {
    student: boolean;
    global: boolean;
}

interface DevStats {
    usersCount: number;
    errorsToday: number;
    totalMoney: number;
    status: string;
    maintenance: MaintenanceState;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function useIsMobile() {
    const [mobile, setMobile] = useState(false);
    useEffect(() => {
        const check = () => setMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return mobile;
}

function categorizeLog(action: string): { category: LogCategory; level: 'info' | 'warn' | 'error' | 'success' } {
    const act = (action || '').toUpperCase();
    if (act.includes('ERROR') || act.includes('FAIL') || act.includes('DENIED') || act.includes('ATTACK') || act.includes('IMPERSONATE') || act.includes('BLOCK') || act.includes('FORBIDDEN') || act.includes('UNAUTHORIZED'))
        return { category: 'SECURITY', level: 'error' };
    if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('LOGOUT') || act.includes('FIRST_ACCESS'))
        return { category: 'AUTH', level: act.includes('FAIL') ? 'error' : 'success' };
    if (act.includes('PIX') || act.includes('TRANSFER') || act.includes('FUNDS') || act.includes('SALDO') || act.includes('POINTS') || act.includes('GIVE_ITEM'))
        return { category: 'ECONOMY', level: 'info' };
    if (act.includes('BUY') || act.includes('COMPRA') || act.includes('SELL') || act.includes('VENDA') || act.includes('MARKET'))
        return { category: 'SHOP', level: 'info' };
    if (act.includes('BID') || act.includes('LANCE') || act.includes('WINNER') || act.includes('AUCTION'))
        return { category: 'AUCTION', level: 'success' };
    if (act.includes('MAINTENANCE') || act.includes('SYSTEM') || act.includes('CONFIG') || act.includes('CRON'))
        return { category: 'SYSTEM', level: 'warn' };
    return { category: 'SYSTEM', level: 'info' };
}

const CATEGORY_COLORS: Record<string, { dot: string; text: string; border: string; bg: string }> = {
    ALL:      { dot: 'bg-green-400',  text: 'text-green-400',  border: 'border-green-500/40', bg: 'bg-green-500/10' },
    AUTH:     { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
    SECURITY: { dot: 'bg-red-400',    text: 'text-red-400',    border: 'border-red-500/40',   bg: 'bg-red-500/10' },
    ECONOMY:  { dot: 'bg-amber-400',  text: 'text-amber-400',  border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
    SHOP:     { dot: 'bg-cyan-400',   text: 'text-cyan-400',   border: 'border-cyan-500/40',  bg: 'bg-cyan-500/10' },
    AUCTION:  { dot: 'bg-purple-400', text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
    SYSTEM:   { dot: 'bg-slate-400',  text: 'text-slate-400',  border: 'border-slate-500/40', bg: 'bg-slate-500/10' },
};

const LEVEL_BORDER: Record<string, string> = {
    error:   'border-l-red-500',
    warn:    'border-l-amber-500',
    success: 'border-l-emerald-500',
    info:    'border-l-cyan-500/40',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DevDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'maintenance'>('dashboard');
    const [logFilter, setLogFilter] = useState<LogCategory>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const { logout } = useAuth();
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    // ── PC-only spotlight ──
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30 });
    const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30 });
    const spotlight = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(34,197,94,0.06), transparent 60%)`;

    useEffect(() => {
        if (isMobile) return;
        const onMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [isMobile, mouseX, mouseY]);

    // ==================== QUERIES ====================
    
    const { data: stats = {
        usersCount: 0, errorsToday: 0, totalMoney: 0,
        status: 'CHECKING...', maintenance: { student: false, global: false }
    }, refetch: refetchStats } = useQuery({
        queryKey: ['devStats'],
        queryFn: async () => {
            const res = await api.get('/dev/stats');
            return res.data as DevStats;
        },
        refetchInterval: 5000,
        staleTime: 3000,
    });

    const { data: logs = [], refetch: refetchLogs } = useQuery({
        queryKey: ['devLogs'],
        queryFn: async () => {
            const res = await api.get('/dev/logs');
            return res.data;
        },
        refetchInterval: 5000,
        staleTime: 3000,
    });

    // ==================== MUTATIONS ====================
    
    const maintenanceMutation = useMutation({
        mutationFn: async ({ type, status }: { type: 'student' | 'global'; status: boolean }) => {
            return await api.post('/dev/maintenance', { type, status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devStats'] });
        }
    });

    // ==================== HANDLERS ====================

    const handleRefresh = () => {
        refetchStats();
        refetchLogs();
    };

    const toggleMaintenance = (type: 'student' | 'global') => {
        const currentStatus = type === 'student' ? stats.maintenance.student : stats.maintenance.global;
        maintenanceMutation.mutate({ type, status: !currentStatus });
    };

    useEffect(() => {
        if (activeTab === 'logs' && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, activeTab]);

    const handleLogout = () => { logout(); navigate('/'); };

    // ==================== DERIVAÇÕES ====================
    
    const formatMoney = (val: number) =>
        val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;

    const filteredLogs = logs
        .map((log: any) => {
            const { category, level } = categorizeLog(log.action);
            return { ...log, category, level };
        })
        .filter((log: any) => {
            const matchCat = logFilter === 'ALL' || log.category === logFilter;
            const term = searchTerm.toLowerCase();
            const matchSearch =
                (log.details || '').toLowerCase().includes(term) ||
                (log.action || '').toLowerCase().includes(term) ||
                (log.user?.nome || 'Sistema').toLowerCase().includes(term);
            return matchCat && matchSearch;
        });

    // ── Tabs config ──
    const TABS = [
        { id: 'dashboard' as const, icon: Activity, label: 'OVERVIEW' },
        { id: 'logs' as const, icon: Database, label: 'LOGS' },
        { id: 'maintenance' as const, icon: ShieldAlert, label: 'CONTROLS' },
    ];

    return (
        <div className="min-h-screen bg-[#030303] text-green-500 font-mono relative overflow-hidden selection:bg-green-500/20 selection:text-white">
            {/* ═══ BACKGROUND ═══ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.025)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-green-900/[0.07] rounded-full blur-[180px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-900/[0.05] rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
                <div className="absolute inset-0 opacity-[0.012] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)]" />
                {!isMobile && (
                    <motion.div className="absolute inset-0" style={{ background: spotlight }} />
                )}
            </div>

            {/* ═══ MAIN WRAPPER ═══ */}
            <div className="relative z-10 p-4 md:p-6 pb-24 max-w-[1600px] mx-auto">

                {/* ═══ HEADER ═══ */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="mb-6"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border border-green-500/10 bg-black/60 backdrop-blur-xl">
                        {/* Logo area */}
                        <div className="flex items-center gap-4">
                            <div className="relative p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                                <Terminal size={22} className="text-green-400" />
                                <div className="absolute inset-0 rounded-xl bg-green-500/5 animate-pulse" />
                            </div>
                            <div>
                                <h1 className="font-vt323 text-2xl md:text-3xl text-green-400 leading-none tracking-tight">
                                    GOD_MODE<span className="text-green-600">_V2.0</span>
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className={cn(
                                            "absolute inline-flex h-full w-full rounded-full opacity-75",
                                            stats.status === 'ONLINE' ? "bg-green-400 animate-ping" : "bg-red-400 animate-ping"
                                        )} />
                                        <span className={cn(
                                            "relative inline-flex rounded-full h-1.5 w-1.5",
                                            stats.status === 'ONLINE' ? "bg-green-500" : "bg-red-500"
                                        )} />
                                    </span>
                                    <span className={cn(
                                        "font-mono text-[10px] tracking-[0.2em]",
                                        stats.status === 'ONLINE' ? "text-green-600" : "text-red-500"
                                    )}>
                                        {stats.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <motion.button
                                onClick={handleLogout}
                                whileHover={!isMobile ? { scale: 1.05 } : undefined}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300"
                            >
                                <LogOut size={16} />
                                <span className="font-mono text-[11px] tracking-wider hidden sm:inline">LOGOUT</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.header>

                {/* ═══ TABS ═══ */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="flex gap-1.5 mb-6 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-x-auto no-scrollbar"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2.5 px-5 md:px-6 py-3 rounded-xl font-mono text-xs tracking-wider transition-colors duration-200 whitespace-nowrap",
                                activeTab === tab.id ? "text-green-400" : "text-green-700/60 hover:text-green-500/80"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabBg"
                                    className="absolute inset-0 rounded-xl bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.08)]"
                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                />
                            )}
                            <tab.icon size={14} className="relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* ═══ CONTENT ═══ */}
                <main>
                    <PageTransition>
                        {/* ── DASHBOARD ── */}
                        {activeTab === 'dashboard' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                <StatusCard
                                    index={0}
                                    title="TOTAL_USERS"
                                    value={stats.usersCount}
                                    icon={<Users size={20} />}
                                    accent="green"
                                    isMobile={isMobile}
                                />
                                <StatusCard
                                    index={1}
                                    title="ERRORS_24H"
                                    value={stats.errorsToday}
                                    icon={<AlertOctagon size={20} />}
                                    accent="red"
                                    isMobile={isMobile}
                                />
                                <StatusCard
                                    index={2}
                                    title="ECONOMY_VOL"
                                    value={formatMoney(stats.totalMoney)}
                                    icon={<Wallet size={20} />}
                                    accent="amber"
                                    isMobile={isMobile}
                                />
                                <StatusCard
                                    index={3}
                                    title="DB_STATUS"
                                    value={stats.status}
                                    icon={<Database size={20} />}
                                    accent="cyan"
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}

                        {/* ── LOGS ── */}
                        {activeTab === 'logs' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-4"
                            >
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(['ALL', 'AUTH', 'SECURITY', 'ECONOMY', 'SHOP', 'AUCTION', 'SYSTEM'] as LogCategory[]).map((cat) => {
                                            const c = CATEGORY_COLORS[cat];
                                            const isActive = logFilter === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setLogFilter(cat)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-wider transition-all duration-200 border",
                                                        isActive
                                                            ? cn(c.text, c.border, c.bg)
                                                            : "text-green-800 border-transparent hover:border-green-900 hover:text-green-600"
                                                    )}
                                                >
                                                    <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isActive ? c.dot : "bg-green-900")} />
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Search */}
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-800" size={14} />
                                        <input
                                            type="text"
                                            placeholder="search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-black/60 border border-green-900/50 rounded-xl py-2 pl-9 pr-4 font-mono text-sm text-green-400 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 placeholder:text-green-900 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Terminal window */}
                                <div className="rounded-2xl border border-green-500/10 bg-black/70 backdrop-blur-sm overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                    {/* Chrome bar */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10 bg-green-500/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-400 transition-colors" />
                                                <div className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-400 transition-colors" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-400 transition-colors" />
                                            </div>
                                            <span className="font-mono text-[11px] text-green-600/60 hidden sm:inline">
                                                root@server:~/logs — tail -f output.log
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[10px] text-green-800">
                                                {filteredLogs.length} entries
                                            </span>
                                            <button
                                                onClick={handleRefresh}
                                                title="Refresh"
                                                className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                                            >
                                                <RefreshCw size={12} className="text-green-700 hover:text-green-400 transition-colors" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Log entries */}
                                    <div
                                        ref={scrollRef}
                                        className="h-[55vh] md:h-[60vh] overflow-y-auto p-3 md:p-4 space-y-0.5 custom-scrollbar"
                                    >
                                        {filteredLogs.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-3 text-green-900">
                                                <Database size={32} className="opacity-30" />
                                                <span className="font-mono text-sm animate-pulse">NO_DATA_STREAM</span>
                                            </div>
                                        ) : (
                                            filteredLogs.map((log: any) => (
                                                <div
                                                    key={log._id || log.id}
                                                    className={cn(
                                                        "flex flex-col md:grid md:grid-cols-12 gap-1 md:gap-2 px-3 py-2 rounded-lg border-l-2 transition-colors duration-150",
                                                        "hover:bg-green-500/[0.03]",
                                                        LEVEL_BORDER[log.level] || 'border-l-green-900',
                                                    )}
                                                >
                                                    {/* Time + Category */}
                                                    <div className="flex items-center gap-2 md:col-span-3 lg:col-span-3">
                                                        <span className="text-green-800 text-[11px] shrink-0">
                                                            {new Date(log.createdAt || Date.now()).toLocaleTimeString()}
                                                        </span>
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] tracking-wider border font-bold",
                                                            CATEGORY_COLORS[log.category]?.text || 'text-green-600',
                                                            CATEGORY_COLORS[log.category]?.border || 'border-green-900',
                                                            CATEGORY_COLORS[log.category]?.bg || 'bg-green-900/10',
                                                        )}>
                                                            {log.category}
                                                        </span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex gap-2 overflow-hidden md:col-span-9 lg:col-span-9">
                                                        <span className="text-green-300 font-bold text-xs shrink-0">
                                                            {log.user?.nome || 'ROOT'}
                                                        </span>
                                                        <span className="text-green-700 text-xs truncate">
                                                            <span className="text-green-500 font-semibold mr-1">→ {log.action}</span>
                                                            <span className="opacity-60">{log.details}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── MAINTENANCE ── */}
                        {activeTab === 'maintenance' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                <MaintenanceCard
                                    title="ALUNO LOCKDOWN"
                                    desc="Impede apenas ALUNOS de entrarem. Admins e Devs continuam acessando."
                                    active={stats.maintenance.student}
                                    onToggle={() => toggleMaintenance('student')}
                                    icon={Lock}
                                    accent="amber"
                                    isMobile={isMobile}
                                />
                                <MaintenanceCard
                                    title="GLOBAL SHUTDOWN"
                                    desc="DERRUBA O SISTEMA INTEIRO. Ninguém entra (Exceto você)."
                                    active={stats.maintenance.global}
                                    onToggle={() => toggleMaintenance('global')}
                                    icon={Power}
                                    accent="red"
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CARD
// ═══════════════════════════════════════════════════════════════════════════

const ACCENT_MAP: Record<string, { gradient: string; text: string; border: string; iconBg: string; glow: string }> = {
    green:  { gradient: 'from-green-500 to-emerald-600',  text: 'text-green-400',  border: 'border-green-500/15', iconBg: 'bg-green-500/10',  glow: 'shadow-green-500/10' },
    red:    { gradient: 'from-red-500 to-rose-600',       text: 'text-red-400',    border: 'border-red-500/15',   iconBg: 'bg-red-500/10',    glow: 'shadow-red-500/10' },
    amber:  { gradient: 'from-amber-500 to-yellow-600',   text: 'text-amber-400',  border: 'border-amber-500/15', iconBg: 'bg-amber-500/10',  glow: 'shadow-amber-500/10' },
    cyan:   { gradient: 'from-cyan-500 to-blue-600',      text: 'text-cyan-400',   border: 'border-cyan-500/15',  iconBg: 'bg-cyan-500/10',   glow: 'shadow-cyan-500/10' },
};

function StatusCard({ index, title, value, icon, accent, isMobile }: {
    index: number; title: string; value: any; icon: React.ReactNode; accent: string; isMobile: boolean;
}) {
    const a = ACCENT_MAP[accent] || ACCENT_MAP.green;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
            whileHover={!isMobile ? { y: -4, transition: { duration: 0.2 } } : undefined}
            className={cn(
                "relative p-5 md:p-6 rounded-2xl overflow-hidden cursor-default group",
                "bg-white/[0.02] border backdrop-blur-sm transition-shadow duration-300",
                a.border,
                !isMobile && `hover:shadow-lg hover:${a.glow}`,
            )}
        >
            {/* Top accent line */}
            <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60", a.gradient)} />

            {/* Hover glow — CSS only */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br pointer-events-none", a.gradient, "!opacity-0 group-hover:!opacity-[0.03]")} />

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="font-mono text-[10px] text-green-700/70 tracking-[0.15em] mb-2">{title}</p>
                    <h2 className={cn("font-vt323 text-3xl md:text-4xl", a.text)}>{value}</h2>
                </div>
                <div className={cn("p-2.5 rounded-xl transition-transform duration-300", a.iconBg, !isMobile && "group-hover:scale-110")}>
                    <div className={a.text}>{icon}</div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAINTENANCE CARD
// ═══════════════════════════════════════════════════════════════════════════

function MaintenanceCard({ title, desc, active, onToggle, icon: Icon, accent, isMobile }: {
    title: string; desc: string; active: boolean; onToggle: () => void;
    icon: React.ElementType; accent: string; isMobile: boolean;
}) {
    const styles: Record<string, any> = {
        amber: {
            activeBorder: 'border-amber-500/40',
            activeBg: 'bg-amber-500/[0.04]',
            activeGlow: 'shadow-[0_0_40px_rgba(245,158,11,0.08)]',
            iconActive: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
            iconInactive: 'bg-white/[0.02] border-white/[0.06] text-green-800',
            titleActive: 'text-amber-400',
            btnActive: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
            btnInactive: 'bg-white/[0.02] text-green-700 border-white/[0.06] hover:border-amber-500/30 hover:text-amber-400',
            pulseRing: 'bg-amber-500/10',
        },
        red: {
            activeBorder: 'border-red-500/40',
            activeBg: 'bg-red-500/[0.04]',
            activeGlow: 'shadow-[0_0_40px_rgba(239,68,68,0.08)]',
            iconActive: 'bg-red-500/20 border-red-500/40 text-red-400',
            iconInactive: 'bg-white/[0.02] border-white/[0.06] text-green-800',
            titleActive: 'text-red-400',
            btnActive: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
            btnInactive: 'bg-white/[0.02] text-green-700 border-white/[0.06] hover:border-red-500/30 hover:text-red-400',
            pulseRing: 'bg-red-500/10',
        },
    };

    const s = styles[accent] || styles.amber;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={!isMobile ? { scale: 1.01, transition: { duration: 0.2 } } : undefined}
            className={cn(
                "relative p-8 md:p-10 rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                active ? cn(s.activeBorder, s.activeBg, s.activeGlow) : "border-white/[0.05] bg-white/[0.015]",
            )}
        >
            {/* Pulsing background when active */}
            {active && (
                <div className={cn("absolute inset-0 animate-pulse pointer-events-none", s.pulseRing)} />
            )}

            <div className="flex flex-col items-center text-center relative z-10 space-y-6">
                {/* Icon */}
                <motion.div
                    animate={active ? { scale: [1, 1.05, 1] } : {}}
                    transition={active ? { duration: 2, repeat: Infinity } : {}}
                    className={cn(
                        "p-5 rounded-2xl border-2 transition-all duration-500",
                        active ? s.iconActive : s.iconInactive,
                    )}
                >
                    <Icon size={32} />
                </motion.div>

                {/* Text */}
                <div>
                    <h2 className={cn(
                        "font-press text-base md:text-lg mb-3 transition-colors duration-500",
                        active ? s.titleActive : "text-green-600",
                    )}>
                        {title}
                    </h2>
                    <p className="font-mono text-xs text-green-700/60 max-w-xs mx-auto leading-relaxed">
                        {desc}
                    </p>
                </div>

                {/* Status badge */}
                {active && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn("px-3 py-1 rounded-full text-[10px] font-mono tracking-widest border", s.btnActive)}
                    >
                        ● ATIVO
                    </motion.div>
                )}

                {/* Toggle button */}
                <motion.button
                    onClick={onToggle}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                        "w-full py-4 rounded-xl font-mono text-xs tracking-[0.2em] border-2 transition-all duration-300",
                        active ? s.btnActive : s.btnInactive,
                    )}
                >
                    {active ? 'DESATIVAR_PROTOCOLO' : 'ATIVAR_PROTOCOLO'}
                </motion.button>
            </div>
        </motion.div>
    );
}