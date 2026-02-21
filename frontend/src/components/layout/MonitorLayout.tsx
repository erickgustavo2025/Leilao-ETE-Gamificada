import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, History, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGameSound } from '../../hooks/useGameSound';

export function MonitorLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { playClick } = useGameSound();

    const MENU_ITEMS = [
        { path: '/monitor', icon: Shield, label: 'Turma' },
        { path: '/monitor/scanner', icon: QrCode, label: 'Scanner' },
        { path: '/monitor/history', icon: History, label: 'Histórico' },
    ];

    const handleLogout = () => {
        playClick();
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-mono">
            
            {/* 1. HEADER SIMPLES (Topo Fixo) */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-white/10 z-40 px-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        <span className="font-bold text-sm">{user?.nome?.substring(0, 2).toUpperCase() || 'MO'}</span>
                    </div>
                    <div className="leading-tight">
                        <h1 className="font-press text-xs text-white">MONITOR</h1>
                        <p className="text-[10px] text-slate-400">{user?.turma || 'Staff'}</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* 2. ÁREA DE CONTEÚDO (Com padding para não esconder atrás das barras) */}
            <main className="flex-1 pt-20 pb-24 px-4 relative overflow-y-auto">
                <Outlet />
            </main>

            {/* 3. BOTTOM BAR (Navegação Inferior) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-white/10 pb-safe z-50 h-16 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <div className="flex justify-around items-center h-full">
                    {MENU_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        
                        return (
                            <button
                                key={item.path}
                                onClick={() => { playClick(); navigate(item.path); }}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                                    isActive ? 'text-yellow-400' : 'text-slate-600'
                                }`}
                            >
                                <div className={`relative p-1 rounded-lg transition-all ${isActive ? 'bg-yellow-500/10 -translate-y-1' : ''}`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeTab"
                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full"
                                        />
                                    )}
                                </div>
                                <span className="text-[9px] font-bold tracking-wider uppercase">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}