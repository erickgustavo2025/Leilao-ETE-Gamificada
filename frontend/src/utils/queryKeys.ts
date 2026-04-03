// frontend/src/utils/queryKeys.ts
/**
 * 🗂️ Query Keys Centralizadas - ETE Gamificada
 * 
 * Estratégia: Evitar typos, facilitar invalidação de cache e manter consistência.
 * Padrão: Array de strings categorizadas por domínio.
 */

export const queryKeys = {
  // 🔧 ADMIN DOMAIN
  admin: {
    auctions: ['admin', 'auctions'] as const,
    classes: ['admin', 'classes'] as const,
    config: ['admin', 'config'] as const,
    
    store: {
      items: ['admin', 'store', 'items'] as const,
      all: ['admin', 'store', 'all'] as const,
    },
    
    house: {
      leaderboard: ['admin', 'house', 'leaderboard'] as const,
      config: ['admin', 'house', 'config'] as const,
    },
    
    images: (filter?: string) => 
      filter ? ['admin', 'images', filter] as const : ['admin', 'images'] as const,
    
    logs: (filter?: string) => 
      filter ? ['admin', 'logs', filter] as const : ['admin', 'logs'] as const,
    

    
    users: (turma?: string) => 
      turma ? ['admin', 'users', turma] as const : ['admin', 'users'] as const,
  },

  // 🌐 PUBLIC DOMAIN
  public: {
    config: ['public', 'config'] as const,
    classrooms: ['public', 'classrooms'] as const, // ✨ NOVO
    stats: ['public', 'stats'] as const,
  },

  // 🏠 SYSTEM DOMAIN (Alias para compatibilidade)
  system: {
    config: ['system', 'config'] as const,
  },
} as const;