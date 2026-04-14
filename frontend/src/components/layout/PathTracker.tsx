import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LAST_PATH_KEY = '@ETEGamificada:lastPath';
const PUBLIC_PATHS = ['/', '/login', '/first-access', '/forgot-password', '/reset-password', '/maintenance', '/politica-privacidade'];

const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) || path.startsWith('/login/') || path.startsWith('/armada/login');

export function PathTracker() {
  const location = useLocation();
  const { signed, isImpersonating } = useAuth();

  useEffect(() => {
    if (signed && !isImpersonating && !isPublicPath(location.pathname)) {
      localStorage.setItem(LAST_PATH_KEY, location.pathname);
    }
  }, [location.pathname, signed, isImpersonating]);

  return null;
}
