// frontend/src/pages/public/home/components/BackgroundLayers.tsx
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check, { passive: true });
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
};

export const BackgroundLayers = React.memo(() => {
    const isMobile = useIsMobile();
    const { scrollY } = useScroll();

    // Em mobile: sem parallax (MotionValues estáticas = 0)
    const y1 = useTransform(scrollY, [0, 1000], isMobile ? [0, 0] : [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], isMobile ? [0, 0] : [0, -150]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Orbs Gradient — blur só no desktop */}
            <motion.div style={{ y: y1 }} className="absolute inset-0">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full"
                    style={{ filter: isMobile ? 'none' : 'blur(120px)' }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-900/10 rounded-full"
                    style={{ filter: isMobile ? 'none' : 'blur(120px)' }}
                />
            </motion.div>

            {/* Grid Pattern — mais leve em mobile */}
            <motion.div style={{ y: y2 }} className={isMobile ? 'absolute inset-0 opacity-10' : 'absolute inset-0 opacity-20'}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </motion.div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)]" />
        </div>
    );
});

BackgroundLayers.displayName = 'BackgroundLayers';
