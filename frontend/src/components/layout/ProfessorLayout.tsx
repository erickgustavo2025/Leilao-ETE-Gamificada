import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Lock, BarChart3, 
  Settings, LogOut, Menu, X, BookOpen, Users, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface ProfessorLayoutProps {
  children: ReactNode;
}

export function ProfessorLayout({ children }: ProfessorLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'DASHBOARD', path: '/professor/dashboard', icon: LayoutDashboard, color: 'text-purple-400' },
    { label: 'AVALIAÇÕES (LOCK)', path: '/professor/exams', icon: Lock, color: 'text-red-400' },
    { label: 'MEUS ALUNOS', path: '/professor/students', icon: Users, color: 'text-blue-400' },
    { label: 'DADOS CIENTÍFICOS', path: '/professor/analytics', icon: BarChart3, color: 'text-emerald-400' },
    { label: 'MINHAS MATÉRIAS', path: '/professor/disciplinas', icon: BookOpen, color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-mono">

      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden bg-slate-900/50 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-purple-500" />
          <span className="font-press text-[10px]">PAINEL DOCENTE</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 🏰 SIDEBAR PEDAGÓGICA */}
      <aside className={cn(
        "bg-slate-900/30 backdrop-blur-2xl border-r border-white/5 flex-col transition-all duration-300 z-40 shadow-2xl",
        isMobileMenuOpen ? "fixed inset-0 top-[65px] flex w-full" : "hidden md:flex md:w-64 md:h-screen md:sticky md:top-0"
      )}>

        {/* User Profile Summary */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl border border-purple-500/30 flex items-center justify-center shadow-lg">
              <GraduationCap className="text-purple-400" size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="font-press text-[11px] text-white truncate uppercase">Prof(a). {user?.nome?.split(' ')[0]}</h1>
              <p className="font-mono text-slate-500 text-[10px] truncate">Módulo Pedagógico</p>
            </div>
          </div>
          
          <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
             <ShieldAlert size={12} className="text-blue-400 shrink-0" />
             <span className="text-[8px] font-press text-blue-400 uppercase tracking-tighter">Observador Ativo</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 border border-transparent group",
                location.pathname === item.path ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : ""
              )}
            >
              <item.icon className={cn("w-5 h-5 group-hover:scale-110 transition-transform", item.color)} />
              <span className={cn("font-press text-[9px]", location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-3">
          <Link to="/professor/settings" className="flex items-center gap-3 p-3 text-slate-500 hover:text-white transition-colors group text-[9px] font-press">
              <Settings size={16} className="group-hover:rotate-45 transition-transform" /> CONFIGURAÇÕES
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 p-3 rounded-xl text-[9px] font-press transition-all">
            <LogOut size={16} /> ENCERRAR SESSÃO
          </button>
        </div>
      </aside>

      {/* 🚀 ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen relative">
         <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
         <div className="p-4 md:p-8 relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
}
