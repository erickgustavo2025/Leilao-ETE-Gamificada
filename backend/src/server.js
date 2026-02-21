// backend/src/server.js
require('dotenv').config({ quiet: true });
const app = require('./app');
const connectDB = require('./config/db');
const cronService = require('./services/cronService');
const http = require('http');
const { Server } = require('socket.io');
const chatSocket = require('./services/chatSocket');

const PORT = process.env.PORT || 3000;

// ✅ FIX: CORS do Socket.io restrito aos domínios autorizados
// Antes era origin: "*" — qualquer site podia conectar no WS
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : ['http://localhost:5173'];

const startServer = async () => {
    try {
        console.log('🔌 Conectando ao Banco de Dados...');
        await connectDB();
        console.log('✅ MongoDB Conectado!');

        cronService.initCron();

        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: ALLOWED_ORIGINS, // ✅ Só os domínios do .env passam
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        global.io = io;

        chatSocket(io);

        io.on('connection', (socket) => {
            console.log(`📡 Novo cliente conectado: ${socket.id}`);

            socket.on('join_user_room', (userId) => {
                socket.join(userId);
            });

            socket.on('disconnect', () => {
                // silencioso em produção
            });
        });

        server.listen(PORT, () => {
            console.log(`🔥 Servidor HTTP + WebSocket rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Falha crítica ao iniciar:', error);
        process.exit(1);
    }
};

startServer();
