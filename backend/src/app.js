const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
const rouletteRoutes = require('./routes/rouletteRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const houseHistoryRoutes = require('./routes/houseHistoryRoutes');

// Middlewares e Models
const { checkMaintenance } = require('./middlewares/maintenanceMiddleware');
const logger = require('./services/logger');
const SystemConfig = require('./models/SystemConfig');

require('./models/GameSkill');

const app = express();
app.set("trust proxy", 1);

// 🔒 CORS INTELIGENTE (PRODUÇÃO / DEV)
// Lê a variável FRONTEND_URL do .env (se não existir, libera localhost)
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : ['http://localhost:5173',];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (Postman/Mobile) ou se a origem estiver na lista permitida
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

// Helmet (Permite carregar imagens de outros domínios se precisar)
app.use(helmet({
    crossOriginResourcePolicy: false, 
}));

app.use(express.json());

// RATE LIMITERS (Ajustados para Dev/Teste)
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: "Muitas requisições." });
app.use('/api/', generalLimiter);

// 📂 SERVIR IMAGENS (Correção da Lógica)
// Tenta achar a pasta de uploads em dois lugares comuns
let uploadDir = path.join(__dirname, '../public/uploads'); 
if (!fs.existsSync(uploadDir)) {
    // Se não achar em public, tenta na raiz (padrão docker as vezes)
    uploadDir = path.join(__dirname, '../uploads');
}

// Garante que a pasta existe para não dar crash
if (!fs.existsSync(uploadDir)) {
    console.log("⚠️ Pasta de uploads não encontrada. Criando em:", uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("📂 Servindo uploads de:", uploadDir);
app.use('/uploads', express.static(uploadDir));

// --- 3. PORTEIRO ---
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
app.use('/api/roulette', rouletteRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/bank', bankRoutes); 
app.use('/api/public', publicRoutes);
app.use('/api/house', houseRoutes);
app.use('/api/beco', houseShopRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/house-history', houseHistoryRoutes);


// Fallback da API
app.use((req, res) => {
    res.status(404).json({ message: 'Rota da API não encontrada.' });
});

module.exports = app;