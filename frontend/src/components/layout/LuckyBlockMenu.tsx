import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Gift, Landmark, Gavel, X, Home, Map, Trophy, User, LogOut,
  Backpack, ShoppingBag, Volume2, VolumeX, ArrowRightLeft,
  Store, Calendar, type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';

// 🔥 LAZY LOAD DOS MODAIS (Para não pesar a renderização inicial)
const TransferModal = lazy(() => import('../features/TransferModal').then(m => ({ default: m.TransferModal })));
const TradeModal = lazy(() => import('../features/TradeModal').then(m => ({ default: m.TradeModal })));
const UserSelectModal = lazy(() => import('../features/UserSelectModal').then(m => ({ default: m.UserSelectModal })));
const EventsModal = lazy(() => import('../features/EventsModal').then(m => ({ default: m.EventsModal })));

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  action?: () => void;
  roles?: string[];
  color?: string;
}

export function LuckyBlockMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  
  // Estado único para controlar qual modal está aberto
  const [activeModal, setActiveModal] = useState<'transfer' | 'tradeSelect' | 'trade' | 'events' | null>(null);
  const [tradeTarget, setTradeTarget] = useState<any>(null);

  const { user, logout, soundEnabled, toggleSound, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenRoutes = ['/', '/first-access', '/dev', '/monitor', '/forgot-password', '/reset-password'];
  const shouldHide = hiddenRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/admin');

  if (!user || shouldHide) return null;

  const userName = user.nome || 'Estudante';
  const userInitial = userName.charAt(0).toUpperCase();
  const userSaldo = typeof user.saldoPc === 'number' ? user.saldoPc : 0;

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'DASHBOARD', path: '/dashboard', color: 'text-white' },
    { icon: Backpack, label: 'MOCHILA', path: '/mochila', color: 'text-orange-400' },
    { icon: Gift, label: 'PRESENTES', path: '/dashboard/gifts', color: 'text-pink-500' },
    { icon: Store, label: 'MERCADO PÚBLICO', path: '/market', color: 'text-cyan-400' },
    { icon: Calendar, label: 'EVENTOS', action: () => setActiveModal('events'), color: 'text-yellow-500' },
    { icon: ArrowRightLeft, label: 'TROCAS', action: () => setActiveModal('tradeSelect'), color: 'text-indigo-400' },
    { icon: ShoppingBag, label: 'LOJA', path: '/loja', color: 'text-pink-400' },
    { icon: Gavel, label: 'LEILÃO', path: '/leilao', color: 'text-yellow-400' },
    { icon: ArrowRightLeft, label: 'PIX', action: () => setActiveModal('transfer'), color: 'text-emerald-400' },
    { icon: Trophy, label: 'RANKING', path: '/ranking', color: 'text-purple-400' },
    { icon: Landmark, label: 'BANCO', path: '/banco', color: 'text-yellow-300' },
    { icon: Map, label: 'MANUAL', path: '/manual', color: 'text-slate-400' },
    { icon: User, label: 'PERFIL', path: '/perfil', color: 'text-blue-400' },
  ];

  const handleBlockClick = () => {
    if (isOpen) return;
    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
      setIsOpen(true);
    }, 400);
  };

  const handleItemClick = (item: MenuItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleTradeSelection = (selectedUser: any) => {
    setActiveModal(null); // Fecha o select
    setTradeTarget(selectedUser);
    setTimeout(() => setActiveModal('trade'), 100); // Abre o trade
  };

  return (
    <>
      <motion.button
        onClick={handleBlockClick}
        className="fixed top-4 left-4 z-[100] w-16 h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer outline-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
        animate={isJumping ? { y: [0, -20, 0], scale: [1, 1.1, 1] } : { y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
      >
        <img
          src="/assets/lucky-block.png"
          alt="Lucky Block"
          className="w-full h-full pixelated"
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-[110]"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 z-[120] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-slate-950">
                    {user.avatar ? (
                      <img src={getImageUrl(user.avatar)} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-press text-white uppercase">
                        {userInitial}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-press text-[10px] opacity-80 truncate w-32">{userName.split(' ')[0]}</p>
                    <p className="text-yellow-400 font-vt323 text-lg leading-none">
                      {userSaldo} PC$
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {menuItems.map((item) => (
                  (!item.roles || item.roles.includes(user.role)) && (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "w-full flex items-center gap-4 px-6 py-4 border-l-4 transition-all group",
                        location.pathname === item.path
                          ? "bg-white/10 border-yellow-400 text-white"
                          : "border-transparent text-slate-400 hover:bg-white/5 hover:border-slate-600 hover:text-slate-200"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 transition-colors", location.pathname === item.path ? item.color : "text-slate-500 group-hover:text-white")} />
                      <span className="font-vt323 text-2xl tracking-wider pt-1 text-left flex-1">
                        {item.label}
                      </span>
                    </button>
                  )
                ))}
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
                <button
                  onClick={toggleSound}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 transition-all"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                  {soundEnabled ? 'SOM: ON' : 'SOM: OFF'}
                </button>

                <button
                  onClick={() => { setIsOpen(false); logout(); }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 font-press text-[10px] border border-red-900/50 hover:border-red-500 rounded transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  SAIR
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAIS COM LAZY LOADING */}
      <Suspense fallback={null}>
        {activeModal === 'transfer' && (
          <TransferModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onSuccess={() => refreshUser()}
          />
        )}

        {activeModal === 'tradeSelect' && (
          <UserSelectModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onUserSelected={handleTradeSelection}
          />
        )}

        {activeModal === 'trade' && tradeTarget && (
          <TradeModal
            isOpen={true}
            onClose={() => { setActiveModal(null); setTradeTarget(null); }}
            targetUser={tradeTarget}
          />
        )}

        {activeModal === 'events' && (
          <EventsModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}
      </Suspense>
    </>
  );
}