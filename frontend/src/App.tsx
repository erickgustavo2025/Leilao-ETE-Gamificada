import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LuckyBlockMenu } from './components/layout/LuckyBlockMenu';
import { ChatWidget } from './components/features/ChatWidget';
import { Toaster, toast } from 'sonner';
import { Loader2, Eye, X, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from './api/axios-config';
import { queryKeys } from './utils/queryKeys';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const LandingPage    = lazy(() => import('./pages/public/home').then(m => ({ default: m.LandingPage })));
const LoginSelection = lazy(() => import('./pages/public/LoginSelection').then(m => ({ default: m.LoginSelection })));
const RoleLogin      = lazy(() => import('./pages/public/RoleLogin').then(m => ({ default: m.RoleLogin })));
const FirstAccess    = lazy(() => import('./pages/public/FirstAccess').then(m => ({ default: m.FirstAccess })));
const Maintenance    = lazy(() => import('./pages/public/Maintenance').then(m => ({ default: m.Maintenance })));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword  = lazy(() => import('./pages/public/ResetPassword').then(m => ({ default: m.ResetPassword })));

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const Ranking       = lazy(() => import('./pages/dashboard/Ranking').then(m => ({ default: m.Ranking })));
const Mochila       = lazy(() => import('./pages/dashboard/Mochila').then(m => ({ default: m.Mochila })));
const Loja          = lazy(() => import('./pages/dashboard/Loja').then(m => ({ default: m.Loja })));
const Leilao        = lazy(() => import('./pages/dashboard/Leilao').then(m => ({ default: m.Leilao })));
const Roleta        = lazy(() => import('./pages/dashboard/Roleta').then(m => ({ default: m.Roleta })));
const Marketplace   = lazy(() => import('./pages/dashboard/Marketplace').then(m => ({ default: m.Marketplace })));
const Profile       = lazy(() => import('./pages/dashboard/Profile').then(m => ({ default: m.Profile })));
const Banco         = lazy(() => import('./pages/dashboard/Banco').then(m => ({ default: m.Banco })));
const Gifts         = lazy(() => import('./pages/dashboard/Gifts').then(m => ({ default: m.Gifts })));
const WikiMap       = lazy(() => import('./pages/dashboard/WikiMap').then(m => ({ default: m.WikiMap })));

const HouseCupHub  = lazy(() => import('./pages/dashboard/taca-das-casas').then(m => ({ default: m.HouseCupHub })));
const BecoDiagonal = lazy(() => import('./pages/dashboard/taca-das-casas/pages/BecoDiagonal').then(m => ({ default: m.BecoDiagonal })));
const MochilaSala  = lazy(() => import('./pages/dashboard/taca-das-casas/pages/MochilaSala').then(m => ({ default: m.MochilaSala })));
const Punicoes     = lazy(() => import('./pages/dashboard/taca-das-casas/pages/Punicoes').then(m => ({ default: m.Punicoes })));
const Historico    = lazy(() => import('./pages/dashboard/taca-das-casas/pages/Historico').then(m => ({ default: m.Historico })));

const MonitorDashboard = lazy(() => import('./pages/monitor/MonitorDashboard').then(m => ({ default: m.MonitorDashboard })));
const MonitorLayout    = lazy(() => import('./components/layout/MonitorLayout').then(m => ({ default: m.MonitorLayout })));
const MonitorHistory   = lazy(() => import('./pages/monitor/MonitorHistory').then(m => ({ default: m.MonitorHistory })));
const MonitorScanner   = lazy(() => import('./pages/monitor/MonitorScanner').then(m => ({ default: m.MonitorScanner })));

import { ArmadaLogin }   from './pages/armada/ArmadaLogin';
import { ArmadaScanner } from './pages/armada/ArmadaScanner';
const ComingSoon = lazy(() => import('./pages/ComingSoon').then(m => ({ default: m.ComingSoon })));

const DevLayout    = lazy(() => import('./components/layout/DevLayout').then(m => ({ default: m.DevLayout })));
const DevDashboard = lazy(() => import('./pages/dev/DevDashboard').then(m => ({ default: m.DevDashboard })));
const FeedbackList = lazy(() => import('./pages/dev/FeedbackList').then(m => ({ default: m.FeedbackList })));
const DevUsers     = lazy(() => import('./pages/dev/DevUsers').then(m => ({ default: m.DevUsers })));

const AdminClasses     = lazy(() => import('./pages/admin/AdminClasses').then(m => ({ default: m.AdminClasses })));
const AdminStore       = lazy(() => import('./pages/admin/AdminStore').then(m => ({ default: m.AdminStore })));
const AdminUsers       = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminLogs        = lazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminAuctions    = lazy(() => import('./pages/admin/AdminAuctions').then(m => ({ default: m.AdminAuctions })));
const AdminScanner     = lazy(() => import('./pages/admin/AdminScanner').then(m => ({ default: m.AdminScanner })));
const AdminGifts       = lazy(() => import('./pages/admin/AdminGifts').then(m => ({ default: m.AdminGifts })));
const AdminConfig      = lazy(() => import('./pages/admin/AdminConfig').then(m => ({ default: m.AdminConfig })));
const AdminImages      = lazy(() => import('./pages/admin/AdminImages').then(m => ({ default: m.AdminImages })));
const AdminPunishments = lazy(() => import('./pages/admin/AdminPunishments').then(m => ({ default: m.AdminPunishments })));
const AdminRoulette    = lazy(() => import('./pages/admin/AdminRoulette').then(m => ({ default: m.AdminRoulette })));
const AdminHouse       = lazy(() => import('./pages/admin/AdminHouse').then(m => ({ default: m.AdminHouse })));

// ─────────────────────────────────────────────────────────────
const PUBLIC_PATHS = ['/', '/login', '/first-access', '/forgot-password', '/reset-password', '/maintenance'];

const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/login/') || path.startsWith('/armada/login');

const LAST_PATH_KEY = '@ETEGamificada:lastPath';

function getDashboardByRole(role?: string): string {
  switch (role) {
    case 'dev':     return '/dev';
    case 'admin':   return '/admin/classes';
    case 'monitor': return '/monitor';
    default:        return '/dashboard';
  }
}

const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white">
    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
    <p className="font-press text-xs text-slate-500 animate-pulse uppercase">Sincronizando Sistema...</p>
  </div>
);

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { signed, loading, user, isImpersonating } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!signed) return <Navigate to="/login" replace />;

  // Durante impersonate o admin já foi verificado — não checa roles
  // do usuário impersonado para não disparar "Acesso não autorizado"
  // enquanto o React ainda está na rota antiga antes do navigate
  if (roles && user && !isImpersonating) {
    const hasPermission =
      roles.includes(user.role) ||
      (user.cargos && user.cargos.some((cargo: string) => roles.includes(cargo)));

    if (!hasPermission) {
      toast.error("Acesso não autorizado.");
      return <Navigate to={getDashboardByRole(user.role)} replace />;
    }
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { signed, loading, user, isImpersonating } = useAuth();

  if (loading) return <LoadingScreen />;

  if (signed && user) {
    const lastPath = localStorage.getItem(LAST_PATH_KEY);

    if (lastPath && !isPublicPath(lastPath)) {
      return <Navigate to={lastPath} replace />;
    }

    // Durante impersonate, sempre vai pro dashboard de aluno —
    // ignora o role real (que pode ser monitor/admin) para não
    // redirecionar pra página errada
    if (isImpersonating) {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to={getDashboardByRole(user.role)} replace />;
  }

  return <>{children}</>;
}

function PathTracker() {
  const location = useLocation();
  const { signed, isImpersonating } = useAuth();

  useEffect(() => {
    // Durante impersonate não salva lastPath —
    // o lastPath do admin já está preservado em originalLastPath
    if (signed && !isImpersonating && !isPublicPath(location.pathname)) {
      localStorage.setItem(LAST_PATH_KEY, location.pathname);
    }
  }, [location.pathname, signed, isImpersonating]);

  return null;
}

// ─────────────────────────────────────────────────────────────
// BANNER DE IMPERSONATE
// - Abre automaticamente por 3s, depois recolhe para uma pill
// - visibilitychange reseta o estado de "saindo" se a página
//   voltar do background com o async incompleto (fix mobile)
// ─────────────────────────────────────────────────────────────
function ImpersonateBanner() {
  const { isImpersonating, user, exitImpersonate } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(true);
  const [exiting, setExiting] = React.useState(false);

  // Auto-recolhe após 3s ao entrar no impersonate
  React.useEffect(() => {
    if (!isImpersonating) return;
    setExpanded(true);
    const t = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(t);
  }, [isImpersonating]);

  // Fix mobile: quando app volta do background com exiting=true preso,
  // reseta o estado para o usuário conseguir tentar de novo
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && exiting) {
        setExiting(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [exiting]);

  if (!isImpersonating || !user) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      const restoredPath = await exitImpersonate();
      navigate(restoredPath && !isPublicPath(restoredPath) ? restoredPath : '/admin/users', { replace: true });
    } catch {
      setExiting(false); // fallback se der erro inesperado
    }
  };

  const firstName = user.nome.split(' ')[0];

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none">

      {/* ── BANNER EXPANDIDO ── */}
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
          {/* Esquerda — indicador + identidade */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dot pulsante */}
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-violet-400 animate-ping opacity-60" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[8px] font-press tracking-widest uppercase hidden sm:inline"
                  style={{ color: 'rgba(167, 139, 250, 0.7)' }}
                >
                  espectador
                </span>
                <Eye size={10} className="text-violet-400 hidden sm:inline flex-shrink-0" />
                <span className="font-mono font-semibold text-white text-xs truncate">
                  {firstName}
                </span>
                <span
                  className="font-mono text-[10px] hidden sm:inline truncate"
                  style={{ color: 'rgba(196, 181, 253, 0.6)' }}
                >
                  {user.matricula} · {user.turma}
                </span>
              </div>
            </div>
          </div>

          {/* Direita — ações */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Encerrar */}
            <button
              onClick={handleExit}
              disabled={exiting}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-press transition-all duration-150 active:scale-95 disabled:cursor-not-allowed"
              style={{
                color: exiting ? 'rgba(248, 113, 113, 0.5)' : 'rgba(248, 113, 113, 1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                background: 'rgba(248, 113, 113, 0.08)',
              }}
            >
              {exiting
                ? <Loader2 size={10} className="animate-spin" />
                : <X size={10} />
              }
              <span className="hidden sm:inline">{exiting ? 'SAINDO...' : 'ENCERRAR'}</span>
            </button>

            {/* Recolher */}
            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{
                color: 'rgba(139, 92, 246, 0.7)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: 'rgba(139, 92, 246, 0.08)',
              }}
              title="Minimizar"
            >
              <ChevronUp size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PILL RECOLHIDA ── */}
      <button
        onClick={() => setExpanded(true)}
        className="pointer-events-auto active:scale-95 transition-transform duration-150"
        style={{
          opacity: expanded ? 0 : 1,
          transform: expanded ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: expanded ? 'none' : 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px 4px',
          fontSize: '9px',
          fontFamily: 'monospace',
          fontWeight: 600,
          color: 'rgba(196, 181, 253, 0.9)',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
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

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signed, user, loading, isImpersonating } = useAuth();

  const { data: config } = useQuery({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const { data } = await api.get('/public/config');
      return data as { maintenanceMode?: boolean; lockdownMode?: boolean; siteName?: string };
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!config) return;

    const isMaintenance = config.maintenanceMode === true;
    const isLockdown    = config.lockdownMode === true;

    const role   = user?.role;
    const cargos = user?.cargos || [];
    const isDev  = role === 'dev' || cargos.includes('dev');
    const isAdmin = role === 'admin' || cargos.includes('admin') || isDev;

    const isLoginPath       = location.pathname.startsWith('/login');
    const isMaintenancePath = location.pathname === '/maintenance';

    if (isLockdown && !isDev) {
      if (!isMaintenancePath && !isLoginPath) navigate('/maintenance', { replace: true });
      return;
    }

    if (isMaintenance && !isAdmin) {
      if (!isMaintenancePath && !isLoginPath) navigate('/maintenance', { replace: true });
      return;
    }
  }, [config, user, location.pathname, navigate]);

  const hideMenuExactRoutes = ['/', '/first-access', '/login', '/forgot-password', '/reset-password', '/maintenance'];
  const shouldShowMenu =
    signed &&
    !hideMenuExactRoutes.includes(location.pathname) &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/monitor') &&
    !location.pathname.startsWith('/dev');

  useEffect(() => {
    const handleOpenTrade = (e: any) => {
      const tradeId = e.detail;
      navigate('/market', { state: { tab: 'trades', tradeId } });
      toast.info("Abrindo central de trocas...");
    };
    window.addEventListener('openTradeModal', handleOpenTrade);
    return () => window.removeEventListener('openTradeModal', handleOpenTrade);
  }, [navigate]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <PathTracker />
      <ImpersonateBanner />
      {/* Spacer: empurra conteúdo abaixo do banner/pill */}
      {isImpersonating && <div className="h-8" />}

      {shouldShowMenu && <LuckyBlockMenu />}
      {shouldShowMenu && <ChatWidget />}

      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>

            <Route path="/"           element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login"      element={<PublicRoute><LoginSelection /></PublicRoute>} />
            <Route path="/login/:role" element={<PublicRoute><RoleLogin /></PublicRoute>} />

            <Route path="/first-access"    element={<FirstAccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/maintenance"     element={<Maintenance />} />

            <Route path="/dashboard"       element={<PrivateRoute><DashboardHome /></PrivateRoute>} />
            <Route path="/ranking"         element={<PrivateRoute><Ranking /></PrivateRoute>} />
            <Route path="/mochila"         element={<PrivateRoute><Mochila /></PrivateRoute>} />
            <Route path="/loja"            element={<PrivateRoute><Loja /></PrivateRoute>} />
            <Route path="/leilao"          element={<PrivateRoute><Leilao /></PrivateRoute>} />
            <Route path="/roleta"          element={<PrivateRoute><Roleta /></PrivateRoute>} />
            <Route path="/market"          element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/perfil"          element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/banco"           element={<PrivateRoute><Banco /></PrivateRoute>} />
            <Route path="/dashboard/gifts" element={<PrivateRoute><Gifts /></PrivateRoute>} />
            <Route path="/manual"          element={<PrivateRoute><WikiMap /></PrivateRoute>} />

            <Route path="/taca-das-casas"               element={<PrivateRoute><HouseCupHub /></PrivateRoute>} />
            <Route path="/taca-das-casas/beco-diagonal" element={<PrivateRoute><BecoDiagonal /></PrivateRoute>} />
            <Route path="/taca-das-casas/mochila"       element={<PrivateRoute><MochilaSala /></PrivateRoute>} />
            <Route path="/taca-das-casas/punicoes"      element={<PrivateRoute><Punicoes /></PrivateRoute>} />
            <Route path="/taca-das-casas/historico"     element={<PrivateRoute><Historico /></PrivateRoute>} />

            <Route path="/dev" element={<PrivateRoute roles={['dev', 'admin']}><DevLayout /></PrivateRoute>}>
              <Route index element={<DevDashboard />} />
              <Route path="feedbacks" element={<FeedbackList />} />
              <Route path="users"     element={<DevUsers />} />
            </Route>

            <Route path="/monitor" element={<PrivateRoute roles={['monitor', 'admin']}><MonitorLayout /></PrivateRoute>}>
              <Route index element={<MonitorDashboard />} />
              <Route path="scanner" element={<MonitorScanner />} />
              <Route path="history" element={<MonitorHistory />} />
            </Route>

            <Route path="/armada/login"   element={<ArmadaLogin />} />
            <Route path="/armada/scanner" element={<PrivateRoute><ArmadaScanner /></PrivateRoute>} />
            <Route path="/coming-soon"    element={<ComingSoon />} />

            <Route path="/admin" element={<Navigate to="/admin/classes" replace />} />
            <Route path="/admin/classes"     element={<PrivateRoute roles={['admin']}><AdminClasses /></PrivateRoute>} />
            <Route path="/admin/store"       element={<PrivateRoute roles={['admin']}><AdminStore /></PrivateRoute>} />
            <Route path="/admin/users"       element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/auctions"    element={<PrivateRoute roles={['admin']}><AdminAuctions /></PrivateRoute>} />
            <Route path="/admin/scanner"     element={<PrivateRoute roles={['admin']}><AdminScanner /></PrivateRoute>} />
            <Route path="/admin/logs"        element={<PrivateRoute roles={['admin']}><AdminLogs /></PrivateRoute>} />
            <Route path="/admin/gifts"       element={<PrivateRoute roles={['admin']}><AdminGifts /></PrivateRoute>} />
            <Route path="/admin/config"      element={<PrivateRoute roles={['admin']}><AdminConfig /></PrivateRoute>} />
            <Route path="/admin/images"      element={<PrivateRoute roles={['admin']}><AdminImages /></PrivateRoute>} />
            <Route path="/admin/punishments" element={<PrivateRoute roles={['admin']}><AdminPunishments /></PrivateRoute>} />
            <Route path="/admin/roulette"    element={<PrivateRoute roles={['admin']}><AdminRoulette /></PrivateRoute>} />
            <Route path="/admin/house"       element={<PrivateRoute roles={['admin']}><AdminHouse /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-slate-900 border-2 border-white text-white font-vt323 text-xl rounded-none p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]',
          style: { borderRadius: '0px' },
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
