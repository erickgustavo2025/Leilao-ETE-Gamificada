import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../layout/LoadingScreen';
import { toast } from 'sonner';

interface UserData {
  role: string;
  cargos?: string[];
}

function getDashboardByRole(role?: string): string {
    switch (role) {
      case 'dev': return '/dev';
      case 'admin': return '/admin/classes';
      case 'monitor': return '/monitor';
      case 'professor': return '/professor/dashboard';
      default: return '/dashboard';
    }
}

export function PrivateRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { signed, loading, user, isImpersonating } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!signed) return <Navigate to="/login" replace />;

  if (roles && user && !isImpersonating) {
    const typedUser = user as UserData;
    const hasPermission =
      roles.includes(typedUser.role) ||
      (typedUser.cargos && typedUser.cargos.some((cargo) => roles.includes(cargo)));

    if (!hasPermission) {
      toast.error("Acesso não autorizado.");
      return <Navigate to={getDashboardByRole(typedUser.role)} replace />;
    }
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { signed, loading, user, isImpersonating } = useAuth();

  if (loading) return <LoadingScreen />;

  if (signed && user) {
    const LAST_PATH_KEY = '@ETEGamificada:lastPath';
    const lastPath = localStorage.getItem(LAST_PATH_KEY);
    
    const PUBLIC_PATHS = ['/', '/login', '/first-access', '/forgot-password', '/reset-password', '/maintenance', '/politica-privacidade'];
    const isPublicPath = (path: string) =>
      PUBLIC_PATHS.includes(path) || path.startsWith('/login/') || path.startsWith('/armada/login');

    if (lastPath && !isPublicPath(lastPath)) {
      return <Navigate to={lastPath} replace />;
    }

    if (isImpersonating) {
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to={getDashboardByRole((user as UserData).role)} replace />;
  }

  return <>{children}</>;
}
