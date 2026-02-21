import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LuckyBlockMenu } from './components/layout/LuckyBlockMenu';
import { ChatWidget } from './components/features/ChatWidget';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from './api/axios-config';
import { queryKeys } from './utils/queryKeys';

// --- CONFIGURAÇÃO DO MOTOR DE CACHE ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// --- LAZY LOADING (Otimização) ---
const LandingPage = lazy(() => import('./pages/public/home').then(m => ({ default: m.LandingPage })));
const LoginSelection = lazy(() => import('./pages/public/LoginSelection').then(m => ({ default: m.LoginSelection })));
const RoleLogin = lazy(() => import('./pages/public/RoleLogin').then(m => ({ default: m.RoleLogin })));
const FirstAccess = lazy(() => import('./pages/public/FirstAccess').then(m => ({ default: m.FirstAccess })));
const Maintenance = lazy(() => import('./pages/public/Maintenance').then(m => ({ default: m.Maintenance })));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword').then(m => ({ default: m.ResetPassword })));

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const Ranking = lazy(() => import('./pages/dashboard/Ranking').then(m => ({ default: m.Ranking })));
const Mochila = lazy(() => import('./pages/dashboard/Mochila').then(m => ({ default: m.Mochila })));
const Loja = lazy(() => import('./pages/dashboard/Loja').then(m => ({ default: m.Loja })));
const Leilao = lazy(() => import('./pages/dashboard/Leilao').then(m => ({ default: m.Leilao })));
const Roleta = lazy(() => import('./pages/dashboard/Roleta').then(m => ({ default: m.Roleta })));
const Marketplace = lazy(() => import('./pages/dashboard/Marketplace').then(m => ({ default: m.Marketplace })));
const Profile = lazy(() => import('./pages/dashboard/Profile').then(m => ({ default: m.Profile })));
const Banco = lazy(() => import('./pages/dashboard/Banco').then(m => ({ default: m.Banco })));
const Gifts = lazy(() => import('./pages/dashboard/Gifts').then(m => ({ default: m.Gifts })));
const WikiMap = lazy(() => import('./pages/dashboard/WikiMap').then(m => ({ default: m.WikiMap })));

const HouseCupHub = lazy(() => import('./pages/dashboard/taca-das-casas').then(m => ({ default: m.HouseCupHub })));
const BecoDiagonal = lazy(() => import('./pages/dashboard/taca-das-casas/pages/BecoDiagonal').then(m => ({ default: m.BecoDiagonal })));
const MochilaSala = lazy(() => import('./pages/dashboard/taca-das-casas/pages/MochilaSala').then(m => ({ default: m.MochilaSala })));
const Punicoes = lazy(() => import('./pages/dashboard/taca-das-casas/pages/Punicoes').then(m => ({ default: m.Punicoes })));
const Historico = lazy(() => import('./pages/dashboard/taca-das-casas/pages/Historico').then(m => ({ default: m.Historico })));

const MonitorDashboard = lazy(() => import('./pages/monitor/MonitorDashboard').then(m => ({ default: m.MonitorDashboard })));
const MonitorLayout = lazy(() => import('./components/layout/MonitorLayout').then(m => ({ default: m.MonitorLayout })));
const MonitorHistory = lazy(() => import('./pages/monitor/MonitorHistory').then(m => ({ default: m.MonitorHistory })));
const MonitorScanner = lazy(() => import('./pages/monitor/MonitorScanner').then(m => ({ default: m.MonitorScanner })));

import { ArmadaLogin } from './pages/armada/ArmadaLogin';
import { ArmadaScanner } from './pages/armada/ArmadaScanner';
const ComingSoon = lazy(() => import('./pages/ComingSoon').then(m => ({ default: m.ComingSoon })));

const DevLayout = lazy(() => import('./components/layout/DevLayout').then(m => ({ default: m.DevLayout })));
const DevDashboard = lazy(() => import('./pages/dev/DevDashboard').then(m => ({ default: m.DevDashboard })));
const FeedbackList = lazy(() => import('./pages/dev/FeedbackList').then(m => ({ default: m.FeedbackList })));
const DevUsers = lazy(() => import('./pages/dev/DevUsers').then(m => ({ default: m.DevUsers })));

const AdminClasses = lazy(() => import('./pages/admin/AdminClasses').then(m => ({ default: m.AdminClasses })));
const AdminStore = lazy(() => import('./pages/admin/AdminStore').then(m => ({ default: m.AdminStore })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminAuctions = lazy(() => import('./pages/admin/AdminAuctions').then(m => ({ default: m.AdminAuctions })));
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner').then(m => ({ default: m.AdminScanner })));
const AdminGifts = lazy(() => import('./pages/admin/AdminGifts').then(m => ({ default: m.AdminGifts })));
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig').then(m => ({ default: m.AdminConfig })));
const AdminImages = lazy(() => import('./pages/admin/AdminImages').then(m => ({ default: m.AdminImages })));
const AdminPunishments = lazy(() => import('./pages/admin/AdminPunishments').then(m => ({ default: m.AdminPunishments })));
const AdminRoulette = lazy(() => import('./pages/admin/AdminRoulette').then(m => ({ default: m.AdminRoulette })));
const AdminHouse = lazy(() => import('./pages/admin/AdminHouse').then(m => ({ default: m.AdminHouse })));

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
  const { signed, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!signed) return <Navigate to="/login" />;

  if (roles && user) {
    const hasPermission =
      roles.includes(user.role) ||
      (user.cargos && user.cargos.some(cargo => roles.includes(cargo)));

    if (!hasPermission) {
      toast.error("Acesso não autorizado.");
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signed, user, loading } = useAuth();

  // 🔥 1. BUSCA O STATUS DE MANUTENÇÃO GLOBAL (PUBLICO)
  const { data: config } = useQuery({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const { data } = await api.get('/public/config');
      return data as { maintenanceMode?: boolean; lockdownMode?: boolean; siteName?: string };
    },
    staleTime: 1000 * 60,
  });

  // 🔥 2. LÓGICA DE BLOQUEIO ESTÁTICA (FIM DO LOOPING)
  useEffect(() => {
    if (!config) return;

    const isMaintenance = config.maintenanceMode === true;
    const isLockdown = config.lockdownMode === true;

    const role = user?.role;
    const cargos = user?.cargos || [];
    const isDev = role === 'dev' || cargos.includes('dev');
    const isAdmin = role === 'admin' || cargos.includes('admin') || isDev;

    const isLoginPath = location.pathname.startsWith('/login');
    const isMaintenancePath = location.pathname === '/maintenance';

    if (isLockdown && !isDev) {
      if (!isMaintenancePath && !isLoginPath) {
        navigate('/maintenance', { replace: true });
      }
      return;
    }

    if (isMaintenance && !isAdmin) {
      if (!isMaintenancePath && !isLoginPath) {
        navigate('/maintenance', { replace: true });
      }
      return;
    }

    // (sistema liberado) não auto-redireciona de /maintenance, por decisão sua
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
      {shouldShowMenu && <LuckyBlockMenu />}
      {shouldShowMenu && <ChatWidget />}

      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginSelection />} />
            <Route path="/login/:role" element={<RoleLogin />} />
            <Route path="/first-access" element={<FirstAccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/maintenance" element={<Maintenance />} />

            <Route path="/dashboard" element={<PrivateRoute><DashboardHome /></PrivateRoute>} />
            <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
            <Route path="/mochila" element={<PrivateRoute><Mochila /></PrivateRoute>} />
            <Route path="/loja" element={<PrivateRoute><Loja /></PrivateRoute>} />
            <Route path="/leilao" element={<PrivateRoute><Leilao /></PrivateRoute>} />
            <Route path="/roleta" element={<PrivateRoute><Roleta /></PrivateRoute>} />
            <Route path="/market" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/banco" element={<PrivateRoute><Banco /></PrivateRoute>} />
            <Route path="/dashboard/gifts" element={<PrivateRoute><Gifts /></PrivateRoute>} />
            <Route path="/manual" element={<PrivateRoute><WikiMap /></PrivateRoute>} />

            <Route path="/dev" element={<PrivateRoute roles={['dev', 'admin']}><DevLayout /></PrivateRoute>}>
              <Route index element={<DevDashboard />} />
              <Route path="feedbacks" element={<FeedbackList />} />
              <Route path="users" element={<DevUsers />} />
            </Route>

            <Route path="/monitor" element={<PrivateRoute roles={['monitor', 'admin']}><MonitorLayout /></PrivateRoute>}>
              <Route index element={<MonitorDashboard />} />
              <Route path="scanner" element={<MonitorScanner />} />
              <Route path="history" element={<MonitorHistory />} />
            </Route>

            <Route path="/armada/login" element={<ArmadaLogin />} />
            <Route path="/armada/scanner" element={<PrivateRoute><ArmadaScanner /></PrivateRoute>} />
            <Route path="/coming-soon" element={<ComingSoon />} />

            <Route path="/admin" element={<Navigate to="/admin/classes" replace />} />
            <Route path="/admin/classes" element={<PrivateRoute roles={['admin']}><AdminClasses /></PrivateRoute>} />
            <Route path="/admin/store" element={<PrivateRoute roles={['admin']}><AdminStore /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/auctions" element={<PrivateRoute roles={['admin']}><AdminAuctions /></PrivateRoute>} />
            <Route path="/admin/scanner" element={<PrivateRoute roles={['admin']}><AdminScanner /></PrivateRoute>} />
            <Route path="/admin/logs" element={<PrivateRoute roles={['admin']}><AdminLogs /></PrivateRoute>} />
            <Route path="/admin/gifts" element={<PrivateRoute roles={['admin']}><AdminGifts /></PrivateRoute>} />
            <Route path="/admin/config" element={<PrivateRoute roles={['admin']}><AdminConfig /></PrivateRoute>} />
            <Route path="/admin/images" element={<PrivateRoute roles={['admin']}><AdminImages /></PrivateRoute>} />
            <Route path="/admin/punishments" element={<PrivateRoute roles={['admin']}><AdminPunishments /></PrivateRoute>} />
            <Route path="/admin/roulette" element={<PrivateRoute roles={['admin']}><AdminRoulette /></PrivateRoute>} />
            <Route path="/admin/house" element={<PrivateRoute roles={['admin']}><AdminHouse /></PrivateRoute>} />

            <Route path="/taca-das-casas" element={<PrivateRoute><HouseCupHub /></PrivateRoute>} />
            <Route path="/taca-das-casas/beco-diagonal" element={<PrivateRoute><BecoDiagonal /></PrivateRoute>} />
            <Route path="/taca-das-casas/mochila" element={<PrivateRoute><MochilaSala /></PrivateRoute>} />
            <Route path="/taca-das-casas/punicoes" element={<PrivateRoute><Punicoes /></PrivateRoute>} />
            <Route path="/taca-das-casas/historico" element={<PrivateRoute><Historico /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
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
