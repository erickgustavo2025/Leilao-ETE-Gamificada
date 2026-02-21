import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Terminal, 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  LogOut, 
  Menu, 
  X, 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

export function DevLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const MENU_ITEMS = [
    { label: 'DASHBOARD', path: '/dev', icon: LayoutDashboard },
    { label: 'FEEDBACKS', path: '/dev/feedbacks', icon: MessageSquare },
    { label: 'USUÁRIOS', path: '/dev/users', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login/dev');
  };

  return (
    <div className="min-h-screen bg-[#020202] text-green-500 font-mono flex relative overflow-hidden">
      
      {/* Background Matrix Effect (Sutil) */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

      {/* MOBILE MENU TOGGLE */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-black border border-green-500 rounded text-green-500"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-black/95 border-r border-green-900/50 backdrop-blur-xl transition-transform duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-green-900/50">
            <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="font-bold tracking-wider text-green-400">GOD_MODE</h1>
              <p className="text-[10px] text-green-700">V.1.0 STABLE</p>
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex-1 space-y-2">
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest transition-all border-l-2",
                    isActive 
                      ? "bg-green-500/10 border-green-500 text-green-400" 
                      : "border-transparent text-green-700 hover:text-green-500 hover:bg-green-500/5"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="pt-4 border-t border-green-900/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded transition-all"
            >
              <LogOut size={18} />
              KILL_SESSION
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10 h-screen">
        {/* Renderiza a página filha aqui (Dashboard, Feedbacks, etc) */}
        <Outlet />
      </main>
    </div>
  );
}