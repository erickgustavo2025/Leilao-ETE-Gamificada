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

// ✅ FATOR DE ESCALA: Usar Cluster apenas em Produção para estabilidade no DEV
const useCluster = process.env.NODE_ENV === 'production' || process.env.USE_CLUSTER === 'true';

if (cluster.isPrimary && useCluster) {
    console.log(`🚀 [MASTER] Cluster iniciado (PROD/FORCED). Criando ${numCPUs} processos workers...`);
    
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
            const isStandalone = !cluster.worker;
            const isFirstWorker = cluster.worker && cluster.worker.id === 1;

            console.log(`🔌 [${isStandalone ? 'Standalone' : 'Worker ' + process.pid}] Conectando ao Banco de Dados...`);
            await connectDB();

            // Só o standalone ou o worker 1 roda o cron para evitar duplicidade
            if (isStandalone || isFirstWorker) {
                console.log(`⏰ [Cron] Iniciando serviços de agendamento (${isStandalone ? 'Standalone' : 'Worker 1'})...`);
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
                console.log(`🔥 [${isStandalone ? 'Standalone' : 'Worker ' + process.pid}] Servidor rodando na porta ${PORT}`);
                if (isStandalone) console.log('💡 DICA: Para usar Cluster no DEV, use: $env:USE_CLUSTER="true"; npm run dev');
            });

        } catch (error) {
            console.error(`❌ [Worker ${process.pid}] Falha crítica ao iniciar:`, error);
            process.exit(1);
        }
    };

    startServer();
}
