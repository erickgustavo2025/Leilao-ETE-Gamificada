// ARQUIVO: frontend/src/App.tsx
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/AuthContext';
import { LuckyBlockMenu } from './components/layout/LuckyBlockMenu';
import { ChatWidget } from './components/features/ChatWidget';
import { AIWidget } from './components/features/AIWidget';
import { PrivacyModal } from './components/features/PrivacyModal';
import { Toaster } from 'sonner';
import { api } from './api/axios-config';
import { queryKeys } from './utils/queryKeys';
import { useEngagementTracker } from './hooks/useEngagementTracker';

// ⚛️ COMPONENTES MODULARIZADOS (REFATORAÇÃO HARDENING V3.1)
import { ImpersonateBanner } from './components/layout/ImpersonateBanner';
import { PathTracker } from './components/layout/PathTracker';
import { LoadingScreen } from './components/layout/LoadingScreen';
import { PrivateRoute, PublicRoute } from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 30, // 30 segundos
      retry: 1,
    },
  },
});

const LandingPage = lazy(() => import('./pages/public/home').then(m => ({ default: m.LandingPage })));
const LoginSelection = lazy(() => import('./pages/public/LoginSelection').then(m => ({ default: m.LoginSelection })));
const RoleLogin = lazy(() => import('./pages/public/RoleLogin').then(m => ({ default: m.RoleLogin })));
const FirstAccess = lazy(() => import('./pages/public/FirstAccess').then(m => ({ default: m.FirstAccess })));
const Maintenance = lazy(() => import('./pages/public/Maintenance').then(m => ({ default: m.Maintenance })));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword').then(m => ({ default: m.ResetPassword })));
const PoliticaPrivacidade = lazy(() => import('./pages/public/PoliticaPrivacidade'));

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const Ranking = lazy(() => import('./pages/dashboard/Ranking').then(m => ({ default: m.Ranking })));
const Mochila = lazy(() => import('./pages/dashboard/Mochila').then(m => ({ default: m.Mochila })));
const Loja = lazy(() => import('./pages/dashboard/Loja').then(m => ({ default: m.Loja })));
const Leilao = lazy(() => import('./pages/dashboard/Leilao').then(m => ({ default: m.Leilao })));
const GilInveste = lazy(() => import('./pages/dashboard/investimentos/GilInveste').then(m => ({ default: m.GilInveste })));
const LojaNotas = lazy(() => import('./pages/dashboard/LojaNotas').then(m => ({ default: m.LojaNotas })));
const ResearchSurvey = lazy(() => import('./pages/dashboard/ResearchSurvey').then(m => ({ default: m.ResearchSurvey })));

const QuestBoard = lazy(() => import('./pages/dashboard/QuestBoard').then(m => ({ default: m.QuestBoard })));
const Regulations = lazy(() => import('./pages/dashboard/Regulations').then(m => ({ default: m.Regulations })));

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
const LinhaDoTempo = lazy(() => import('./pages/dashboard/taca-das-casas/pages/LinhaDoTempo').then(m => ({ default: m.LinhaDoTempo })));

const MonitorDashboard = lazy(() => import('./pages/monitor/MonitorDashboard').then(m => ({ default: m.MonitorDashboard })));
const MonitorLayout = lazy(() => import('./components/layout/MonitorLayout').then(m => ({ default: m.MonitorLayout })));
const MonitorHistory = lazy(() => import('./pages/monitor/MonitorHistory').then(m => ({ default: m.MonitorHistory })));
const MonitorScanner = lazy(() => import('./pages/monitor/MonitorScanner').then(m => ({ default: m.MonitorScanner })));
const ProfessorDashboard = lazy(() => import('./pages/professor/ProfessorDashboard').then(m => ({ default: m.ProfessorDashboard })));

import { ArmadaLogin } from './pages/armada/ArmadaLogin';
import { ArmadaScanner } from './pages/armada/ArmadaScanner';
const ComingSoon = lazy(() => import('./pages/ComingSoon').then(m => ({ default: m.ComingSoon })));

const DevLayout = lazy(() => import('./components/layout/DevLayout').then(m => ({ default: m.DevLayout })));
const DevDashboard = lazy(() => import('./pages/dev/DevDashboard').then(m => ({ default: m.DevDashboard })));
const FeedbackList = lazy(() => import('./pages/dev/FeedbackList').then(m => ({ default: m.FeedbackList })));
const DevUsers = lazy(() => import('./pages/dev/DevUsers').then(m => ({ default: m.DevUsers })));

const AdminClasses = lazy(() => import('./pages/admin/AdminClasses').then(m => ({ default: m.AdminClasses })));
const AdminQuests = lazy(() => import('./pages/admin/AdminQuests').then(m => ({ default: m.AdminQuests })));
const AdminStore = lazy(() => import('./pages/admin/AdminStore').then(m => ({ default: m.AdminStore })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminAuctions = lazy(() => import('./pages/admin/AdminAuctions').then(m => ({ default: m.AdminAuctions })));
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner').then(m => ({ default: m.AdminScanner })));
const AdminGifts = lazy(() => import('./pages/admin/AdminGifts').then(m => ({ default: m.AdminGifts })));
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig').then(m => ({ default: m.AdminConfig })));
const AdminImages = lazy(() => import('./pages/admin/AdminImages').then(m => ({ default: m.AdminImages })));
const AdminPunishments = lazy(() => import('./pages/admin/AdminPunishments').then(m => ({ default: m.AdminPunishments })));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));
const AdminStartupApprovals = lazy(() => import('./pages/admin/AdminStartupApprovals').then(m => ({ default: m.AdminStartupApprovals })));
const AdminHouse = lazy(() => import('./pages/admin/AdminHouse').then(m => ({ default: m.AdminHouse })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminEconomy = lazy(() => import('./pages/admin/AdminEconomy').then(m => ({ default: m.AdminEconomy })));
const AdminEconomyConfig = lazy(() => import('./pages/admin/AdminEconomyConfig').then(m => ({ default: m.AdminEconomyConfig })));
const AdminDisciplinas = lazy(() => import('./pages/admin/AdminDisciplinas').then(m => ({ default: m.AdminDisciplinas })));
const AdminRegulations = lazy(() => import('./pages/admin/AdminRegulations').then(m => ({ default: m.AdminRegulations })));
const AdminSurveys = lazy(() => import('./pages/admin/AdminSurveys').then(m => ({ default: m.AdminSurveys })));
const AdminProfessors = lazy(() => import('./pages/admin/AdminProfessors').then(m => ({ default: m.AdminProfessors })));

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÕES GLOBAIS
// ─────────────────────────────────────────────────────────────
interface PublicConfig {
  maintenanceMode?: boolean;
  lockdownMode?: boolean;
  siteName?: string;
}

interface UserData {
  role: string;
  cargos?: string[];
  nome: string;
  matricula: string;
  turma: string;
  privacyAccepted?: boolean;
}

const PUBLIC_PATHS = ['/', '/login', '/first-access', '/forgot-password', '/reset-password', '/maintenance', '/politica-privacidade'];
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/login/') || path.startsWith('/armada/login');

function AIWidgetWrapper() {
  const { signed } = useAuth();
  const location = useLocation();
  if (!signed || isPublicPath(location.pathname)) return null;
  return <AIWidget />;
}

// ─────────────────────────────────────────────────────────────
function AppContent() {
  useEngagementTracker();
  const location = useLocation();
  const navigate = useNavigate();
  const { signed, user, loading, isImpersonating } = useAuth();
  
  const showPrivacyModal = !!(
    signed && 
    user && 
    !(user as UserData).privacyAccepted && 
    !isImpersonating && 
    !isPublicPath(location.pathname)
  );

  const { data: config } = useQuery<PublicConfig>({
    queryKey: queryKeys.public.config,
    queryFn: async () => {
      const { data } = await api.get('/public/config');
      return data as PublicConfig;
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!config) return;
    const isMaintenance = config.maintenanceMode === true;
    const isLockdown = config.lockdownMode === true;
    const typedUser = user as UserData | undefined;
    const role = typedUser?.role;
    const cargos = typedUser?.cargos ?? [];
    const isDev = role === 'dev' || cargos.includes('dev');
    const isAdmin = role === 'admin' || cargos.includes('admin') || isDev;

    if (isLockdown && !isDev) {
      if (location.pathname !== '/maintenance' && !location.pathname.startsWith('/login')) {
        navigate('/maintenance', { replace: true });
      }
      return;
    }

    if (isMaintenance && !isAdmin) {
      if (location.pathname !== '/maintenance' && !location.pathname.startsWith('/login')) {
        navigate('/maintenance', { replace: true });
      }
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

  if (loading) return <LoadingScreen />;

  return (
    <>
      <PathTracker />
      <ImpersonateBanner />
      {isImpersonating && <div className="h-8" />}

      <PrivacyModal isOpen={showPrivacyModal} />

      {shouldShowMenu && <LuckyBlockMenu />}
      {shouldShowMenu && <ChatWidget />}

      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode='wait'>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginSelection /></PublicRoute>} />
            <Route path="/login/:role" element={<PublicRoute><RoleLogin /></PublicRoute>} />
            <Route path="/first-access" element={<FirstAccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />

            <Route path="/dashboard" element={<PrivateRoute><DashboardHome /></PrivateRoute>} />
            <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
            <Route path="/mochila" element={<PrivateRoute><Mochila /></PrivateRoute>} />
            <Route path="/loja" element={<PrivateRoute><Loja /></PrivateRoute>} />
            <Route path="/leilao" element={<PrivateRoute><Leilao /></PrivateRoute>} />
            <Route path="/gil-investe" element={<PrivateRoute><GilInveste /></PrivateRoute>} />
            <Route path="/loja-notas" element={<PrivateRoute><LojaNotas /></PrivateRoute>} />
            <Route path="/market" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/dashboard/pesquisa" element={<PrivateRoute><ResearchSurvey /></PrivateRoute>} />
            <Route path="/missoes" element={<PrivateRoute><QuestBoard /></PrivateRoute>} />
            <Route path="/regulamentos" element={<PrivateRoute><Regulations /></PrivateRoute>} />
            <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/banco" element={<PrivateRoute><Banco /></PrivateRoute>} />
            <Route path="/dashboard/gifts" element={<PrivateRoute><Gifts /></PrivateRoute>} />
            <Route path="/manual" element={<PrivateRoute><WikiMap /></PrivateRoute>} />

            <Route path="/taca-das-casas" element={<PrivateRoute><HouseCupHub /></PrivateRoute>} />
            <Route path="/taca-das-casas/beco-diagonal" element={<PrivateRoute><BecoDiagonal /></PrivateRoute>} />
            <Route path="/taca-das-casas/mochila" element={<PrivateRoute><MochilaSala /></PrivateRoute>} />
            <Route path="/taca-das-casas/punicoes" element={<PrivateRoute><Punicoes /></PrivateRoute>} />
            <Route path="/taca-das-casas/historico" element={<PrivateRoute><Historico /></PrivateRoute>} />
            <Route path="/taca-das-casas/linha-do-tempo" element={<PrivateRoute><LinhaDoTempo /></PrivateRoute>} />

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
            <Route path="/professor/dashboard" element={<PrivateRoute roles={['professor', 'admin']}><ProfessorDashboard /></PrivateRoute>} />
            <Route path="/coming-soon" element={<ComingSoon />} />

            <Route path="/admin" element={<Navigate to="/admin/classes" replace />} />
            <Route path="/admin/classes" element={<PrivateRoute roles={['admin']}><AdminClasses /></PrivateRoute>} />
            <Route path="/admin/store" element={<PrivateRoute roles={['admin']}><AdminStore /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/quests" element={<PrivateRoute roles={['admin']}><AdminQuests /></PrivateRoute>} />
            <Route path="/admin/auctions" element={<PrivateRoute roles={['admin']}><AdminAuctions /></PrivateRoute>} />
            <Route path="/admin/scanner" element={<PrivateRoute roles={['admin']}><AdminScanner /></PrivateRoute>} />
            <Route path="/admin/logs" element={<PrivateRoute roles={['admin']}><AdminLogs /></PrivateRoute>} />
            <Route path="/admin/gifts" element={<PrivateRoute roles={['admin']}><AdminGifts /></PrivateRoute>} />
            <Route path="/admin/config" element={<PrivateRoute roles={['admin']}><AdminConfig /></PrivateRoute>} />
            <Route path="/admin/images" element={<PrivateRoute roles={['admin']}><AdminImages /></PrivateRoute>} />
            <Route path="/admin/punishments" element={<PrivateRoute roles={['admin']}><AdminPunishments /></PrivateRoute>} />
            <Route path="/admin/approvals" element={<PrivateRoute roles={['admin']}><AdminApprovals /></PrivateRoute>} />
            <Route path="/admin/startups" element={<PrivateRoute roles={['admin']}><AdminStartupApprovals /></PrivateRoute>} />
            <Route path="/admin/house" element={<PrivateRoute roles={['admin']}><AdminHouse /></PrivateRoute>} />
            <Route path="/admin/analytics" element={<PrivateRoute roles={['admin']}><AdminAnalytics /></PrivateRoute>} />
            <Route path="/admin/economy" element={<PrivateRoute roles={['admin']}><AdminEconomy /></PrivateRoute>} />
            <Route path="/admin/economy/config" element={<PrivateRoute roles={['admin']}><AdminEconomyConfig /></PrivateRoute>} />
            <Route path="/admin/disciplinas" element={<PrivateRoute roles={['admin']}><AdminDisciplinas /></PrivateRoute>} />
            <Route path="/admin/regulations" element={<PrivateRoute roles={['admin']}><AdminRegulations /></PrivateRoute>} />
            <Route path="/admin/surveys" element={<PrivateRoute roles={['admin']}><AdminSurveys /></PrivateRoute>} />
            <Route path="/admin/professors" element={<PrivateRoute roles={['admin']}><AdminProfessors /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <AIWidgetWrapper />
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
