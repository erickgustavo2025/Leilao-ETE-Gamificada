import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('@ETEGamificada:token');

    socket = io(URL, {
      autoConnect: false,
      auth: { token }
    });
  }
  return socket;
};

// Conectar explicitamente
export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

// Utilitário para reconectar com token atualizado (ex: após login)
// Chame isso logo após o login bem-sucedido se precisar recriar o socket
export const resetSocket = () => {
  if (socket?.connected) socket.disconnect();
  socket = undefined as unknown as Socket;
  return getSocket();
};
