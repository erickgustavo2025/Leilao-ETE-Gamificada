import { useEffect } from 'react';
import { api } from '../api/axios-config';

/**
 * useEngagementTracker
 * Rastro científico para o PJC: Registra a pulsação passiva do site.
 */
export const useEngagementTracker = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const STORAGE_KEY = '@ETEGamificada:lastVisit';
        const now = new Date().getTime();
        const lastVisit = localStorage.getItem(STORAGE_KEY);
        
        // Só registra se passou mais de 12 horas desde a última visita passiva
        // Isso garante dados científicos limpos (sem flood por F5)
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        const lastVisitTime = lastVisit ? Number(lastVisit) : 0;

        if (!lastVisit || (now - lastVisitTime) > TWELVE_HOURS) {
          await api.post('/public/analytics/visit');
          localStorage.setItem(STORAGE_KEY, now.toString());
          console.log('🔬 [PJC] Visita passiva registrada com sucesso.');
        }
      } catch {
        // Falha silenciosa para não atrapalhar a UX
        console.warn('⚠️ [Analytics] Falha silenciosa no rastro passivo.');
      }
    };

    trackVisit();
  }, []); // Executa apenas uma vez no carregamento da App
};
