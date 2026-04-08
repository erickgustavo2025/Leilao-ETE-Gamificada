import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/axios-config';
import { toast } from 'sonner';
import type { User, RankRule } from '../types/auth';
import { AuthContext } from './AuthContext';

// --- CHAVES DO LOCALSTORAGE ---
const KEYS = {
  token:            '@ETEGamificada:token',
  user:             '@ETEGamificada:user',
  lastPath:         '@ETEGamificada:lastPath',
  originalToken:    '@ETEGamificada:originalToken',
  originalUser:     '@ETEGamificada:originalUser',
  originalLastPath: '@ETEGamificada:originalLastPath',
  ranks:            '@ETEGamificada:ranks',
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [ranks, setRanks] = useState<RankRule[]>([]);
    const [loading, setLoading] = useState(true);

    // Impersonating é derivado de ter o token original salvo
    const [isImpersonating, setIsImpersonating] = useState(
        () => !!localStorage.getItem(KEYS.originalToken)
    );

    const [soundEnabled, setSoundEnabled] = useState(() => {
        const stored = localStorage.getItem('@ETEGamificada:sound');
        return stored !== 'false';
    });

    const toggleSound = () => {
        setSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('@ETEGamificada:sound', String(newValue));
            return newValue;
        });
    };

    const updateUser = useCallback((userData: User) => {
        const safeUser: User = {
            ...userData,
            inventory: userData.inventory || [],
            activeBuffs: userData.activeBuffs || [],
            investments: userData.investments || []
        };
        setUser(safeUser);

        setTimeout(() => {
            try {
                localStorage.setItem(KEYS.user, JSON.stringify(safeUser));
            } catch (error) {
                console.warn("Erro ao salvar cache", error);
            }
        }, 0);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            const userData = response.data;
            if (userData && userData.id) {
                updateUser(userData);
            }
        } catch (error) {
            console.error("Erro ao atualizar usuário", error);
        }
    }, [updateUser]);

    const fetchRules = useCallback(async () => {
        try {
            const res = await api.get('/auth/rules');
            if (res.data?.ranks) {
                setRanks(res.data.ranks);
                localStorage.setItem(KEYS.ranks, JSON.stringify(res.data.ranks));
            }
        } catch (e) {
            console.error("Falha ao buscar regras", e);
        }
    }, []);

    // Carregamento Inicial
    useEffect(() => {
        async function loadStorageData() {
            const storedToken = localStorage.getItem(KEYS.token);
            const storedUser = localStorage.getItem(KEYS.user);
            const storedRanks = localStorage.getItem(KEYS.ranks);

            if (storedToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                
                // --- CARREGAMENTO INSTATÂNEO (OPTIMISTIC) ---
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                        
                        if (storedRanks) {
                            setRanks(JSON.parse(storedRanks));
                        }
                        
                        // Já libera a tela aqui para quem já tem sessão!
                        setLoading(false);
                    } catch (e) {
                        console.warn("Erro ao ler dados do cachê", e);
                    }
                }

                // Sincroniza em background
                try {
                    const backgroundSync = Promise.all([refreshUser(), fetchRules()]);
                    if (!storedUser) await backgroundSync;
                } catch (error) {
                    console.error("Falha na sincronização de background:", error);
                }
            }
            
            setLoading(false);
        }

        loadStorageData();
    }, [fetchRules, refreshUser]);

    async function signIn(matricula: string, senha: string) {
        try {
            const response = await api.post('/auth/login', { matricula, senha });
            const { token, user: userData } = response.data;

            updateUser(userData);
            localStorage.setItem(KEYS.token, token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            toast.success(`Bem-vindo, ${userData.nome.split(' ')[0]}!`);
            await fetchRules();

        } catch (error: any) {
            console.error("Erro Login:", error);
            const errorMsg = error.response?.data?.issues
                ? error.response.data.issues.map((i: any) => i.message).join('. ')
                : error.response?.data?.error || 'Falha ao fazer login.';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    async function completeLogin(userData: User, token: string) {
        // 1. Persistência Imediata
        localStorage.setItem(KEYS.token, token);
        localStorage.setItem(KEYS.user, JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 2. Atualiza Estado
        setUser(userData);

        // 3. Sincronização Obrigatória de Regras (O que faltava!)
        try {
            await fetchRules();
        } catch (error) {
            console.error("Erro ao carregar regras pós-login:", error);
        }
    }

    function logout() {
        // Remove TUDO — incluindo lastPath e qualquer resquício de impersonate
        localStorage.removeItem(KEYS.token);
        localStorage.removeItem(KEYS.user);
        localStorage.removeItem(KEYS.lastPath);
        localStorage.removeItem(KEYS.originalToken);
        localStorage.removeItem(KEYS.originalUser);
        localStorage.removeItem(KEYS.originalLastPath);

        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setRanks([]);
        setIsImpersonating(false);
        window.location.href = '/';
    }

    function impersonate(newToken: string, targetUser: User) {
        // Bloqueia duplo impersonate
        if (isImpersonating) {
            toast.error("Já existe uma sessão ativa de impersonate. Saia antes de impersonar outro usuário.");
            return;
        }

        // Salva o estado completo do dev
        localStorage.setItem(KEYS.originalToken,    localStorage.getItem(KEYS.token) ?? '');
        localStorage.setItem(KEYS.originalUser,     localStorage.getItem(KEYS.user) ?? '');
        localStorage.setItem(KEYS.originalLastPath, localStorage.getItem(KEYS.lastPath) ?? '');

        // Troca para a sessão do aluno
        localStorage.setItem(KEYS.token, newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        updateUser(targetUser);

        // Limpa o lastPath para o PathTracker começar do zero
        // (evita que o dev vá pro lastPath do aluno ao sair)
        localStorage.removeItem(KEYS.lastPath);

        setIsImpersonating(true);
        toast.success(`👁️ Visualizando como: ${targetUser.nome}`);
    }

    async function exitImpersonate(): Promise<string> {
        const originalToken    = localStorage.getItem(KEYS.originalToken);
        const originalUser     = localStorage.getItem(KEYS.originalUser);
        const originalLastPath = localStorage.getItem(KEYS.originalLastPath);

        if (!originalToken) {
            logout();
            return '/';
        }

        // Restaura o token no axios ANTES de qualquer chamada
        api.defaults.headers.common['Authorization'] = `Bearer ${originalToken}`;
        localStorage.setItem(KEYS.token, originalToken);

        // Restaura o lastPath do admin
        if (originalLastPath) {
            localStorage.setItem(KEYS.lastPath, originalLastPath);
        } else {
            localStorage.removeItem(KEYS.lastPath);
        }

        // Limpa os dados de impersonate
        localStorage.removeItem(KEYS.originalToken);
        localStorage.removeItem(KEYS.originalUser);
        localStorage.removeItem(KEYS.originalLastPath);

        setIsImpersonating(false);

        if (originalUser) {
            try {
                updateUser(JSON.parse(originalUser));
            } catch {
                // cache corrompido
            }
        }

        try {
            await refreshUser();
            toast.success("Sessão restaurada.");
        } catch {
            toast.error("Token expirou. Faça login novamente.");
            logout();
            return '/';
        }

        return originalLastPath || '/admin/users';
    }

    return (
        <AuthContext.Provider value={{
            signed: !!user,
            user,
            loading,
            ranks,
            soundEnabled,
            isImpersonating,
            toggleSound,
            signIn,
            logout,
            refreshUser,
            updateUser,
            completeLogin,
            impersonate,
            exitImpersonate,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
