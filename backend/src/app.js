const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Nota: express-mongo-sanitize foi removido pois é incompatível com Express 5 (getter errors).
// Rotas
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const devRoutes = require('./routes/devRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const giftRoutes = require('./routes/giftRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const economyRoutes = require('./routes/economyRoutes');
const marketRoutes = require('./routes/marketRoutes'); 
const bankRoutes = require('./routes/bankRoutes');
const publicRoutes = require('./routes/publicRoutes');
const houseRoutes = require('./routes/houseRoutes');
const houseShopRoutes = require('./routes/houseShopRoutes');
const storeRoutes = require('./routes/storeRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const houseHistoryRoutes = require('./routes/houseHistoryRoutes');
const questRoutes = require('./routes/questRoutes');
const adminQuestRoutes = require('./routes/adminQuestRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const startupRoutes = require('./routes/startupRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notasRoutes = require('./routes/notasRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const adminEconomyRoutes = require('./routes/adminEconomyRoutes');
const adminRegulationRoutes = require('./routes/adminRegulationRoutes');
const publicRegulationRoutes = require('./routes/publicRegulationRoutes');
const surveyRoutes = require('./routes/surveyRoutes');

// Middlewares e Models
const { checkMaintenance } = require('./middlewares/maintenanceMiddleware');
const logger = require('./services/logger');
const SystemConfig = require('./models/SystemConfig');

require('./models/GameSkill');
require('./models/ChatSession');

const app = express();
app.set("trust proxy", 1);

// 🔒 CORS INTELIGENTE (PRODUÇÃO / DEV)
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : ['http://localhost:5173',];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 CORS Bloqueado: Origem não permitida -> ${origin}`);
            callback(new Error('Acesso negado pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: false, 
}));

app.use(express.json());

// O mongoSanitize causava TypeError com o Express 5. O Mongoose já filtra boa parte via schemas.

// 🛡️ RATE LIMITERS ESPECÍFICOS (Proteção contra Brute Force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 20 : 100, // Reduzido de 500 para 100 (ainda permite Playwright)
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." }
});
app.use('/api/auth/login', authLimiter);

const questValidationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30, // 30 tentativas por 10 min
    message: { error: "Muitas tentativas de validação. Tente novamente em 10 minutos." }
});
app.use('/api/quests/validate', questValidationLimiter);

// RATE LIMITER GERAL (Ajustado para evitar bloqueios em massa na escola)
const generalLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 300, // Reduzido de 1000 para 300
    message: "Muitas requisições vindas deste IP." 
});
app.use('/api/', generalLimiter);

// 📂 SERVIR IMAGENS
let uploadDir = path.join(__dirname, '../public/uploads'); 
if (!fs.existsSync(uploadDir)) {
    uploadDir = path.join(__dirname, '../uploads');
}
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

app.use(checkMaintenance); 

// --- 4. ROTAS DA API ---
app.use('/api/auth', authRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/bank', bankRoutes); 
app.use('/api/public', publicRoutes);
app.use('/api/house', houseRoutes);
app.use('/api/beco', houseShopRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/house-history', houseHistoryRoutes);
app.use('/api/quests', questRoutes); 
app.use('/api/admin/quests', adminQuestRoutes);
app.use('/api/investimentos', investmentRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/economy', adminEconomyRoutes);
app.use('/api/admin/regulations', adminRegulationRoutes);
app.use('/api/regulations', publicRegulationRoutes);
app.use('/api/surveys', surveyRoutes);

// Middleware de erro opaco para segurança
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err.stack);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Rota da API não encontrada.' });
});

module.exports = app;
