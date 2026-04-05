import type { RankRule } from '../contexts/AuthContext';

export function calculateRank(points: number, ranks: RankRule[]): RankRule {
    const sorted = [...ranks].sort((a, b) => b.min - a.min);
    return sorted.find(r => points >= r.min) || sorted[sorted.length - 1];
}

export function calculateRankProgress(points: number, ranks: RankRule[]) {
    const currentRank = calculateRank(points, ranks);
    const ranksAsc = [...ranks].sort((a, b) => a.min - b.min);
    const nextRank = ranksAsc.find(r => r.min > points);

    if (!nextRank) {
        return {
            nextRank: null,
            pointsToNext: 0,
            percentage: 100,
            isMaxRank: true
        };
    }

    const prevLimit = currentRank.min;
    const totalRange = nextRank.min - prevLimit;
    const currentProgress = points - prevLimit;
    const percentage = Math.min(100, Math.max(0, (currentProgress / totalRange) * 100));

    return {
        nextRank: nextRank.name,
        pointsToNext: nextRank.min - points,
        percentage,
        isMaxRank: false
    };
}