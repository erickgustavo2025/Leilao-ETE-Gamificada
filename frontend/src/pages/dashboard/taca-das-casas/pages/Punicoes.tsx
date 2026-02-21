// ARQUIVO: frontend/src/pages/dashboard/taca-das-casas/pages/Punicoes.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    AlertTriangle,
    Shield,
    Clock,
    User,
    Loader2,
    X,
    Minus,
    TrendingDown,
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../../../api/axios-config';
import { useGameSound } from '../../../../hooks/useGameSound';
import { cn } from '../../../../utils/cn';
import { PageTransition } from '../../../../components/layout/PageTransition';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Punição {
    _id: string;
    house?: { nome: string; serie: string };
    classroomId?: string;
    type: string;           // ex: 'PUNIÇÃO' | 'DECRETO' | 'AVISO'
    reason: string;         // motivo
    pointsDeducted: number; // pontos descontados (0 se for decreto)
    appliedBy?: { nome: string };
    appliedAt: string;      // ISO date
    targetAluno?: { nome: string; matricula: string };
    isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TIPO_FILTROS = [
    { id: 'ALL', label: 'Todos', icon: Shield },
    { id: 'PUNIÇÃO', label: 'Punições', icon: TrendingDown },
    { id: 'DECRETO', label: 'Decretos', icon: AlertTriangle },
    { id: 'AVISO', label: 'Avisos', icon: Clock },
];

// Styles por tipo
const TIPO_STYLES: Record<string, {
    badge: string;
    border: string;
    glow: string;
    text: string;
}> = {
    'PUNIÇÃO': {
        badge: 'bg-red-900/60 border-red-600 text-red-300',
        border: 'border-red-900/60',
        glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
        text: 'text-red-400'
    },
    'DECRETO': {
        badge: 'bg-amber-900/60 border-amber-600 text-amber-300',
        border: 'border-amber-900/60',
        glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.25)]',
        text: 'text-amber-400'
    },
    'AVISO': {
        badge: 'bg-blue-900/60 border-blue-600 text-blue-300',
        border: 'border-blue-900/60',
        glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
        text: 'text-blue-400'
    },
};

const DEFAULT_STYLE = TIPO_STYLES['PUNIÇÃO'];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function Punicoes() {
    const navigate = useNavigate();
    const { playClick, playHover } = useGameSound();

    // Estados de UI (mantidos)
    const [filtroTipo, setFiltroTipo] = useState('ALL');
    const [busca, setBusca] = useState('');
    const [selected, setSelected] = useState<Punição | null>(null);

    // ==================== QUERIES ====================
    
    const { 
        data: punicoes = [], 
        isLoading, 
        isError 
    } = useQuery({
        queryKey: ['housePunitions'],
        queryFn: async () => {
            const res = await api.get('/house/punitions');
            
            // BLINDAGEM CRÍTICA: Garante que é array
            if (Array.isArray(res.data)) {
                return res.data as Punição[];
            } else {
                console.error("Dados inválidos recebidos:", res.data);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });

    // ==================== DERIVAÇÕES E FILTROS ====================
    
    // FILTER (BLINDADO - mantém toda a proteção original)
    const filtered = Array.isArray(punicoes) ? punicoes.filter(p => {
        // Blindagem extra para objetos mal formados
        if (!p || !p.type) return false;

        const matchTipo = filtroTipo === 'ALL' || p.type === filtroTipo;
        // Blindagem no p.reason (caso venha null)
        const motivo = p.reason || ''; 
        const matchBusca = busca === '' || motivo.toLowerCase().includes(busca.toLowerCase());
        
        return matchTipo && matchBusca;
    }) : [];

    // ==================== HELPERS ====================
    
    const formatDate = (iso: string) => {
        if (!iso) return 'Data desconhecida';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return iso;
        }
    };

    const getStyle = (tipo: string) => TIPO_STYLES[tipo] || DEFAULT_STYLE;

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <PageTransition className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden">

            {/* ─── BACKGROUND ─────────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Orb vermelho sinistro no topo */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/15 rounded-full blur-[150px]" />
                {/* Orb roxo embaixo */}
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[200px]" />

                {/* Grid sutil */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

                {/* Partículas vermelhas — sinistras */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-red-500 rounded-full"
                        style={{
                            left: `${5 + Math.random() * 90}%`,
                            top: `${5 + Math.random() * 90}%`,
                        }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            y: [0, -40, 0],
                            scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}
            </div>

            {/* ─── HEADER ─────────────────────────────────────────────── */}
            <header className="relative z-10 px-4 pt-20 md:pt-6 pb-6 md:pl-28">
                <div className="max-w-5xl mx-auto">

                    {/* Back + Title row */}
                    <div className="flex items-start gap-4 mb-8">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { playClick(); navigate('/taca-das-casas'); }}
                            className="p-3 mt-1 bg-black/60 border-2 border-red-900/40 rounded-xl hover:border-red-600 transition-all backdrop-blur-sm shrink-0"
                        >
                            <ChevronLeft className="text-red-400" />
                        </motion.button>

                        <div className="flex-1 min-w-0">
                            {/* Lama sinistro acima do título */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-red-900/30 border border-red-800/50 rounded-full"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <span className="font-mono text-[10px] text-red-400 tracking-widest">
                                    DECRETO ATIVO
                                </span>
                            </motion.div>

                            <h1 className="font-press text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-amber-500 leading-tight">
                                QUADRO DE AVISOS
                            </h1>
                            <p className="font-vt323 text-lg text-slate-500 mt-1">
                                Decretos da Alta Inquisitora — obediência obrigatória
                            </p>
                        </div>
                    </div>

                    {/* ─── FILTRO DE TIPO ─────────────────────────────── */}
                    <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                        {TIPO_FILTROS.map((f, i) => {
                            const active = filtroTipo === f.id;
                            const Icon = f.icon;
                            return (
                                <motion.button
                                    key={f.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { playClick(); setFiltroTipo(f.id); }}
                                    onMouseEnter={playHover}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-vt323 text-lg whitespace-nowrap backdrop-blur-sm transition-all',
                                        active
                                            ? 'bg-red-900/30 border-red-600 text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.3)]'
                                            : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600'
                                    )}
                                >
                                    <Icon size={16} />
                                    {f.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* ─── BARRA DE BUSCA ─────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 relative"
                    >
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Buscar por motivo..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-black/50 border-2 border-slate-800 focus:border-red-700 rounded-xl font-vt323 text-lg text-white placeholder-slate-600 outline-none transition-all backdrop-blur-sm"
                        />
                    </motion.div>
                </div>
            </header>

            {/* ─── MAIN: LISTA DE PUNIÇÕES ─────────────────────────────── */}
            <main className="relative z-10 px-4 pb-24 md:pl-28">
                <div className="max-w-5xl mx-auto">

                    {/* Contador */}
                    {!isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-between mb-5"
                        >
                            <span className="font-mono text-xs text-slate-600">
                                {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                            </span>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-14 h-14 text-red-500 animate-spin mb-4" />
                            <p className="font-press text-xs text-slate-600 animate-pulse">
                                CONSULTANDO OS REGISTROS...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-28 text-center"
                        >
                            <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border-2 border-dashed border-red-800 rounded-2xl p-10">
                                <AlertTriangle size={56} className="text-red-700 mx-auto mb-4" />
                                <h3 className="font-press text-sm text-red-500 mb-2">
                                    FALHA NA CONEXÃO
                                </h3>
                                <p className="font-vt323 text-xl text-slate-600">
                                    Não foi possível consultar o Quadro de Avisos.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Empty */}
                    {!isLoading && !isError && filtered.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-28 text-center"
                        >
                            <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border-2 border-dashed border-slate-800 rounded-2xl p-10">
                                <Shield size={56} className="text-slate-700 mx-auto mb-4" />
                                <h3 className="font-press text-sm text-slate-500 mb-2">
                                    NENHUM REGISTRO
                                </h3>
                                <p className="font-vt323 text-xl text-slate-600">
                                    {busca
                                        ? 'Nenhum resultado para essa busca.'
                                        : 'Nenhum decreto ou punição registrado.'}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Lista */}
                    {!isLoading && !isError && filtered.length > 0 && (
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((item, i) => {
                                    const style = getStyle(item.type);
                                    return (
                                        <motion.button
                                            key={item._id}
                                            layout
                                            initial={{ opacity: 0, x: -24 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -24 }}
                                            transition={{ delay: i * 0.04 }}
                                            whileHover={{ x: 6 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { playClick(); setSelected(item); }}
                                            onMouseEnter={playHover}
                                            className={cn(
                                                'w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300',
                                                'bg-black/50',
                                                style.border,
                                                style.glow
                                            )}
                                        >
                                            {/* Ícone / Tipo */}
                                            <div className={cn(
                                                'shrink-0 w-11 h-11 rounded-lg border-2 flex items-center justify-center mt-0.5',
                                                style.badge
                                            )}>
                                                {item.type === 'PUNIÇÃO' && <TrendingDown size={20} className={style.text} />}
                                                {item.type === 'DECRETO' && <AlertTriangle size={20} className={style.text} />}
                                                {item.type === 'AVISO' && <Clock size={20} className={style.text} />}
                                                {!['PUNIÇÃO','DECRETO','AVISO'].includes(item.type) && <Shield size={20} className="text-slate-400" />}
                                            </div>

                                            {/* Conteúdo */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Badge tipo */}
                                                    <span className={cn(
                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] border uppercase tracking-wider',
                                                        style.badge
                                                    )}>
                                                        {item.type}
                                                    </span>

                                                    {/* Casa */}
                                                    {item.house && (
                                                        <span className="font-press text-[10px] text-slate-500">
                                                            {item.house.nome}
                                                        </span>
                                                    )}

                                                    {/* Pontos descontados */}
                                                    {item.pointsDeducted > 0 && (
                                                        <span className="flex items-center gap-1 font-press text-[10px] text-red-400">
                                                            <Minus size={10} />
                                                            {item.pointsDeducted} PC$
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Motivo */}
                                                <p className="font-vt323 text-lg text-slate-200 mt-1.5 leading-snug truncate">
                                                    {item.reason}
                                                </p>

                                                {/* Meta: data + quem aplicou */}
                                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
                                                        <Clock size={11} />
                                                        {formatDate(item.appliedAt)}
                                                    </span>
                                                    {item.appliedBy && (
                                                        <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
                                                            <User size={11} />
                                                            {item.appliedBy.nome}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chevron indicador */}
                                            <ChevronLeft size={18} className="text-slate-700 shrink-0 mt-1 rotate-180" />
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── MODAL DE DETALHES ──────────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
                        onClick={() => setSelected(null)}
                    >
                        {/* Sheet no mobile (sobe de baixo), modal no desktop */}
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl"
                        >
                            {(() => {
                                const s = getStyle(selected.type);
                                return (
                                    <div className={cn('bg-gradient-to-b from-[#0a0a0f] to-[#050507] border-t-2 sm:border-2', s.border)}>

                                        {/* Handle mobile drag indicator */}
                                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                                            <div className="w-10 h-1 bg-slate-700 rounded-full" />
                                        </div>

                                        {/* Header do modal */}
                                        <div className="flex items-start justify-between px-5 pt-4 pb-3">
                                            <span className={cn(
                                                'inline-flex items-center px-3 py-1 rounded-full font-mono text-[10px] border uppercase tracking-wider',
                                                s.badge
                                            )}>
                                                {selected.type}
                                            </span>
                                            <motion.button
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setSelected(null)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <X size={20} className="text-slate-500" />
                                            </motion.button>
                                        </div>

                                        {/* Corpo */}
                                        <div className="px-5 pb-6 space-y-5">
                                            {/* Motivo principal */}
                                            <h2 className="font-press text-base md:text-lg text-white leading-snug">
                                                {selected.reason}
                                            </h2>

                                            {/* Grid de infos */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Casa */}
                                                {selected.house && (
                                                    <InfoBlock label="Casa" icon={Shield}>
                                                        <span className="font-press text-[11px] text-white">
                                                            {selected.house.nome}
                                                        </span>
                                                        <span className="font-mono text-[9px] text-slate-600">
                                                            {selected.house.serie}
                                                        </span>
                                                    </InfoBlock>
                                                )}

                                                {/* Pontos */}
                                                <InfoBlock label="Pontos" icon={TrendingDown}>
                                                    <span className={cn(
                                                        'font-press text-[14px]',
                                                        selected.pointsDeducted > 0 ? 'text-red-400' : 'text-slate-500'
                                                    )}>
                                                        {selected.pointsDeducted > 0 ? `-${selected.pointsDeducted}` : '—'} PC$
                                                    </span>
                                                </InfoBlock>

                                                {/* Aplicado por */}
                                                {selected.appliedBy && (
                                                    <InfoBlock label="Aplicado por" icon={User}>
                                                        <span className="font-vt323 text-lg text-white">
                                                            {selected.appliedBy.nome}
                                                        </span>
                                                    </InfoBlock>
                                                )}

                                                {/* Data */}
                                                <InfoBlock label="Data" icon={Clock}>
                                                    <span className="font-vt323 text-lg text-white">
                                                        {formatDate(selected.appliedAt)}
                                                    </span>
                                                </InfoBlock>
                                            </div>

                                            {/* Aluno alvo (se existir) */}
                                            {selected.targetAluno && (
                                                <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-red-900/40 border border-red-700 flex items-center justify-center shrink-0">
                                                        <User size={18} className="text-red-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-vt323 text-lg text-red-200">
                                                            {selected.targetAluno.nome}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-red-600">
                                                            Mat. {selected.targetAluno.matricula}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageTransition>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: InfoBlock — bloco reutilizável de info no modal
// ═══════════════════════════════════════════════════════════════════════════

function InfoBlock({
    label,
    icon: Icon,
    children
}: {
    label: string;
    icon: typeof Shield;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-black/40 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className="text-slate-600" />
                <span className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <div className="flex flex-col gap-0.5">
                {children}
            </div>
        </div>
    );
}