
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export const getImageUrl = (path: string | undefined | null) => {
    // 1. Fallback padrão se vier vazio
    if (!path) return '/assets/store.png'; 

    // 2. Se já for uma URL completa (http...), retorna ela mesma
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // 3. Se for um Asset do Frontend (começa com /assets), retorna direto sem chamar a API
    if (path.startsWith('/assets') || path.startsWith('assets/')) {
        return path.startsWith('/') ? path : `/${path}`;
    }

    // 4. Se for um Upload do Backend (ex: "uploads/foto.png")
    // Garante que não tenha barra dupla e limpa o caminho
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Se o caminho não tiver "uploads/" no começo, adiciona (para compatibilidade do banco)
    const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;

    // Monta a URL final unindo a URL dinâmica do servidor com a imagem
    return `${API_URL}/${finalPath}`;
};