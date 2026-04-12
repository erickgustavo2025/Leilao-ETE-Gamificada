// backend/src/server.js
require('dotenv').config({ quiet: true });
const cluster = require('cluster');
const os = require('os');
const { createAdapter } = require('@socket.io/mongo-adapter');
const mongoose = require('mongoose');

const app = require('./app');
const connectDB = require('./config/db');
const cronService = require('./services/cronService');
const http = require('http');
const { Server } = require('socket.io');
const chatSocket = require('./services/chatSocket');

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

// ✅ FATOR DE ESCALA: Usar Cluster para Alta Disponibilidade
if (cluster.isPrimary) {
    console.log(`🚀 [MASTER] Cluster iniciado. Criando ${numCPUs} processos workers...`);
    
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.warn(`🚨 [MASTER] Worker ${worker.process.pid} morreu (${signal || code}). Reiniciando...`);
        cluster.fork();
    });

} else {
    // 🛠️ WORKER PROCESS LOGIC
    const startServer = async () => {
        try {
            console.log(`🔌 [Worker ${process.pid}] Conectando ao Banco de Dados...`);
            await connectDB();

            // Só o primary ou um worker específico roda o cron para evitar duplicidade de execuções
            if (cluster.worker.id === 1) {
                console.log('⏰ [Cron] Iniciando serviços de agendamento...');
                cronService.initCron();
            }

            const server = http.createServer(app);

            // ⚡ CONFIGURAÇÃO DE SOCKET COM ADAPTADOR (Escala Horizontal)
            // Permite sincronizar mensagens entre diferentes núcleos da CPU
            const ALLOWED_ORIGINS = process.env.FRONTEND_URL
                ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
                : ['http://localhost:5173'];

            const io = new Server(server, {
                cors: {
                    origin: ALLOWED_ORIGINS,
                    methods: ['GET', 'POST'],
                    credentials: true
                }
            });

            // Cria coleção para sincronização de sockets se o mongoose estiver pronto
            const collection = mongoose.connection.db.collection('socket_adapter');
            io.adapter(createAdapter(collection));

            global.io = io;
            chatSocket(io);

            io.on('connection', (socket) => {
                socket.on('join_user_room', (userId) => {
                    socket.join(userId);
                });
            });

            server.listen(PORT, () => {
                console.log(`🔥 [Worker ${process.pid}] Servidor rodando na porta ${PORT}`);
            });

        } catch (error) {
            console.error(`❌ [Worker ${process.pid}] Falha crítica ao iniciar:`, error);
            process.exit(1);
        }
    };

    startServer();
}
