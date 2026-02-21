import { useState, useCallback, useMemo, Suspense, lazy, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gift, Landmark, LogOut, Store, ShoppingBag, Backpack,
  Trophy, User, Calendar, Gavel, BookOpen, ArrowRightLeft,
  Dices, MessageSquare, GraduationCap, Loader2
} from 'lucide-react';
import { PixelButton } from '../../components/ui/PixelButton';
import { PageTransition } from '../../components/layout/PageTransition';
import { calculateRank, calculateRankProgress } from '../../utils/rankHelper';
import { DashboardHeader } from './components/DashboardHeader';
import { ActionSection } from './components/ActionSection';

// ⚡ OTIMIZAÇÃO: Lazy Load dos Modais
const TransferModal = lazy(() => import('../../components/features/TransferModal').then(m => ({ default: m.TransferModal })));
const TradeModal = lazy(() => import('../../components/features/TradeModal').then(m => ({ default: m.TradeModal })));
const UserSelectModal = lazy(() => import('../../components/features/UserSelectModal').then(m => ({ default: m.UserSelectModal })));
const EventsModal = lazy(() => import('../../components/features/EventsModal').then(m => ({ default: m.EventsModal })));
const FeedbackModal = lazy(() => import('../../components/features/FeedbackModal').then(m => ({ default: m.FeedbackModal })));

export function DashboardHome() {
  const { user, logout, ranks, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar o carregamento inicial dos dados
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Estados dos Modais
  const [modalState, setModalState] = useState({
    transfer: false,
    userSelect: false,
    feedback: false,
    events: false
  });
  
  const [tradeTarget, setTradeTarget] = useState<any>(null);

  // 🔥 EFEITO DE CARREGAMENTO BLINDADO
  useEffect(() => {
    let mounted = true;
    
    // 1. Cria um "Cronômetro de Segurança"
    // Se o backend estiver dormindo ou a rede travar, em 3 segundos nós forçamos a tela a abrir.
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("⚠️ Timeout: Backend demorou demais. Liberando acesso com dados locais.");
        setIsRefreshing(false); 
      }
    }, 3000); // 3000ms = 3 segundos

    const loadData = async () => {
      try {
        // Tenta buscar os dados novos
        await refreshUser();
      } catch (error) {
        console.error("Erro ao sincronizar (usando cache local):", error);
      } finally {
        // 2. Se a resposta chegou antes dos 3s, cancela o cronômetro e abre a tela
        clearTimeout(safetyTimer);
        if (mounted) setIsRefreshing(false);
      }
    };

    loadData();

    // Limpeza de memória se o usuário sair da tela antes de terminar
    return () => { 
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [refreshUser]);

  // Cálculos de Rank (Memoizados)
  const rankPoints = user?.maxPcAchieved || 0;
  const currentMoney = user?.saldoPc || 0;

  const xpInfo = useMemo(() => calculateRankProgress(rankPoints, ranks), [rankPoints, ranks]);
  const currentRankObj = useMemo(() => calculateRank(rankPoints, ranks), [rankPoints, ranks]);

  // Navegação e Modais
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  const toggleModal = useCallback((key: keyof typeof modalState, value: boolean) => {
    setModalState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleTransferSuccess = useCallback(async () => {
    await refreshUser();
    toggleModal('transfer', false);
  }, [refreshUser, toggleModal]);

  const handleUserSelected = useCallback((selectedUser: any) => {
    toggleModal('userSelect', false);
    setTradeTarget(selectedUser);
  }, [toggleModal]);

  // Se não tiver user (logout), não renderiza nada
  if (!user) return null;

  // ⏳ TELA DE CARREGAMENTO (Evita glitch de "Iniciante")
  if (isRefreshing) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
           <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
           <p className="font-press text-xs text-blue-400">Sincronizando...</p>
        </div>
      </div>
    );
  }

  // Definição das Seções
  const SECTIONS = [
    {
      title: "ECONOMIA & MERCADO",
      items: [
        { label: "LOJA OFICIAL", icon: Store, color: "text-blue-400", desc: "Gaste seus PC$", path: "/loja" },
        { label: "BANCO GERAL", icon: Landmark, color: "text-yellow-300", desc: "Extratos e Poupança", path: "/banco" },
        { label: "CASA DE LEILÕES", icon: Gavel, color: "text-amber-500", desc: "Itens raros", path: "/leilao" },
        { label: "MOCHILA", icon: Backpack, color: "text-yellow-400", desc: "Seu inventário", path: "/mochila" },
        {label: "MERCADO PÚBLICO", icon: Store, color: "text-red-400", desc: "Coloque os Seus Itens à Venda", path: "/market"},
        { label: "FAZER PIX", icon: ArrowRightLeft, color: "text-green-400", desc: "Transferir PC$", action: () => toggleModal('transfer', true) },
        { label: "MERCADO DE NOTAS", icon: BookOpen, color: "text-indigo-400", desc: "Troque PC$ por Nota", path: "/coming-soon?module=NOTAS" },
        { label: "TROCAR (TRADE)", icon: ShoppingBag, color: "text-purple-400", desc: "Negociar itens", action: () => toggleModal('userSelect', true) }
      ]
    },
    {
      title: "ATIVIDADES & RANK",
      items: [
        { label: "HUB DE EVENTOS", icon: Calendar, color: "text-yellow-500", desc: "Taça, Intergil & Gincanas", action: () => toggleModal('events', true) },
        { label: "MEUS PRESENTES", icon: Gift, color: "text-pink-500", desc: "Itens recebidos", path: "/dashboard/gifts" },
        { label: "GILBET APOSTAS", icon: Dices, color: "text-emerald-500", desc: "Aposte e Ganhe", path: "/coming-soon?module=GILBET" },
        { label: "ROLETADA & SORTEIOS", icon: Dices, color: "text-cyan-400", desc: "Ganhe prêmios", path: "/roleta" },
        { label: "RANKING GERAL", icon: Trophy, color: "text-orange-400", desc: "Top Global", path: "/ranking" },
        { label: "RANKING EGRESSOS", icon: GraduationCap, color: "text-violet-400", desc: "Lendas da Escola", path: "/coming-soon?module=EGRESSOS" },
      ]
    },
    {
      title: "INSTITUCIONAL",
      items: [
        { label: "PERFIL", icon: User, color: "text-cyan-400", desc: "Seus dados", path: "/perfil" },
        { label: "MANUAL DO SISTEMA", icon: BookOpen, color: "text-slate-300", desc: "Wiki & Tutoriais", path: "/manual" },
        { label: "FEEDBACK / BUGS", icon: MessageSquare, color: "text-pink-400", desc: "Ajude a melhorar", action: () => toggleModal('feedback', true) }
      ]
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] p-4 relative overflow-hidden">

        {/* Fundo Otimizado (Radial Gradient leve) */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full" 
               style={{ background: 'radial-gradient(circle, rgba(88,28,135,0.3) 0%, rgba(0,0,0,0) 70%)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full" 
               style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.3) 0%, rgba(0,0,0,0) 70%)' }} />
        </div>

        <div className="md:pl-28 pt-16 md:pt-4 mb-8 relative z-10">
          <DashboardHeader
            user={user}
            currentMoney={currentMoney}
            rankPoints={rankPoints}
            currentRankObj={currentRankObj}
            xpInfo={xpInfo}
          />
        </div>

        <div className="md:pl-28 space-y-2 relative z-10">
          {SECTIONS.map((section, index) => (
            <ActionSection
              key={section.title}
              title={section.title}
              items={section.items}
              delay={index + 1}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        <div className="md:pl-28 pt-4 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <PixelButton
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border-red-900 text-red-400 opacity-80 hover:opacity-100 transition-all"
            >
              <LogOut size={16} />
              ENCERRAR SESSÃO
            </PixelButton>
          </motion.div>
        </div>
      </div>

      {/* Suspense para carregar modais sob demanda */}
      <Suspense fallback={null}>
        {modalState.transfer && (
          <TransferModal
            isOpen={modalState.transfer}
            onClose={() => toggleModal('transfer', false)}
            onSuccess={handleTransferSuccess}
          />
        )}

        {modalState.userSelect && (
          <UserSelectModal
            isOpen={modalState.userSelect}
            onClose={() => toggleModal('userSelect', false)}
            onUserSelected={handleUserSelected}
          />
        )}

        {modalState.feedback && (
          <FeedbackModal
            isOpen={modalState.feedback}
            onClose={() => toggleModal('feedback', false)}
          />
        )}

        {tradeTarget && (
          <TradeModal
            isOpen={!!tradeTarget}
            onClose={() => setTradeTarget(null)}
            targetUser={tradeTarget}
          />
        )}

        {modalState.events && (
          <EventsModal isOpen={modalState.events} onClose={() => toggleModal('events', false)} />
        )}
      </Suspense>

    </PageTransition>
  );
}