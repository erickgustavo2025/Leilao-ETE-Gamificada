import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/axios-config';
import { toast } from 'sonner';

// --- CHAVES DO LOCALSTORAGE ---
const KEYS = {
  token:            '@ETEGamificada:token',
  user:             '@ETEGamificada:user',
  lastPath:         '@ETEGamificada:lastPath',
  originalToken:    '@ETEGamificada:originalToken',
  originalUser:     '@ETEGamificada:originalUser',
  originalLastPath: '@ETEGamificada:originalLastPath',
} as const;

// --- TIPAGEM DO USUÁRIO ---
export interface InventoryItem {
    _id: string;
    itemId?: string;
    skillCode?: string;
    name: string;
    descricao?: string;
    image: string;
    imagem?: string;
    rarity: string;
    raridade?: string;
    category: 'CONSUMIVEL' | 'PERMANENTE' | 'RANK_SKILL' | 'TICKET';
    quantity: number;
    usesMax?: number;
    usesLeft?: number;
    expiresAt?: string;
    acquiredAt: string;
    origin?: string;
}

export interface ActiveBuff {
    effect: string;
    name: string;
    source: string;
    expiresAt?: string;
}

export interface User {
    _id: string;
    id: string;
    nome: string;
    email: string;
    matricula: string;
    dataNascimento?: string;
    role: 'student' | 'admin' | 'dev' | 'monitor';
    saldoPc: number;
    maxPcAchieved?: number;
    turma?: string;
    rank?: string;
    isVip?: boolean;
    avatar?: string;
    cargos?: string[];
    isBlocked?: boolean;
    inventory: InventoryItem[];
    activeBuffs: ActiveBuff[];
    xp?: number;
    achievements?: any[];
}

export interface RankRule {
    name: string;
    min: number;
    color: string;
    border: string;
}

interface AuthContextData {
    signed: boolean;
    user: User | null;
    loading: boolean;
    ranks: RankRule[];
    soundEnabled: boolean;
    isImpersonating: boolean;
    toggleSound: () => void;
    signIn: (matricula: string, senha: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (userData: User) => void;
    impersonate: (token: string, targetUser: User) => void;
    exitImpersonate: () => Promise<string>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

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

    const fetchRules = useCallback(async () => {
        try {
            const res = await api.get('/auth/rules');
            if (res.data?.ranks) {
                setRanks(res.data.ranks);
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

            if (storedToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                try {
                    await Promise.all([refreshUser(), fetchRules()]);
                } catch (error) {
                    console.error("Falha ao atualizar sessão:", error);
                }
            }
            setLoading(false);
        }

        loadStorageData();
    }, []);

    useEffect(() => {
        if (user && ranks.length === 0) {
            fetchRules();
        }
    }, [user, ranks.length]);

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
    }, []);

    function updateUser(userData: User) {
        const safeUser: User = {
            ...userData,
            inventory: userData.inventory || [],
            activeBuffs: userData.activeBuffs || []
        };
        setUser(safeUser);

        setTimeout(() => {
            try {
                localStorage.setItem(KEYS.user, JSON.stringify(safeUser));
            } catch (error) {
                console.warn("Erro ao salvar cache", error);
            }
        }, 0);
    }

    // ─────────────────────────────────────────────────────────────
    // IMPERSONATE — entra na sessão de outro usuário
    // Salva TUDO do dev (token, user, lastPath) antes de trocar
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // EXIT IMPERSONATE — restaura a sessão original do dev
    // ─────────────────────────────────────────────────────────────
    // Retorna o path para onde navegar — lido ANTES de setIsImpersonating(false)
    // para evitar que o PathTracker sobrescreva o lastPath restaurado
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

        // ⚠️ setIsImpersonating(false) dispara re-render do PathTracker
        // que salvaria /dashboard como lastPath — por isso capturamos
        // o destino ANTES e o retornamos para o chamador usar diretamente
        setIsImpersonating(false);

        if (originalUser) {
            try {
                updateUser(JSON.parse(originalUser));
            } catch {
                // cache corrompido — refreshUser vai resolver
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

        // Retorna o path original capturado antes do re-render
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
            impersonate,
            exitImpersonate,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
    return context;
}
