import { useState, memo, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Crown, AlertTriangle, ChevronLeft, ChevronDown,
  Zap, Search, Star, Flame,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PixelCard } from '../../components/ui/PixelCard';
import { cn } from '../../utils/cn';
import { api } from '../../api/axios-config';
import { getImageUrl } from '../../utils/imageHelper';
import { useAuth } from '../../contexts/AuthContext';
import { PageTransition } from '../../components/layout/PageTransition';
import { calculateRank } from '../../utils/rankHelper';
import { StudentProfilePopup, type StudentProfileData } from '../../components/features/StudentProfilePopup';

// ========================
// HOOK: Detectar Mobile
// ========================
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// ========================
// TIPAGENS
// ========================
interface Student {
  _id: string;
  nome: string;
  turma: string;
  saldoPc: number;
  maxPcAchieved: number;
  avatar?: string;
  isVip?: boolean;
}

interface ClassStats {
  id: string;
  nomeTime: string;
  nomeTurma: string;
  totalPc: number;
  alunosCount: number;
  cor: string;
  hex: string;
  img: string;
}

interface ClassConfig {
  nome: string;
  cor: string;
  img: string;
}

// ========================
// COMPONENTE: Podium Item
// ========================
const PodiumItem = memo(({ student, rank, isMobile, getRankName, style, onAvatarClick }: any) => {
  if (!student) return null;

  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const config = isFirst
    ? { height: "h-36 md:h-48", width: "w-28 md:w-36", color: "text-yellow-400", border: "border-yellow-500", bg: "from-yellow-400 via-yellow-500 to-yellow-600", icon: Crown }
    : isSecond
      ? { height: "h-24 md:h-32", width: "w-20 md:w-24", color: "text-slate-300", border: "border-slate-400", bg: "from-slate-400 to-slate-600", icon: Star }
      : { height: "h-20 md:h-28", width: "w-20 md:w-24", color: "text-orange-400", border: "border-orange-700", bg: "from-orange-700 to-orange-900", icon: Flame };

  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center", isFirst ? "-mt-10 z-40 relative" : "z-10 relative")}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + (rank * 0.1) }}
        className="relative mb-3"
      >
        <div
          className={cn("rounded-full overflow-hidden border-4 bg-slate-800 relative shadow-2xl cursor-pointer hover:brightness-110 transition-all",
            isFirst ? "w-24 h-24 md:w-32 md:h-32" : "w-16 h-16 md:w-20 md:h-20",
            config.border
          )}
          onClick={() => onAvatarClick?.(student)}
        >
          {student.avatar ? (
            <img src={getImageUrl(student.avatar)} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-press text-2xl uppercase" style={{ backgroundColor: style.cor }}>
              {student.nome.charAt(0)}
            </div>
          )}
        </div>

        <div className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-press text-xs shadow-lg border",
          isFirst ? "bg-yellow-400 text-yellow-900 border-yellow-200" :
          isSecond ? "bg-slate-300 text-slate-900 border-slate-200" : "bg-orange-700 text-white border-orange-500"
        )}>
          #{rank}
        </div>

        {isFirst && !isMobile && (
          <motion.div
            animate={{ y: [-10, 0, -10], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 z-50"
          >
            <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ height: 0 }} animate={{ height: "auto" }}
        className={cn("rounded-t-xl flex items-end justify-center pb-4 shadow-2xl bg-gradient-to-b border-x-4 border-t-4",
          config.height, config.width, config.bg, config.border
        )}
      >
        <Icon className={cn("w-8 h-8 opacity-50 text-white mix-blend-overlay")} />
      </motion.div>

      <div className="mt-2 text-center">
        <p className="font-vt323 text-xl md:text-2xl text-white font-bold truncate max-w-[120px]">
          {student.nome.split(' ')[0]}
        </p>
        <p className={cn("font-mono text-xs font-bold", config.color)}>
          {student.saldoPc.toLocaleString()} PC$
        </p>
        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1 bg-black/40 px-2 py-0.5 rounded border border-slate-700/50 inline-block">
          {getRankName(student.maxPcAchieved)}
        </p>
      </div>
    </div>
  );
});
PodiumItem.displayName = 'PodiumItem';

// ========================
// COMPONENTE: Lista Item
// ========================
const RankListItem = memo(({ student, index, getRankName, style, onAvatarClick }: any) => (
  <div className="group relative">
    <PixelCard className="flex items-center gap-4 py-3 px-4 bg-slate-900/50 backdrop-blur-md border-l-4 hover:bg-slate-800 transition-all shadow-lg" style={{ borderLeftColor: style.cor }}>
      <span className="font-press text-slate-500 w-8 text-center text-xs">
        #{index + 4}
      </span>

      <button
        type="button"
        onClick={() => onAvatarClick?.(student)}
        className="w-10 h-10 bg-black rounded-full border border-slate-600 overflow-hidden flex-shrink-0 hover:border-yellow-500 transition-colors"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <img
          src={getImageUrl(student.avatar)}
          className="w-full h-full object-cover"
          onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.nome}&background=random`}
        />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-vt323 text-xl text-white truncate leading-none mb-1">
          {student.nome}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-400 bg-black/30 px-1.5 py-0.5 rounded border border-slate-700">
            {student.turma || "S/ Turma"}
          </span>
          <span className="font-mono text-[9px] font-bold text-yellow-600/90 bg-yellow-900/10 px-1.5 py-0.5 rounded border border-yellow-900/20">
            {getRankName(student.maxPcAchieved)}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="font-press text-xs text-yellow-400 flex items-center gap-1 justify-end">
          <Zap className="w-3 h-3" />
          {student.saldoPc}
        </p>
      </div>
    </PixelCard>
  </div>
));
RankListItem.displayName = 'RankListItem';

// ========================
// COMPONENTE PRINCIPAL
// ========================
export function Ranking() {
  const { ranks } = useAuth();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'herois' | 'turmas'>('herois');
  const [showAllHeroes, setShowAllHeroes] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do popup de perfil
  const [profilePopup, setProfilePopup] = useState<{ isOpen: boolean; data: StudentProfileData | null }>({ isOpen: false, data: null });

  // ========================
  // QUERY 1: Classrooms
  // ========================
  const {
    data: classConfigMap = {},
    isLoading: isLoadingClassrooms
  } = useQuery({
    queryKey: ['ranking', 'classrooms'],
    queryFn: async () => {
      const { data: classrooms } = await api.get('/classrooms');
      const configMap: Record<string, ClassConfig> = {};

      classrooms.forEach((c: any) => {
        if (!c.serie) return;
        const key = c.serie.replace(/º|°/g, '').trim().toUpperCase();
        configMap[key] = {
          nome: c.nome,
          cor: c.cor,
          img: getImageUrl(c.logo)
        };
      });

      return configMap;
    },
    staleTime: 60000,
    retry: 2
  });

  // ========================
  // QUERY 2: Students
  // ========================
  const {
    data: rankingData,
    isLoading: isLoadingStudents,
    isError
  } = useQuery({
    queryKey: ['ranking', 'students'],
    queryFn: async () => {
      const { data: classrooms } = await api.get('/classrooms');

      const studentPromises = classrooms.map((c: any) =>
        api.get('/users/students', { params: { turma: c.serie } })
          .then(res => res.data)
          .catch(() => [])
      );
      const studentsArrays = await Promise.all(studentPromises);
      const studentsData = studentsArrays.flat();

      const uniqueStudents = Array.from(
        new Map(
          studentsData
            .filter((s: any) => s._id)
            .map((item: any) => [item._id, item])
        ).values()
      ) as Student[];

      uniqueStudents.sort((a, b) => (b.saldoPc || 0) - (a.saldoPc || 0));

      const classMap: Record<string, ClassStats> = {};
      uniqueStudents.forEach((student: Student) => {
        const rawTurma = student.turma || "SEM TURMA";
        const turmaKey = rawTurma.replace(/º|°/g, '').trim().toUpperCase();

        if (!classMap[turmaKey]) {
          const config = classConfigMap[turmaKey] || {
            nome: "DESCONHECIDA",
            cor: "#64748b",
            img: "/assets/etegamificada.png"
          };

          classMap[turmaKey] = {
            id: turmaKey,
            nomeTurma: rawTurma,
            nomeTime: config.nome,
            cor: config.cor,
            hex: config.cor,
            img: config.img,
            totalPc: 0,
            alunosCount: 0
          };
        }

        classMap[turmaKey].totalPc += (student.saldoPc || 0);
        classMap[turmaKey].alunosCount += 1;
      });

      const topClasses = Object.values(classMap).sort((a, b) => b.totalPc - a.totalPc);

      return {
        allStudents: uniqueStudents,
        topClasses
      };
    },
    enabled: Object.keys(classConfigMap).length > 0,
    staleTime: 60000,
    retry: 2
  });

  // ========================
  // COMPUTED VALUES
  // ========================
  const allStudents = rankingData?.allStudents || [];
  const topClasses = rankingData?.topClasses || [];

  const getRankName = (maxPoints: number) => calculateRank(maxPoints, ranks)?.name || "INICIANTE";

  const getStyle = (turma: string) => {
    const key = turma?.replace(/º|°/g, '').trim().toUpperCase();
    return classConfigMap[key] || { cor: '#64748b', img: '/assets/etegamificada.png' };
  };

  const displayedStudents = useMemo(() => {
    let list = allStudents;
    if (searchTerm) {
      list = list.filter((s: Student) => s.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list.slice(3, showAllHeroes ? 100 : 13);
  }, [allStudents, searchTerm, showAllHeroes]);

  const selectedClassStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return allStudents
      .filter((s: Student) => s.turma && s.turma.replace(/º|°/g, '').trim().toUpperCase() === selectedClassId)
      .sort((a, b) => b.saldoPc - a.saldoPc);
  }, [selectedClassId, allStudents]);

  const selectedClassInfo = topClasses.find((c: ClassStats) => c.id === selectedClassId);

  // Handler do popup de perfil — calcula posição global e abre
  const handleProfileClick = (student: Student) => {
    alert('CLICOU: ' + student.nome);  // teste temporário
    const globalIndex = allStudents.findIndex((s: Student) => s._id === student._id);
    const rankPosition = globalIndex >= 0 ? globalIndex + 1 : 0;
    setProfilePopup({
      isOpen: true,
      data: {
        _id: student._id,
        nome: student.nome,
        turma: student.turma,
        saldoPc: student.saldoPc,
        maxPcAchieved: student.maxPcAchieved,
        avatar: student.avatar,
        isVip: student.isVip,
        rankPosition
      }
    });
  };

  // ========================
  // LOADING & ERROR STATES
  // ========================
  if (isLoadingClassrooms || isLoadingStudents) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white">
        <div className="animate-spin mb-4"><Trophy className="text-yellow-400" size={32} /></div>
        <p className="font-press text-xs animate-pulse">CARREGANDO RANKING...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-400">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="font-press text-xs text-red-400 mb-4">Não foi possível carregar o ranking.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors text-white font-mono text-xs"
        >
          RECARREGAR PÁGINA
        </button>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen p-4 pb-24 space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6 mb-8 md:ml-24 pt-24 md:pt-6">
        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="font-press text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-md mb-2">
              RANKING
            </h1>
            <p className="font-vt323 text-xl text-slate-400 tracking-widest">OS MELHORES DA ETE</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-yellow-500 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* TABS */}
      {!selectedClassId && (
        <div className="sticky top-2 z-20 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 flex gap-2 shadow-xl">
          <button
            onClick={() => setActiveTab('herois')}
            className={cn("flex-1 py-3 rounded-lg font-vt323 text-xl transition-all", activeTab === 'herois' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
          >
            TOP HERÓIS
          </button>
          <button
            onClick={() => setActiveTab('turmas')}
            className={cn("flex-1 py-3 rounded-lg font-vt323 text-xl transition-all", activeTab === 'turmas' ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
          >
            GUERRA DE CASAS
          </button>
        </div>
      )}

      {/* CONTEÚDO: TOP HERÓIS */}
      <AnimatePresence mode="wait">
        {activeTab === 'herois' && !selectedClassId && (
          <motion.div
            key="herois"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {!searchTerm && allStudents.length > 0 && (
              <div className="flex justify-center items-end gap-2 md:gap-4 py-8 pt-20 relative z-30">
                <PodiumItem student={allStudents[1]} rank={2} isMobile={isMobile} getRankName={getRankName} style={getStyle(allStudents[1]?.turma)} onAvatarClick={handleProfileClick} />
                <PodiumItem student={allStudents[0]} rank={1} isMobile={isMobile} getRankName={getRankName} style={getStyle(allStudents[0]?.turma)} onAvatarClick={handleProfileClick} />
                <PodiumItem student={allStudents[2]} rank={3} isMobile={isMobile} getRankName={getRankName} style={getStyle(allStudents[2]?.turma)} onAvatarClick={handleProfileClick} />
              </div>
            )}

            <div className="space-y-3 relative z-10">
              {displayedStudents.map((aluno: Student, idx: number) => (
                <RankListItem
                  key={aluno._id}
                  student={aluno}
                  index={searchTerm ? idx - 3 : idx}
                  getRankName={getRankName}
                  style={getStyle(aluno.turma)}
                  onAvatarClick={handleProfileClick}
                />
              ))}

              {!searchTerm && allStudents.length > 13 && (
                <button
                  onClick={() => setShowAllHeroes(!showAllHeroes)}
                  className="w-full py-4 mt-4 bg-slate-800 border-2 border-slate-600 text-slate-400 font-press text-[10px] hover:bg-slate-700 hover:text-white hover:border-yellow-400 transition-all rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  {showAllHeroes ? "MOSTRAR MENOS" : "VER TOP 100"} <ChevronDown size={14} className={showAllHeroes ? "rotate-180" : ""} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO: GUERRA DE CASAS */}
      <AnimatePresence mode="wait">
        {activeTab === 'turmas' && !selectedClassId && (
          <motion.div key="turmas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {topClasses.map((turma: ClassStats, idx: number) => (
              <motion.div key={turma.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedClassId(turma.id)}>
                <PixelCard className="cursor-pointer bg-slate-900/50 backdrop-blur-md border-l-8 hover:bg-slate-800 transition-all py-5 px-5 shadow-lg relative overflow-hidden group" style={{ borderLeftColor: turma.hex }}>
                  <div className="absolute right-0 top-0 h-full w-1/3 opacity-0 group-hover:opacity-10 blur-2xl transition-opacity" style={{ backgroundColor: turma.hex }} />

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <span className={cn("font-press text-xl", idx === 0 ? "text-yellow-400" : "text-slate-500")}>
                        #{idx + 1}
                      </span>
                      <div className="w-14 h-14 border-2 border-slate-600 rounded-full overflow-hidden bg-black">
                        <img src={turma.img} className="w-full h-full object-cover" onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'} />
                      </div>
                      <div>
                        <h3 className="font-vt323 text-3xl uppercase text-white leading-none mb-1">{turma.nomeTime}</h3>
                        <p className="font-mono text-[10px] text-slate-400">{turma.alunosCount} MEMBROS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-vt323 text-3xl text-yellow-400">{turma.totalPc.toLocaleString()}</p>
                      <p className="font-press text-[8px] text-slate-500">PONTOS</p>
                    </div>
                  </div>
                </PixelCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETALHES DA TURMA SELECIONADA */}
      <AnimatePresence>
        {selectedClassId && selectedClassInfo && (
          <motion.div key="detalhes" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className="space-y-6">

            <div className="bg-slate-900/80 p-6 rounded-2xl border-2 shadow-2xl relative overflow-hidden" style={{ borderColor: selectedClassInfo.hex }}>
              <div className="absolute inset-0 opacity-10 blur-3xl" style={{ backgroundColor: selectedClassInfo.hex }} />
              <div className="relative z-10 flex items-center gap-4">
                <button onClick={() => setSelectedClassId(null)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                  <ChevronLeft className="text-white" />
                </button>
                <img src={selectedClassInfo.img} className="w-16 h-16 rounded-full border-2 border-white" onError={(e) => (e.currentTarget as HTMLImageElement).src = '/assets/etegamificada.png'} />
                <div>
                  <h2 className="font-vt323 text-4xl text-white uppercase">{selectedClassInfo.nomeTime}</h2>
                  <p className="font-mono text-xs text-slate-300">{selectedClassInfo.nomeTurma}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedClassStudents.map((aluno: Student, idx: number) => (
                <RankListItem
                  key={aluno._id}
                  student={aluno}
                  index={idx - 3}
                  getRankName={getRankName}
                  style={{ cor: selectedClassInfo.hex }}
                  onAvatarClick={handleProfileClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP DE PERFIL */}
      <StudentProfilePopup
        isOpen={profilePopup.isOpen}
        onClose={() => setProfilePopup({ isOpen: false, data: null })}
        prefetchedData={profilePopup.data || undefined}
      />

    </PageTransition>
  );
}
