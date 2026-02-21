// backend/src/controllers/publicController.js
const User = require('../models/User');
const Item = require('../models/Item');
const Classroom = require('../models/Classroom');

// ✅ Cache simples em memória — evita 4 queries ao banco em cada visita da landing page
// Os dados ficam "frescos" por 2 minutos, depois são recalculados
let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

exports.getPublicStats = async (req, res) => {
    try {
        const now = Date.now();

        // Retorna cache se ainda estiver válido
        if (statsCache && (now - statsCacheTime) < CACHE_TTL_MS) {
            return res.json(statsCache);
        }

        // Recalcula tudo em paralelo (Promise.all = 4 queries simultâneas, não sequenciais)
        const [playersCount, xpAg, housesCount, auctionsCount] = await Promise.all([
            User.countDocuments({ role: { $in: ['student', 'monitor'] } }),
            User.aggregate([{ $group: { _id: null, total: { $sum: '$maxPcAchieved' } } }]),
            Classroom.countDocuments(),
            Item.countDocuments({ status: 'ativo' })
        ]);

        const result = {
            players: playersCount,
            xp: xpAg.length > 0 ? xpAg[0].total : 0,
            houses: housesCount,
            auctions: auctionsCount
        };

        // Atualiza cache
        statsCache = result;
        statsCacheTime = now;

        res.json(result);
    } catch (error) {
        console.error('Erro getPublicStats:', error);
        res.status(500).json({ error: 'Erro ao buscar stats públicos' });
    }
};
