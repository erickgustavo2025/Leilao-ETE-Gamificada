export interface InventoryItem {
    _id: string;
    itemId?: string;
    skillCode?: string;
    name: string;
    descricao?: string;
    image: string;
    imagem?: string;
    rarity: string;
    raridade?: string;
    category: 'CONSUMIVEL' | 'PERMANENTE' | 'RANK_SKILL' | 'TICKET';
    quantity: number;
    usesMax?: number;
    usesLeft?: number;
    expiresAt?: string;
    acquiredAt: string;
    origin?: string;
}

export interface ActiveBuff {
    effect: string;
    name: string;
    source: string;
    expiresAt?: string;
}

export interface UserInvestment {
    symbol: string;
    quantity: number;
    averagePrice: number;
    assetType: 'STOCK' | 'CRYPTO';
    updatedAt: string;
}

export interface VinculoAcademico {
    disciplinaId: string;
    nomeDisciplina?: string;
    ano: string;
    curso: string;
    turmas: string[];
    isRedacao?: boolean;
}

export interface User {
    _id: string;
    id: string;
    nome: string;
    email: string;
    matricula: string;
    usuario?: string; // Para professores
    dataNascimento?: string;
    role: 'student' | 'admin' | 'dev' | 'monitor' | 'professor';
    saldoPc: number;
    maxPcAchieved?: number;
    turma?: string;
    rank?: string;
    isVip?: boolean;
    avatar?: string;
    cargos?: string[];
    isBlocked?: boolean;
    privacyAccepted?: boolean;
    privacyAcceptedAt?: string;
    privacyVersion?: string;
    inventory: InventoryItem[];
    activeBuffs: ActiveBuff[];
    investments: UserInvestment[];
    disciplinas?: VinculoAcademico[]; // Para professores
    xp?: number;
    achievements?: any[];
}

export interface RankRule {
    name: string;
    min: number;
    color: string;
    border: string;
}
