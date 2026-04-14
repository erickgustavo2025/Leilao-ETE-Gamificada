import { Clock, Calendar, Flame, Trophy, Crown, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TIPOS DE MISSÕES
// ─────────────────────────────────────────────────────────────────

export type QuestType = 'DIARIA' | 'SEMANAL' | 'EVENTO' | 'MENSAL' | 'CAMPANHA' | 'FUNCIONALIDADE';
export type ValidationType = 'SECRET_CODE' | 'MANUAL_ADMIN';
export type QuestStatus = 'active' | 'inactive' | 'expired';
export type ItemCategory = 'CONSUMIVEL' | 'PERMANENTE' | 'TICKET' | 'BUFF';

export interface QuestKey {
    code: string;
    usedBy?: string;   // nome do aluno
    usedAt?: string;   // ISO date
}

export interface RewardItem {
    itemId: string;    // ID real do StoreItem
    name: string;
    category: ItemCategory;
    validityDays: number;
    sendToClassroom: boolean;
}

export interface StoreItem {
    _id: string;
    nome: string;
    tipo: 'ITEM' | 'BUFF';
    validadeDias: number;
}

export interface Quest {
    _id: string;
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    validationType: ValidationType;
    status: QuestStatus;
    expiresAt?: string;
    createdAt: string;
    keys: QuestKey[];
    usedCount: number;
    rewardItems?: RewardItem[];
}

export interface FormState {
    title: string;
    description: string;
    type: QuestType;
    rewardPc: number;
    badgeId: string;
    validationType: ValidationType;
    expiresAt: string;
    generateKeysCount: number;
    rewardItems: RewardItem[];
}

// ─────────────────────────────────────────────────────────────────
// CATÁLOGO DE BADGES DISPONÍVEIS PARA MISSÕES
// ─────────────────────────────────────────────────────────────────
export const BADGE_OPTIONS: { value: string; label: string; group: string }[] = [
    // Badges de Acesso — desbloqueiam a vitrine da loja
    { value: 'AC_BRONZE',     label: '🔓 Acesso: Bronze',      group: 'ACESSO' },
    { value: 'AC_PRATA',      label: '🔓 Acesso: Prata',       group: 'ACESSO' },
    { value: 'AC_OURO',       label: '🔓 Acesso: Ouro',        group: 'ACESSO' },
    { value: 'AC_DIAMANTE',   label: '🔓 Acesso: Diamante',    group: 'ACESSO' },
    { value: 'AC_EPICO',      label: '🔓 Acesso: Épico',       group: 'ACESSO' },
    { value: 'AC_LENDARIO',   label: '🔓 Acesso: Lendário',    group: 'ACESSO' },
    { value: 'AC_SUPREMO',    label: '🔓 Acesso: Supremo',     group: 'ACESSO' },
    { value: 'AC_MITOLOGICO', label: '🔓 Acesso: Mitológico',  group: 'ACESSO' },
    { value: 'AC_SOBERANO',   label: '🔓 Acesso: Soberano',    group: 'ACESSO' },

    // Badges de Funcionalidade — desbloqueiam features do sistema
    { value: 'PODE_TRANSFERIR',       label: '💸 Pode Transferir (PIX Escolar)',      group: 'FUNCIONALIDADE' },
    { value: 'PODE_FAZER_TRADE',      label: '🔄 Pode Fazer Trade (Mercado P2P)',     group: 'FUNCIONALIDADE' },
    { value: 'PODE_COMPRAR_VENDER',   label: '🛍️ Marketplace (Compra e Venda)',       group: 'FUNCIONALIDADE' },
    { value: 'PODE_PEDIR_EMPRESTIMO', label: '🏦 Pode Pedir Empréstimo (ETE Bank)',   group: 'FUNCIONALIDADE' },
    { value: 'PODE_COMPRAR_NOTAS',    label: '📝 Pode Comprar Notas (M. Notas)',      group: 'FUNCIONALIDADE' },
    
    // Badges de Rank — desbloqueiam skills de rank (Exigem Verificação Dupla)
    { value: 'BRONZE',     label: '🥉 Guardião de Bronze',      group: 'RANK' },
    { value: 'PRATA',      label: '🥈 Cavaleiro de Prata',      group: 'RANK' },
    { value: 'OURO',       label: '🥇 Campeão de Ouro',         group: 'RANK' },
    { value: 'DIAMANTE',   label: '💎 Mestre Diamante',         group: 'RANK' },
    { value: 'EPICO',      label: '👑 Herói Épico',             group: 'RANK' },
    { value: 'LENDARIO',   label: '🌟 Lendário da ETE',         group: 'RANK' },
    { value: 'SUPREMO',    label: '🔥 Supremo Imortal',         group: 'RANK' },
    { value: 'MITOLOGICO', label: '🔱 Entidade Mitológica',     group: 'RANK' },
    { value: 'SOBERANO',   label: '⚡ Soberano Absoluto',       group: 'RANK' },
];

export const TYPE_CFG: Record<QuestType, { label: string; icon: any; color: string; border: string; bg: string }> = {
    DIARIA: { label: 'DIARIA', icon: Clock, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    SEMANAL: { label: 'SEMANAL', icon: Calendar, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    EVENTO: { label: 'EVENTO', icon: Flame, color: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
    MENSAL: { label: 'MENSAL', icon: Trophy, color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
    CAMPANHA: { label: 'CAMPANHA', icon: Crown, color: 'text-fuchsia-400', border: 'border-fuchsia-500/50', bg: 'bg-fuchsia-500/10' },
    FUNCIONALIDADE: { label: 'FUNCIONALIDADE', icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
};
