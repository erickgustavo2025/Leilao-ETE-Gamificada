// ─────────────────────────────────────────────────────────────────
// TIPOS E CONSTANTES PARA O PAINEL ADMINISTRATIVO
// ─────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  nome: string;
  matricula: string;
  turma: string;
  saldoPc: number;
  rank: string;
  role: 'student' | 'monitor' | 'admin' | 'dev';
  isBlocked: boolean;
  avatar?: string;
  cargosEspeciais?: string[];
}

export const BADGE_CATALOG = [
  // 🏆 GRUPO 1: PATENTES DE RANKING
  { id: 'BRONZE', label: '🥉 Guardião de Bronze', group: 'RANK', color: 'text-amber-600' },
  { id: 'PRATA', label: '🥈 Cavaleiro de Prata', group: 'RANK', color: 'text-slate-300' },
  { id: 'OURO', label: '🥇 Campeão de Ouro', group: 'RANK', color: 'text-yellow-500' },
  { id: 'DIAMANTE', label: '💎 Mestre Diamante', group: 'RANK', color: 'text-cyan-400' },
  { id: 'EPICO', label: '👑 Herói Épico', group: 'RANK', color: 'text-purple-500' },
  { id: 'LENDARIO', label: '🌟 Lendário da ETE', group: 'RANK', color: 'text-fuchsia-400' },
  { id: 'SUPREMO', label: '🔥 Supremo Imortal', group: 'RANK', color: 'text-rose-500' },
  { id: 'MITOLOGICO', label: '🔱 Entidade Mitológica', group: 'RANK', color: 'text-indigo-400' },
  { id: 'SOBERANO', label: '⚡ Soberano Absoluto', group: 'RANK', color: 'text-yellow-400' },

  // ⚡ GRUPO 2: FUNCIONALIDADES DO SITE
  { id: 'PODE_TRANSFERIR', label: '💸 Pix Escolar (Transferir)', group: 'FUNC', color: 'text-green-400' },
  { id: 'PODE_FAZER_TRADE', label: '🔄 Trade Direto (Trocas)', group: 'FUNC', color: 'text-blue-400' },
  { id: 'PODE_COMPRAR_VENDER', label: '🛍️ Marketplace (P2P)', group: 'FUNC', color: 'text-orange-400' },
  { id: 'PODE_PEDIR_EMPRESTIMO', label: '🏦 Empréstimos (ETE Bank)', group: 'FUNC', color: 'text-teal-400' },
  { id: 'PODE_COMPRAR_NOTAS', label: '📝 Compra de Notas', group: 'FUNC', color: 'text-red-400' },

  // 🎭 GRUPO 3: CARGOS ESCOLARES / COSMÉTICOS
  { id: 'monitor_disciplina', label: 'Monitor de Disciplina', group: 'ROLE', color: 'text-blue-500' },
  { id: 'monitor_escola', label: 'Monitor da Escola', group: 'ROLE', color: 'text-purple-500' },
  { id: 'armada_dumbledore', label: 'Armada de Dumbledore', group: 'ROLE', color: 'text-red-500' },
  { id: 'monitor_biblioteca', label: 'Monitor da Biblioteca', group: 'ROLE', color: 'text-green-500' },
  { id: 'monitor_quadra', label: 'Monitor da Quadra', group: 'ROLE', color: 'text-orange-500' },
  { id: 'banda', label: 'Integrante da Banda', group: 'ROLE', color: 'text-pink-500' },
  { id: 'representante', label: 'Representante de Sala', group: 'ROLE', color: 'text-cyan-500' },
  { id: 'estudante_honorario', label: 'Estudante Honorário', group: 'ROLE', color: 'text-yellow-500' },
  { id: 'colaborador', label: 'Colaborador (Site)', group: 'ROLE', color: 'text-indigo-500' },
];

export const CATEGORIES = [
  { id: 'RANK', label: '🏆 PATENTES DE RANKING', color: 'text-yellow-500' },
  { id: 'FUNC', label: '⚡ FUNCIONALIDADES', color: 'text-cyan-400' },
  { id: 'ROLE', label: '🎭 CARGOS E COSMÉTICOS', color: 'text-purple-400' },
];
