// ARQUIVO: frontend/src/pages/dashboard/types.ts

export interface Rank {
    name: string;
    min: number;
    color: string;
    border: string;
}

// A interface agora reflete APENAS o que o calculateRankProgress retorna
export interface XPInfo {
    nextRank: string | null;
    pointsToNext: number;
    percentage: number;
    isMaxRank: boolean;
    // Removido: current, next, currentRank (pois o helper não devolve e o Header não usa)
}