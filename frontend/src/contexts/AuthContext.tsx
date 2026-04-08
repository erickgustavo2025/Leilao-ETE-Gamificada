import { createContext, useContext } from 'react';
import type { User, RankRule } from '../types/auth';

export interface AuthContextData {
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
    completeLogin: (userData: User, token: string) => Promise<void>;
    impersonate: (token: string, targetUser: User) => void;
    exitImpersonate: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
    return context;
}
