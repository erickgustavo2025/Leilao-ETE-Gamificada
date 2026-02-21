import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Dices, Settings, Gift, QrCode, ShieldCheck, Grid, 
  Coins, Users, Scroll, LogOut, Menu, X, Gavel, 
  Image as ImageIcon, Trophy // <--- ADICIONE O TROPHY AQUI
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'SALAS E TURMAS', path: '/admin/classes', icon: Grid, color: 'text-yellow-400' },
    
    // 🏆 NOVO ITEM DO MENU
    { label: 'TAÇA DAS CASAS', path: '/admin/house', icon: Trophy, color: 'text-yellow-500' },

    { label: 'CASA DE LEILÕES', path: '/admin/auctions', icon: Gavel, color: 'text-orange-400' },
    { label: 'PRESENTES', path: '/admin/gifts', icon: Gift, color: 'text-pink-400' },
    { icon: Dices, label: 'ROLETA', path: '/admin/roulette' },
    { label: 'ALUNOS', path: '/admin/users', icon: Users, color: 'text-blue-400' },
    { label: 'LOJA E ITENS', path: '/admin/store', icon: Coins, color: 'text-purple-400' },
    { icon: Gavel, label: 'PUNIÇÕES', path: '/admin/punishments' },
    { label: 'SCANNER', path: '/admin/scanner', icon: QrCode, color: 'text-white' },
    { icon: Settings, label: 'CONFIGURAÇÕES', path: '/admin/config' },
    { label: 'GALERIA', path: '/admin/images', icon: ImageIcon, color: 'text-cyan-400' },
    { label: 'AUDITORIA', path: '/admin/logs', icon: Scroll, color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-mono">

      {/* 📱 BOTÃO MOBILE (Hambúrguer) */}
      <div className="md:hidden bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          <span className="font-press text-xs">ADMIN PAINEL</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR (LATERAL) */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 flex-col transition-all duration-300 z-40 shadow-2xl",
        isMobileMenuOpen ? "fixed inset-0 top-[65px] flex w-full" : "hidden md:flex md:w-64 md:h-screen md:sticky md:top-0"
      )}>

        {/* Header da Sidebar (Desktop) */}
        <div className="hidden md:flex p-6 border-b border-slate-800 items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white" />
          </div>
          <div>
            <h1 className="font-press text-sm text-white">ADMIN</h1>
            <p className="font-vt323 text-slate-400 text-sm truncate w-32">
              {user?.nome?.split(' ')[0] || 'Diretor'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 p-3 rounded transition-all hover:bg-slate-800 border border-transparent group",
                location.pathname === item.path ? "bg-slate-800 border-slate-700 shadow-inner" : ""
              )}
            >
              <item.icon className={cn("w-5 h-5 group-hover:scale-110 transition-transform", item.color)} />
              <span className={cn("font-press text-[10px]", location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <button onClick={logout} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 p-3 rounded text-xs font-press transition-colors">
            <LogOut size={16} /> SAIR
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 bg-slate-950 p-4 md:p-6 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
        {children}
      </main>
    </div>
  );
}