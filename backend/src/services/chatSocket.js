const jwt = require('jsonwebtoken');
const User = require('../models/User');
const engagementController = require('../controllers/engagementController');

const MAX_HISTORY = 150;
const chatHistory = {
    'global': [],
    'auction': []
};

module.exports = (io) => {

    // --- 🔬 MÓDULO CIENTÍFICO: RASTREIO LIVE ---
    let liveUsersCount = 0;

    const broadcastLiveStats = async () => {
        const sockets = await io.fetchSockets();
        let users = 0;
        let guests = 0;

        sockets.forEach(s => {
            if (s.user && s.user._id) {
                users++;
            } else {
                guests++;
            }
        });

        io.emit('LIVE_STATS_UPDATE', { 
            online: users,
            guests: guests
        });
        
        // Atualiza o pico no banco silenciosamente (usa o total)
        engagementController.updateLivePeak(users + guests);
    };

    // Atualiza a cada 2 minutos ou na conexão
    setInterval(broadcastLiveStats, 1000 * 60 * 2);

    // ✅ Middleware de autenticação no handshake do socket
    // O frontend deve enviar o token assim:
    // socket = io(URL, { auth: { token: localStorage.getItem('@ETEGamificada:token') } })
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            
            // ✅ MODO GUEST: Não barra a conexão se não houver token
            if (!token) {
                socket.user = { role: 'guest' };
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('nome role turma avatar isBlocked');

            if (!user) {
                socket.user = { role: 'guest' };
                return next();
            }

            if (user.isBlocked) return next(new Error('Conta bloqueada.'));

            socket.user = {
                _id: user._id.toString(),
                nome: user.nome,
                role: user.role,
                turma: user.turma,
                avatar: user.avatar
            };

            next();
        } catch (err) {
            socket.user = { role: 'guest' };
            next();
        }
    });

    io.on('connection', (socket) => {
        // 🏫 ENTRAR AUTOMATICAMENTE NA SALA DA TURMA (Apenas Alunos Logados)
        if (socket.user && socket.user._id && socket.user.turma) {
            const turmaRoom = `turma_${socket.user.turma}`;
            socket.join(turmaRoom);
        }

        if (socket.user.role === 'guest') {
            socket.join('public_visitors');
        }

        // Notifica todos sobre a nova contagem ao conectar
        broadcastLiveStats();

        // 🟢 ENTRAR NA SALA
        socket.on('join_chat_room', ({ room }) => {
            if (!room || !socket.user?._id) return; // Bloqueia Guest

            // 🛡️ TRAVA DE SEGURANÇA: Alunos só podem entrar na sala da própria turma
            if (room.startsWith('turma_')) {
                const userTurma = socket.user.turma ? socket.user.turma.trim() : null;
                const requestedTurma = room.replace('turma_', '').trim();
                
                if (requestedTurma !== userTurma && socket.user.role !== 'admin') {
                    console.warn(`[SECURITY] Tentativa de invasão de sala: ${socket.user.nome} tentou entrar em ${room}`);
                    return; // Bloqueia o join
                }
            }

            socket.join(room);

            const history = chatHistory[room] || [];
            socket.emit('chat_history', history);
        });

        // 🔴 SAIR DA SALA
        socket.on('leave_chat_room', (room) => {
            socket.leave(room);
        });

        // 📨 ENVIAR MENSAGEM — user vem do socket.user (validado no handshake)
        socket.on('send_message', ({ room, message }) => {
            if (!socket.user?._id) return; // Bloqueia Guest

            // 🛡️ TRAVA DE SEGURANÇA NO TOPO: Validar se o usuário pertence à sala antes de qualquer processamento
            if (room.startsWith('turma_')) {
                const userTurmaRoom = `turma_${socket.user.turma}`;
                if (room !== userTurmaRoom) {
                    console.warn(`⚠️ BLOQUEIO: Tentativa de envio para sala não autorizada: ${socket.user.nome} -> ${room}`);
                    return;
                }
            }

            if (!message || !message.trim()) return;

            // Limita tamanho da mensagem para evitar spam/flood
            const text = message.trim().slice(0, 500);

            const msgData = {
                id: Date.now().toString(),
                text,
                sender: socket.user, 
                timestamp: new Date().toISOString(),
                room 
            };

            // Gerenciamento de Histórico (Apenas após validação)
            if (!chatHistory[room]) chatHistory[room] = [];
            chatHistory[room].push(msgData);

            if (chatHistory[room].length > MAX_HISTORY) {
                chatHistory[room].shift();
            }

            // ✅ EMISSÃO SEGURA: Usar io.to(room).emit garante que APENAS os membros da sala recebam.
            io.to(room).emit('receive_message', msgData);
        });

        socket.on('disconnect', () => {
            broadcastLiveStats();
        });
    });
};
