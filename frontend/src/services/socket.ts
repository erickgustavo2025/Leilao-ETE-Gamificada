import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket;

export const getSocket = () => {
  if (!socket) {
    // ✅ Pega o token no momento de criar o socket
    // Assim garante que sempre pega o token atual (mesmo após login)
    const token = localStorage.getItem('@ETEGamificada:token');

    socket = io(URL, {
      autoConnect: false,
      auth: { token } // ✅ Enviado no handshake — validado pelo chatSocket.js no backend
    });
  }
  return socket;
};

// Utilitário para reconectar com token atualizado (ex: após login)
// Chame isso logo após o login bem-sucedido se precisar recriar o socket
export const resetSocket = () => {
  if (socket?.connected) socket.disconnect();
  socket = undefined as unknown as Socket;
  return getSocket();
};
