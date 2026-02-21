const { RANKS } = require('../config/gameRules');

/**
 * Calcula o rank atual baseado nos pontos históricos
 * @param {number} points - maxPcAchieved do usuário
 * @returns {Object} - { name, min, color, border }
 */
function calculateRank(points = 0) {
    const sorted = [...RANKS].sort((a, b) => b.min - a.min);
    return sorted.find(r => points >= r.min) || sorted[sorted.length - 1];
}

/**
 * Calcula progresso até o próximo rank
 * @param {number} points - maxPcAchieved do usuário
 * @returns {Object} - { nextRank, pointsToNext, percentage, isMaxRank }
 */
function calculateRankProgress(points = 0) {
    const currentRank = calculateRank(points);
    const ranksAsc = [...RANKS].sort((a, b) => a.min - b.min);
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

module.exports = { calculateRank, calculateRankProgress };