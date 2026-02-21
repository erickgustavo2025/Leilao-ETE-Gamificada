// ARQUIVO: backend/src/server.js

require('dotenv').config({ quiet: true });
const app = require('./app');
const connectDB = require('./config/db');
const cronService = require('./services/cronService');
const http = require('http');
const { Server } = require('socket.io');
const chatSocket = require('./services/chatSocket'); // ✅ IMPORTAÇÃO CORRETA

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        console.log('🔌 Conectando ao Banco de Dados...');
        await connectDB();
        console.log('✅ MongoDB Conectado!');

        // Cron Job
        cronService.initCron();

        // Cria servidor HTTP
        const server = http.createServer(app);

        // Configura Socket.io
        const io = new Server(server, {
            cors: {
                origin: "*", 
                methods: ["GET", "POST"]
            }
        });

        // ✅ Torna o IO global UMA VEZ
        global.io = io;

        // ✅ Inicializa Módulos de Socket
        chatSocket(io); // Lógica do Chat

        io.on('connection', (socket) => {
            console.log(`📡 Novo cliente conectado: ${socket.id}`);

            // Sala pessoal (Notificações)
            socket.on('join_user_room', (userId) => {
                socket.join(userId);
            });

            socket.on('disconnect', () => {
                // console.log(`❌ Cliente desconectado: ${socket.id}`);
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