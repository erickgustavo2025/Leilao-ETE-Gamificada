const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MAX_HISTORY = 50;
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

        // 🟢 ENTRAR NA SALA
        socket.on('join_chat_room', ({ room }) => {
            if (!room) return;
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
            if (!message || !message.trim()) return;

            // Limita tamanho da mensagem para evitar spam/flood
            const text = message.trim().slice(0, 500);

            const msgData = {
                id: Date.now().toString(),
                text,
                sender: socket.user, // ✅ Dados reais do banco, não do cliente
                timestamp: new Date().toISOString()
            };

            if (!chatHistory[room]) chatHistory[room] = [];
            chatHistory[room].push(msgData);

            if (chatHistory[room].length > MAX_HISTORY) {
                chatHistory[room].shift();
            }

            io.to(room).emit('receive_message', msgData);
        });
    });
};