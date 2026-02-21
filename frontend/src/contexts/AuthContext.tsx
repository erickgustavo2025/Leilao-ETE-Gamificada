import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/axios-config';
import { toast } from 'sonner';

// --- TIPAGEM DO USUÁRIO ---
export interface InventoryItem {
    _id: string;
    itemId?: string; // ID de referência da StoreItem
    skillCode?: string; // 🔥 ADICIONE ESTA LINHA (Identificador da Skill)
    name: string;
    descricao?: string; // 🔥 ADICione para evitar erro na descrição
    image: string; // Padrão novo
    imagem?: string; // Legado para compatibilidade
    rarity: string; // Padrão novo (Bronze, Ouro, etc)
    raridade?: string; // Legado para compatibilidade
    category: 'CONSUMIVEL' | 'PERMANENTE' | 'RANK_SKILL' | 'TICKET';
    quantity: number;
    usesMax?: number; // Para skills
    usesLeft?: number; // Para skills
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
    toggleSound: () => void;
    signIn: (matricula: string, senha: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [ranks, setRanks] = useState<RankRule[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Função para buscar regras (isolada para usar em vários lugares)
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
            const storedToken = localStorage.getItem('@ETEGamificada:token');
            const storedUser = localStorage.getItem('@ETEGamificada:user');

            if (storedToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                // Tenta atualizar tudo
                try {
                    await Promise.all([refreshUser(), fetchRules()]);
                } catch (error) {
                    console.error("Falha ao atualizar sessão:", error);
                }
            }
            setLoading(false);
        }

        loadStorageData();
    }, []); // Executa apenas uma vez no mount

    // 🔥 GARANTIA: Se estiver logado mas sem ranks, busca os ranks
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
            localStorage.setItem('@ETEGamificada:token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            toast.success(`Bem-vindo, ${userData.nome.split(' ')[0]}!`);
            await fetchRules(); // Garante que as regras venham no login

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
        localStorage.removeItem('@ETEGamificada:token');
        localStorage.removeItem('@ETEGamificada:user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setRanks([]);
        window.location.href = '/';
    }

    // 🔥 CORREÇÃO: useCallback impede que essa função mude a cada render,
    // evitando o loop infinito no useEffect do DashboardHome
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
                localStorage.setItem('@ETEGamificada:user', JSON.stringify(safeUser));
            } catch (error) {
                console.warn("Erro ao salvar cache", error);
            }
        }, 0);
    }

    return (
        <AuthContext.Provider value={{
            signed: !!user, user, loading, ranks, soundEnabled, toggleSound,
            signIn, logout, refreshUser, updateUser
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