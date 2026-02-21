import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ParticleBackground() {
  const [isLiteMode, setIsLiteMode] = useState(true);

  useEffect(() => {
    // Detecta se é mobile ou tela pequena para ativar modo leve
    const checkMobile = () => setIsLiteMode(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ⚡ OTIMIZAÇÃO: 30 partículas no PC, ZERO no celular (para economizar bateria/gpu)
  // No celular, o fundo gradiente já é bonito o suficiente.
  const particleCount = isLiteMode ? 0 : 20;
  const particles = useMemo(() => Array.from({ length: particleCount }), [particleCount]);

  if (isLiteMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            opacity: [0, 0.5, 0], // Opacidade reduzida para pesar menos
            y: [null, Math.random() * -50], // Movimento menor
          }}
          transition={{
            duration: Math.random() * 5 + 5, // Mais lento = Menos FPS necessário
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear", // Linear é mais barato pra CPU calcular que EaseInOut
          }}
          className="absolute w-1 h-1 bg-yellow-400/30 rounded-full" // Menos sombra/blur
        />
      ))}
      {/* Gradiente estático leve */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] via-transparent to-transparent opacity-80" />
    </div>
  );
}