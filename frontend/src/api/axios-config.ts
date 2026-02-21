import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de Request — injeta o token automaticamente
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('@ETEGamificada:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor de Response — tratamento global de erros
api.interceptors.response.use(
    response => response,
    error => {
        // 503 = Manutenção
        if (error.response?.status === 503) {
            if (!window.location.pathname.includes('/maintenance')) {
                window.location.href = '/maintenance';
            }
        }

        // 401 = Token expirado — logout automático
        // Remove TUDO, incluindo lastPath e dados de impersonate
        // para não contaminar a próxima sessão
        if (error.response?.status === 401) {
            localStorage.removeItem('@ETEGamificada:token');
            localStorage.removeItem('@ETEGamificada:user');
            localStorage.removeItem('@ETEGamificada:lastPath');
            localStorage.removeItem('@ETEGamificada:originalToken');
            localStorage.removeItem('@ETEGamificada:originalUser');
            localStorage.removeItem('@ETEGamificada:originalLastPath');

            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);
