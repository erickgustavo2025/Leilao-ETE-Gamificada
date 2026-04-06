const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MAX_HISTORY = 150;
const chatHistory = {
    'global': [],
    'auction': []
};

module.exports = (io) => {

    // ✅ Middleware de autenticação no handshake do socket
    // O frontend deve enviar o token assim:
    // socket = io(URL, { auth: { token: localStorage.getItem('@ETEGamificada:token') } })
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Token não fornecido.'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('nome role turma avatar isBlocked');

            if (!user) return next(new Error('Usuário não encontrado.'));
            if (user.isBlocked) return next(new Error('Conta bloqueada.'));

            // Anexa o user real (do banco) ao socket — cliente não pode forjar isso
            socket.user = {
                _id: user._id.toString(),
                nome: user.nome,
                role: user.role,
                turma: user.turma,
                avatar: user.avatar
            };

            next();
        } catch (err) {
            next(new Error('Token inválido.'));
        }
    });

    io.on('connection', (socket) => {
        // 🏫 ENTRAR AUTOMATICAMENTE NA SALA DA TURMA (Validado)
        if (socket.user.turma) {
            const turmaRoom = `turma_${socket.user.turma}`;
            socket.join(turmaRoom);
            console.log(`[Socket] Usuário ${socket.user.nome} entrou na sala ${turmaRoom}`);
        }


        // 🟢 ENTRAR NA SALA
        socket.on('join_chat_room', ({ room }) => {
            if (!room) return;

            // 🛡️ TRAVA DE SEGURANÇA: Alunos só podem entrar na sala da própria turma
            if (room.startsWith('turma_')) {
                const userTurmaRoom = `turma_${socket.user.turma}`;
                if (room !== userTurmaRoom && socket.user.role !== 'admin') {
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
                sender: socket.user, // ✅ Dados reais do banco, não do cliente
                timestamp: new Date().toISOString(),
                room // ✅ Adicionado para evitar vazamento de mensagens entre salas no frontend
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
    });
};
