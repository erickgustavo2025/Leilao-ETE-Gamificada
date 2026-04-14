import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

interface UserData {
  nome: string;
  matricula: string;
  turma: string;
}

const PUBLIC_PATHS = ['/', '/login', '/first-access', '/forgot-password', '/reset-password', '/maintenance', '/politica-privacidade'];
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/login/') || path.startsWith('/armada/login');

export function ImpersonateBanner() {
  const { isImpersonating, user, exitImpersonate } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(true);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    if (!isImpersonating) return;
    setExpanded(true);
    const t = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(t);
  }, [isImpersonating]);

  if (!isImpersonating || !user) return null;

  const typedUser = user as UserData;

  const handleExit = async () => {
    setExiting(true);
    try {
      const restoredPath = await exitImpersonate();
      navigate(restoredPath && !isPublicPath(restoredPath) ? restoredPath : '/admin/users', { replace: true });
    } catch {
      setExiting(false);
    }
  };

  const firstName = typedUser.nome.split(' ')[0];

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none">
      {/* BANNER EXPANDIDO */}
      <div
        className="pointer-events-auto w-full"
        style={{
          maxHeight: expanded ? '56px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="w-full flex items-center justify-between gap-2 px-3 py-2 md:px-5"
          style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 24px rgba(139, 92, 246, 0.25), 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-400 animate-ping opacity-60" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[8px] font-press tracking-widest uppercase hidden sm:inline text-violet-300/70">
                  espectador
                </span>
                <Eye size={10} className="text-violet-400 hidden sm:inline flex-shrink-0" />
                <span className="font-mono font-semibold text-white text-xs truncate">
                  {firstName}
                </span>
                <span className="font-mono text-[10px] hidden sm:inline truncate text-violet-200/60">
                  {typedUser.matricula} · {typedUser.turma}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleExit}
              disabled={exiting}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-press transition-all duration-150 active:scale-95 disabled:cursor-not-allowed border border-red-500/30 bg-red-500/10 text-red-500"
            >
              {exiting ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
              <span className="hidden sm:inline">{exiting ? 'SAINDO...' : 'ENCERRAR'}</span>
            </button>

            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center transition-all duration-150 active:scale-90 border border-violet-500/30 bg-violet-500/10 text-violet-500/70"
              title="Minimizar"
            >
              <ChevronUp size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* PILL RECOLHIDA */}
      <button
        onClick={() => setExpanded(true)}
        className="pointer-events-auto active:scale-95 transition-transform duration-150 flex items-center gap-[5px] px-[10px] pt-[3px] pb-[4px] text-[9px] font-mono font-semibold text-violet-200/90 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] border border-t-0 border-violet-500/35 rounded-b-md shadow-lg shadow-violet-500/20"
        style={{
          opacity: expanded ? 0 : 1,
          transform: expanded ? 'translateY(-6px)' : 'translateY(0)',
          pointerEvents: expanded ? 'none' : 'auto',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
        title="Expandir"
      >
        <Eye size={9} />
        <span className="max-w-[80px] truncate">{firstName}</span>
        <ChevronDown size={9} />
      </button>
    </div>
  );
}
