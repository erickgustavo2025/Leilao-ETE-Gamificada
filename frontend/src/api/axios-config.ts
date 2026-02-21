import axios from 'axios';

// 👇 MUDANÇA AQUI: Pega do .env ou usa o padrão
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor (Para enviar o token automaticamente se existir)
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('@ETEGamificada:token'); // ⚠️ GARANTINDO QUE A CHAVE É A MESMA DO AUTH CONTEXT
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Response (Tratamento Global de Erros)
api.interceptors.response.use(
    response => response,
    error => {
        // Erro 503 = Manutenção
        if (error.response?.status === 503) {
            // Redireciona para página de manutenção
            if (!window.location.pathname.includes('/maintenance')) {
                window.location.href = '/maintenance';
            }
        }
        
        // Erro 401 = Token expirado (logout automático)
        if (error.response?.status === 401) {
            localStorage.removeItem('@ETEGamificada:token');
            localStorage.removeItem('@ETEGamificada:user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);