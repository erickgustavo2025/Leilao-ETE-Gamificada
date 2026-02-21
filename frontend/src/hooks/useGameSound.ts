import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useGameSound() {
  const { soundEnabled } = useAuth(); // ADICIONAR

  const playSound = useCallback((type: 'click' | 'hover' | 'success' | 'error') => {
    if (!soundEnabled) return; // ADICIONAR GUARD

    // Tenta tocar, se falhar (sem arquivo ou erro de navegador), ignora silenciosamente
    try {
      const audio = new Audio(`/assets/sounds/${type}.mp3`);
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Erro silencioso para não sujar o console
        });
      }
    } catch (e) {
      // Ignora erro de criação
    }
  }, [soundEnabled]);

  return {
    playClick: () => playSound('click'),
    playHover: () => playSound('hover'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
  };
}