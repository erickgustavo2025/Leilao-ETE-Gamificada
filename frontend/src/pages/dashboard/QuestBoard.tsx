// ARQUIVO: frontend/src/pages/dashboard/QuestBoard.tsx
// ─────────────────────────────────────────────────────
// TODO BACKEND: Conectar as funções marcadas com 🔌
// ─────────────────────────────────────────────────────
import { useState, } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, CheckCircle2, Sword, Zap,
    Clock, Calendar, Trophy, ChevronRight, X, Eye,
    EyeOff, Loader2, Flame, Crown, Scroll,
    BookOpen, Target, Gift, Wallet, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────
type QuestTab = 'taverna' | 'rank' | 'site';
type QuestStatus = 'locked' | 'available' | 'pending' | 'completed';
type SecondaryType = 'daily' | 'weekly' | 'event' | 'monthly' | 'campaign' | 'functionality';

interface CampaignQuest {
    rankId: string;
    rankName: string;
    rankMin: number;
    emoji: string;
    color: string;
    border: string;
    glow: string;
    badge: string;           // Slug da badge concedida ao completar
    badgeName: string;       // Nome display da badge
    description: string;     // Descrição da missão
    powersUnlocked: string[]; // Skills que desbloqueiam
    status: QuestStatus;
}

interface SecondaryQuest {
    id: string;
    title: string;
    description: string;
    type: SecondaryType;
    reward: { pc: number };
    rewardItems?: Array<{ itemId: string; name: string; category: string }>;
    expiresAt?: string;
    status: QuestStatus;
    validationType: 'code' | 'manual';
}

// ─────────────────────────────────────────────────────
// DADOS ESTÁTICOS — Campanha (9 Ranks)
// 🔌 BACKEND: buscar status real de cada missão via GET /api/quests/campaign
// ─────────────────────────────────────────────────────
const CAMPAIGN_QUESTS_STATIC: Omit<CampaignQuest, 'status'>[] = [
    {
        rankId: 'BRONZE', rankName: 'Bronze', rankMin: 1000, emoji: '🥉',
        color: 'text-orange-400', border: 'border-orange-700', glow: '#c2410c',
        badge: 'bronze', badgeName: 'Guardião de Bronze',
        description: 'Prove que você não é um iniciante. Complete os desafios básicos de responsabilidade e compromisso com a turma.',
        powersUnlocked: ['VIP_CARD', 'AULA_VIP', 'GRUPO_VIP'],
    },
    {
        rankId: 'PRATA', rankName: 'Prata', rankMin: 1500, emoji: '🥈',
        color: 'text-slate-300', border: 'border-slate-400', glow: '#94a3b8',
        badge: 'prata', badgeName: 'Cavaleiro de Prata',
        description: 'A prata exige mais do que força — exige inteligência. Demonstre domínio em avaliações e colaboração.',
        powersUnlocked: ['BAU_ENIGMAS', 'AVALIACOES_RANK', 'AJUDA_DIVINA'],
    },
    {
        rankId: 'OURO', rankName: 'Ouro', rankMin: 2000, emoji: '🥇',
        color: 'text-yellow-400', border: 'border-yellow-500', glow: '#eab308',
        badge: 'ouro', badgeName: 'Campeão de Ouro',
        description: 'O ouro é dos que lideram. Mostre liderança e conquiste presentes da ETE para sua casa.',
        powersUnlocked: ['PRESENTE_ETE', 'PRESENTE_TACA', 'PRESENTE_AC', 'PC_GOLD'],
    },
    {
        rankId: 'DIAMANTE', rankName: 'Diamante', rankMin: 2500, emoji: '💎',
        color: 'text-cyan-400', border: 'border-cyan-500', glow: '#06b6d4',
        badge: 'diamante', badgeName: 'Mestre Diamante',
        description: 'Raro como o mineral. Execute planos estratégicos de alto impacto na gamificação da escola.',
        powersUnlocked: ['PLANO_BRUXO', 'PLANO_GAMIFICADO', 'MINA_DIAMANTE', 'SORTEIO_DIAMANTE'],
    },
    {
        rankId: 'EPICO', rankName: 'Épico', rankMin: 3000, emoji: '👑',
        color: 'text-purple-400', border: 'border-purple-500', glow: '#a855f7',
        badge: 'epico', badgeName: 'Herói Épico',
        description: 'Os épicos deixam legado. Treine seus aliados e demonstre habilidades avançadas de defesa e ataque.',
        powersUnlocked: ['TREINAMENTO', 'REDUCAO_DANO', 'AUREA_SABER', 'BRINDE_EPICO'],
    },
    {
        rankId: 'LENDARIO', rankName: 'Épico Lendário', rankMin: 5000, emoji: '🌟',
        color: 'text-fuchsia-400', border: 'border-fuchsia-500', glow: '#d946ef',
        badge: 'lendario', badgeName: 'Lendário da ETE',
        description: 'Seu nome será gravado. Converta conhecimento em poder e torne-se um honorário da instituição.',
        powersUnlocked: ['CONVERTER_PC', 'IMUNIDADE_ATRASO', 'GIL_HONORARIO', 'INVISIBILIDADE_2'],
    },
    {
        rankId: 'SUPREMO', rankName: 'Épico Supremo', rankMin: 10000, emoji: '🔥',
        color: 'text-red-400', border: 'border-red-500', glow: '#ef4444',
        badge: 'supremo', badgeName: 'Supremo Imortal',
        description: 'A imortalidade é ganha, não dada. Ressuscite, domine o sorteio e mostre que você é invencível.',
        powersUnlocked: ['AJUDA_SUPREMA', 'SORTUDO', 'IMORTAL', 'RENOMADO', 'RESSUSCITAR'],
    },
    {
        rankId: 'MITOLOGICO', rankName: 'Épico Mitológico', rankMin: 20000, emoji: '🔱',
        color: 'text-rose-400', border: 'border-rose-600', glow: '#f43f5e',
        badge: 'mitologico', badgeName: 'Entidade Mitológica',
        description: 'Pertencente ao panteão dos deuses. Conceda poder aos outros e receba os presentes dos deuses.',
        powersUnlocked: ['AJUDA_ILIMITADA', 'CAMPEAO', 'DOBRADOR', 'CIRCULO_CURA', 'TRANSF_CONHECIMENTO'],
    },
    {
        rankId: 'SOBERANO', rankName: 'Épico Soberano', rankMin: 50000, emoji: '⚡',
        color: 'text-yellow-200', border: 'border-yellow-100', glow: '#fefce8',
        badge: 'soberano', badgeName: 'Soberano Absoluto',
        description: 'O topo da pirâmide. Apenas um punhado de pessoas chegará aqui. A Fênix renasce. O Soberano jamais cai.',
        powersUnlocked: ['AJUDA_SOBERANA', 'TRIPLICADOR', 'PODER_FENIX', 'PEDRA_FENIX', 'CANALIZADOR_MANA'],
    },
];



// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function timeLeft(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d restantes`;
    return `${h}h ${m}m`;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    daily: { label: 'DIARIA', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    weekly: { label: 'SEMANAL', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    event: { label: 'EVENTO', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
    monthly: { label: 'MENSAL', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    campaign: { label: 'RANK', icon: Crown, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30' },
    functionality: { label: 'SITE', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
};

// ─────────────────────────────────────────────────────
// SUB-COMPONENTE: Modal de Validação
// ─────────────────────────────────────────────────────
function ValidationModal({
    title, onClose, onSubmit, validationType, isLoading,
}: {
    title: string;
    onClose: () => void;
    onSubmit: (code: string, submissionContent?: string) => void;
    validationType: 'code' | 'manual';
    isLoading: boolean;
}) {
    const [code, setCode] = useState('');
    const [show, setShow] = useState(false);
    const [submissionContent, setSubmissionContent] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="w-full sm:max-w-sm bg-[#07071a] border-t-2 sm:border-2 border-purple-500/60 rounded-t-3xl sm:rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 60px rgba(168,85,247,0.2)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Handle mobile */}
                <div className="flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Scroll size={16} className="text-purple-400" />
                            </div>
                            <span className="font-press text-[10px] text-white">VALIDAR MISSAO</span>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Nome da quest — font-vt323 para suportar acentos */}
                    <p className="font-vt323 text-2xl text-purple-300 mb-5 leading-tight">{title}</p>

                    {validationType === 'code' ? (
                        <div className="space-y-3">
                            <label className="font-press text-[9px] text-slate-500 uppercase block">
                                CODIGO SECRETO DO PROFESSOR
                            </label>
                            <div className="relative">
                                <input
                                    type={show ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    className="w-full bg-black/60 border border-purple-500/40 rounded-xl p-4 text-white font-mono text-sm focus:border-purple-400 outline-none placeholder:text-slate-700 pr-12 tracking-widest"
                                    maxLength={12}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button
                                onClick={() => code && onSubmit(code)}
                                disabled={!code || isLoading}
                                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-press text-[10px] flex items-center justify-center gap-2 transition-all"
                                style={{ boxShadow: code ? '0 0 20px rgba(168,85,247,0.4)' : undefined }}
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> CONFIRMAR</>}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                <p className="font-vt323 text-xl text-blue-300">Envio Manual</p>
                                <p className="font-poppins text-xs text-slate-400 mt-1">
                                    Esta missão requer aprovação do professor. Descreva seu projeto ou cole o link.
                                </p>
                            </div>
                            <label className="font-press text-[9px] text-slate-500 uppercase block">
                                LINK DO PROJETO, DRIVE OU COMENTÁRIO
                            </label>
                            <textarea
                                placeholder="Cole aqui o link do seu projeto ou uma descrição..."
                                value={submissionContent}
                                onChange={e => setSubmissionContent(e.target.value)}
                                maxLength={2000}
                                className="w-full bg-black/60 border border-blue-500/40 rounded-xl p-4 text-white font-poppins text-sm focus:border-blue-400 outline-none placeholder:text-slate-700 resize-none h-24"
                            />
                            <div className="text-right text-xs text-slate-500">
                                {submissionContent.length}/2000
                            </div>
                            <button
                                onClick={() => onSubmit('MANUAL', submissionContent)}
                                disabled={isLoading || !submissionContent.trim()}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-press text-[10px] flex items-center justify-center gap-2 transition-all"
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><Target size={14} /> SOLICITAR VALIDACAO</>}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTE: Card de Campanha
// ─────────────────────────────────────────────────────
function CampaignCard({
    quest, userPoints, userCargos, onValidate, delay,
}: {
    quest: Omit<CampaignQuest, 'status'>;
    userPoints: number;
    userCargos: string[];
    onValidate: (q: Omit<CampaignQuest, 'status'>) => void;
    delay: number;
}) {
    const isUnlocked = userPoints >= quest.rankMin;
    const isCompleted = userCargos.includes(quest.badge);
    const [expanded, setExpanded] = useState(false);

    const statusIcon = isCompleted
        ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        : isUnlocked
            ? <Sword size={16} className="text-yellow-400 shrink-0 animate-pulse" />
            : <Lock size={16} className="text-slate-600 shrink-0" />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', damping: 22 }}
            className={cn(
                'rounded-2xl border-2 overflow-hidden transition-all duration-300',
                isCompleted ? `${quest.border} opacity-70` :
                    isUnlocked ? quest.border :
                        'border-slate-800 opacity-50 grayscale',
                !isCompleted && isUnlocked && 'ring-2 ring-offset-1 ring-offset-transparent',
            )}
            style={{
                boxShadow: isUnlocked && !isCompleted ? `0 0 20px ${quest.glow}30` : undefined,
                background: 'rgba(4,4,20,0.9)',
            }}
        >
            {/* Header do card */}
            <div
                className={cn(
                    'p-4 flex items-center gap-3 cursor-pointer select-none',
                    isUnlocked && !isCompleted && 'hover:bg-white/5'
                )}
                onClick={() => isUnlocked && setExpanded(!expanded)}
            >
                {/* Emoji / rank */}
                <div
                    className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border',
                        isCompleted ? `${quest.border} bg-black/40` :
                            isUnlocked ? `${quest.border} bg-black/60` :
                                'border-slate-800 bg-black/40'
                    )}
                    style={{ boxShadow: isUnlocked ? `inset 0 0 12px ${quest.glow}30` : undefined }}
                >
                    {isCompleted ? '✅' : quest.emoji}
                </div>

                <div className="flex-1 min-w-0">
                    {/* SEM ACENTO → font-press para rank simples */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-press text-[9px]', isUnlocked ? quest.color : 'text-slate-600')}>
                            {quest.rankId}
                        </span>
                        <span className={cn(
                            'px-1.5 py-0.5 rounded font-press text-[7px] border',
                            isCompleted ? 'border-green-600/50 text-green-400 bg-green-900/20' :
                                isUnlocked ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20' :
                                    'border-slate-700 text-slate-600 bg-slate-900'
                        )}>
                            {isCompleted ? 'CONCLUIDA' : isUnlocked ? 'DISPONIVEL' : 'BLOQUEADA'}
                        </span>
                    </div>
                    {/* COM ACENTO → font-vt323 */}
                    <p className={cn('font-vt323 text-xl leading-tight mt-0.5', isUnlocked ? 'text-white' : 'text-slate-600')}>
                        {quest.badgeName}
                    </p>
                    <p className="font-mono text-[9px] text-slate-500 mt-0.5">
                        Req: {quest.rankMin.toLocaleString()} PC$ máx.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {statusIcon}
                    {isUnlocked && !isCompleted && (
                        <ChevronRight size={14} className={cn('text-slate-600 transition-transform', expanded && 'rotate-90')} />
                    )}
                </div>
            </div>

            {/* Expansão */}
            <AnimatePresence>
                {expanded && isUnlocked && !isCompleted && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                            {/* Descrição com acento */}
                            <p className="font-poppins text-xs text-slate-300 leading-relaxed">
                                {quest.description}
                            </p>

                            {/* Poderes que desbloqueia */}
                            <div>
                                <p className="font-press text-[8px] text-slate-500 mb-2">PODERES DESBLOQUEADOS</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {quest.powersUnlocked.map(p => (
                                        <span key={p} className={cn(
                                            'px-2 py-0.5 rounded-full border font-mono text-[8px]',
                                            `border-opacity-40 bg-opacity-10`,
                                            quest.border, quest.color,
                                        )}
                                            style={{ backgroundColor: `${quest.glow}15` }}>
                                            {p.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Badge ganha */}
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                                <Trophy size={16} className={quest.color} />
                                <div>
                                    <p className="font-press text-[8px] text-slate-500">RECOMPENSA</p>
                                    {/* COM ACENTO → font-vt323 */}
                                    <p className={cn('font-vt323 text-lg leading-none', quest.color)}>
                                        Badge: {quest.badgeName}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => onValidate(quest)}
                                className={cn(
                                    'w-full py-3 rounded-xl font-press text-[10px] flex items-center justify-center gap-2 transition-all',
                                    'text-white border',
                                    quest.border,
                                )}
                                style={{
                                    background: `linear-gradient(135deg, ${quest.glow}30, ${quest.glow}15)`,
                                    boxShadow: `0 0 20px ${quest.glow}25`,
                                }}
                            >
                                <Scroll size={13} />
                                INSERIR CODIGO SECRETO
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTE: Card de Side Quest
// ─────────────────────────────────────────────────────
function SideQuestCard({
    quest, onValidate, delay, onRequestManual
}: {
    quest: SecondaryQuest;
    onValidate: (q: SecondaryQuest) => void;
    delay: number;
    onRequestManual: (id: string) => void;
}) {
    const cfg = TYPE_CONFIG[quest.type];
    const Icon = cfg.icon;
    const isDone = quest.status === 'completed';
    const isPending = quest.status === 'pending';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, type: 'spring', damping: 22 }}
            className={cn(
                'rounded-2xl border overflow-hidden transition-all',
                isDone ? 'border-green-700/40 bg-green-950/20 opacity-60' :
                    isPending ? 'border-blue-500/40 bg-blue-950/20' :
                        'border-slate-700/60 bg-[#07071a]'
            )}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-xl border shrink-0', cfg.bg)}>
                        <Icon size={16} className={cfg.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn('font-press text-[8px]', cfg.color)}>{cfg.label}</span>
                            {quest.expiresAt && !isDone && (
                                <span className="font-mono text-[8px] text-orange-400 flex items-center gap-1">
                                    <Clock size={8} />{timeLeft(quest.expiresAt)}
                                </span>
                            )}
                            {isDone && <span className="font-press text-[8px] text-green-400">CONCLUIDA</span>}
                            {isPending && <span className="font-press text-[8px] text-blue-400 animate-pulse">AGUARDANDO</span>}
                        </div>

                        <h3 className="font-vt323 text-xl text-white leading-tight">{quest.title}</h3>
                        <p className="font-poppins text-[11px] text-slate-400 mt-1 leading-relaxed">{quest.description}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Gift size={12} className="text-yellow-400" />
                            <span className="font-press text-[9px] text-yellow-400">{quest.reward.pc} PC$</span>
                        </div>
                        {quest.rewardItems && quest.rewardItems.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Package size={12} className="text-purple-400" />
                                <span className="font-press text-[9px] text-purple-400">CONTÉM ITENS</span>
                            </div>
                        )}
                    </div>

                    {!isDone && !isPending && (
                        <button
                            onClick={() => quest.validationType === 'manual' ? onRequestManual(quest.id) : onValidate(quest)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 font-press text-[8px] text-white flex items-center gap-1.5 transition-all"
                        >
                            <CheckCircle2 size={11} />
                            {quest.validationType === 'manual' ? 'SOLICITAR' : 'VALIDAR'}
                        </button>
                    )}
                    {isPending && (
                        <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 font-press text-[8px] text-blue-400 flex items-center gap-1.5">
                            <Loader2 size={11} className="animate-spin" /> PENDENTE
                        </span>
                    )}
                    {isDone && (
                        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-700/30 font-press text-[8px] text-green-400 flex items-center gap-1.5">
                            <CheckCircle2 size={11} /> OK
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────
export function QuestBoard() {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<QuestTab>('taverna');
    const [validationTarget, setValidationTarget] = useState<{
        title: string; type: 'code' | 'manual'; questId: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterType, setFilterType] = useState<'all' | string>('all');

    const userPoints = user?.maxPcAchieved || 0;
    const userBalance = user?.saldoPc || 0;
    const userCargos = user?.cargos || [];

    // 🚀 BUSCANDO AS MISSÕES REAIS DO BACKEND
    const { data: secondaryQuests = [], isLoading } = useQuery<SecondaryQuest[]>({
        queryKey: ['quests', 'secondary'],
        queryFn: async () => {
            const response = await api.get('/quests/secondary');
            return response.data;
        },
        staleTime: 30000, // 30s — missões não mudam a cada segundo
        retry: 2,
    });

    const tavernaQuests = secondaryQuests.filter(q => ['daily', 'weekly', 'event', 'monthly'].includes(q.type));
    const rankQuests = secondaryQuests.filter(q => q.type === 'campaign');
    const siteQuests = secondaryQuests.filter(q => q.type === 'functionality');

    const filteredTaverna = filterType === 'all'
        ? tavernaQuests
        : tavernaQuests.filter(q => q.type === filterType);

    // Estatísticas da campanha
    const completedCampaign = CAMPAIGN_QUESTS_STATIC.filter(q => userCargos.includes(q.badge)).length;
    const availableCampaign = CAMPAIGN_QUESTS_STATIC.filter(q => userPoints >= q.rankMin && !userCargos.includes(q.badge)).length;

    // ─── HANDLER: Validar missão ───────────────────
    // 🔌 BACKEND: POST /api/quests/validate  { questId, code }
    async function handleRequestManual(questId: string) {
        setIsSubmitting(true);
        try {
            await api.post('/quests/request-validation', { questId });
            toast.success('Solicitação enviada ao professor!');
            queryClient.invalidateQueries({ queryKey: ['quests', 'secondary'] });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Erro ao solicitar validação.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleValidate(code: string, submissionContent?: string) {
        setIsSubmitting(true);
        try {
            if (submissionContent !== undefined) {
                // Submissão manual
                await api.post('/quests/request-validation', { questId: validationTarget?.questId, submissionContent });
            } else {
                // Validação por código
                await api.post('/quests/validate', { questId: validationTarget?.questId, secretCode: code });
            }

            toast.success(submissionContent !== undefined ? 'Submissão enviada ao professor!' : 'Código validado! Recompensas adicionadas.');
            setValidationTarget(null);

            // Atualiza as missões secundárias na tela (React Query)
            queryClient.invalidateQueries({ queryKey: ['quests', 'secondary'] });

            // 🚀 A MÁGICA ACONTECE AQUI:
            // Isso vai no backend, pega o seu novo PC$/Badges e atualiza a tela instantaneamente!
            await refreshUser();

        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Código inválido.');
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <div className="min-h-screen bg-[#040415] pb-28 pt-16 md:pt-0">
            {/* ── HEADER ── */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-purple-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 px-4 pt-14 md:pt-8 md:pl-28 pb-6 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                            <BookOpen size={20} className="text-purple-400" />
                        </div>
                        <div>
                            {/* SEM ACENTO → font-press */}
                            <p className="font-press text-[9px] text-purple-400 uppercase tracking-widest">TAVERNA DAS MISSOES</p>
                            {/* COM ACENTO → font-vt323 */}
                            <h1 className="font-vt323 text-4xl text-white leading-none">Quadro de Missões</h1>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <Crown size={12} className="text-yellow-400" />
                            <span className="font-press text-[9px] text-yellow-400">{completedCampaign}/9 RANKS</span>
                        </div>
                        {availableCampaign > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 animate-pulse">
                                <Sword size={12} className="text-green-400" />
                                <span className="font-press text-[9px] text-green-400">{availableCampaign} DISPONIVEL</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                            <Zap size={12} className="text-cyan-400" />
                            <span className="font-press text-[9px] text-cyan-400">{userPoints.toLocaleString()} PC$ MAX</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                            <Wallet size={12} className="text-green-400" />
                            <span className="font-press text-[9px] text-green-400">{userBalance.toLocaleString()} PC$ (SALDO)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="sticky top-0 z-20 bg-[#040415]/95 backdrop-blur-sm border-b border-white/5 px-4 md:pl-28">
                <div className="max-w-4xl mx-auto flex">
                    {([
                        { id: 'taverna', label: 'TAVERNA', icon: Target },
                        { id: 'rank', label: 'MISSÕES DE RANK', icon: Sword },
                        { id: 'site', label: 'MISSÕES DE SITE', icon: Zap },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3.5 font-press text-[9px] border-b-2 transition-all',
                                activeTab === tab.id
                                    ? 'border-purple-500 text-purple-300'
                                    : 'border-transparent text-slate-600 hover:text-slate-400'
                            )}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                            {tab.id === 'campaign' && availableCampaign > 0 && (
                                <span className="w-4 h-4 rounded-full bg-green-500 text-black font-press text-[7px] flex items-center justify-center">
                                    {availableCampaign}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 md:pl-28 pt-6 max-w-4xl mx-auto">
                <AnimatePresence mode="wait">

                    {/* ═══════════════════ TAVERNA ═══════════════════ */}
                    {activeTab === 'taverna' && (
                        <motion.div
                            key="taverna"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {/* Filtros */}
                            <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {([
                                    { id: 'all', label: 'TODAS' },
                                    { id: 'daily', label: 'DIARIAS' },
                                    { id: 'weekly', label: 'SEMANAIS' },
                                    { id: 'monthly', label: 'MENSAL' },
                                    { id: 'event', label: 'EVENTOS' },
                                ] as const).map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilterType(f.id)}
                                        className={cn(
                                            'flex-shrink-0 px-3 py-1.5 rounded-xl border font-press text-[8px] transition-all',
                                            filterType === f.id
                                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                                : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                        )}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="text-center py-16">
                                        <Loader2 size={32} className="mx-auto text-purple-500 animate-spin mb-4" />
                                        <p className="font-press text-[10px] text-purple-400">BUSCANDO MISSOES...</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredTaverna.map((q, i) => (
                                            <SideQuestCard
                                                key={q.id}
                                                quest={q}
                                                delay={i * 0.05}
                                                onValidate={(quest) => setValidationTarget({
                                                    title: quest.title,
                                                    type: quest.validationType,
                                                    questId: quest.id,
                                                })}
                                                onRequestManual={handleRequestManual}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════ MISSÕES DE RANK ═══════════════════ */}
                    {activeTab === 'rank' && (
                        <motion.div
                            key="rank"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            <p className="font-poppins text-xs text-slate-500 mb-5 leading-relaxed">
                                Complete a missão do seu rank atual para ganhar a badge e desbloquear os poderes.
                            </p>

                            <div className="space-y-3">
                                {rankQuests.map((q, i) => (
                                    <SideQuestCard
                                        key={q.id}
                                        quest={q}
                                        delay={i * 0.05}
                                        onValidate={(quest) => setValidationTarget({
                                            title: quest.title,
                                            type: quest.validationType,
                                            questId: quest.id,
                                        })}
                                        onRequestManual={handleRequestManual}
                                    />
                                ))}
                                {/* Fallback para as estáticas se não houver no banco */}
                                {rankQuests.length === 0 && CAMPAIGN_QUESTS_STATIC.map((q, i) => (
                                    <CampaignCard
                                        key={q.rankId}
                                        quest={q}
                                        userPoints={userPoints}
                                        userCargos={userCargos}
                                        delay={i * 0.04}
                                        onValidate={(quest) => setValidationTarget({
                                            title: quest.badgeName,
                                            type: 'code',
                                            questId: quest.rankId,
                                        })}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════ MISSÕES DE SITE ═══════════════════ */}
                    {activeTab === 'site' && (
                        <motion.div
                            key="site"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            <p className="font-poppins text-xs text-slate-500 mb-5 leading-relaxed">
                                Desbloqueie funcionalidades do sistema completando estas missões.
                            </p>

                            <div className="space-y-3">
                                {siteQuests.map((q, i) => (
                                    <SideQuestCard
                                        key={q.id}
                                        quest={q}
                                        delay={i * 0.05}
                                        onValidate={(quest) => setValidationTarget({
                                            title: quest.title,
                                            type: quest.validationType,
                                            questId: quest.id,
                                        })}
                                        onRequestManual={handleRequestManual}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── MODAL DE VALIDAÇÃO ─── */}
            <AnimatePresence>
                {validationTarget && (
                    <ValidationModal
                        title={validationTarget.title}
                        validationType={validationTarget.type}
                        isLoading={isSubmitting}
                        onClose={() => setValidationTarget(null)}
                        onSubmit={handleValidate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
