// frontend/src/pages/admin/AdminUsers.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Lock, Unlock, Pencil, Trash2, UserCog, Shield, X,
  Crown, Zap, BookOpen, Music, Users as UsersIcon, Dumbbell, ChevronDown, Eye, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';

const SPECIAL_ROLES = [
  { id: 'estudanteHonorario', label: 'Estudante Honorário', icon: Crown, color: 'text-yellow-500' },
  { id: 'monitorDisciplina', label: 'Monitor de Disciplina', icon: Shield, color: 'text-blue-500' },
  { id: 'monitorEscola', label: 'Monitor da Escola', icon: Zap, color: 'text-purple-500' },
  { id: 'armadaDumbledore', label: 'Armada de Dumbledore', icon: Shield, color: 'text-red-500' },
  { id: 'monitorBiblioteca', label: 'Monitor da Biblioteca', icon: BookOpen, color: 'text-green-500' },
  { id: 'monitorQuadra', label: 'Monitor da Quadra', icon: Dumbbell, color: 'text-orange-500' },
  { id: 'integranteBanda', label: 'Integrante da Banda', icon: Music, color: 'text-pink-500' },
  { id: 'representanteSala', label: 'Representante de Sala', icon: UsersIcon, color: 'text-cyan-500' },
  { id: 'colaborador', label: 'Colaborador', icon: Crown, color: 'text-indigo-500' },
];

interface User {
  _id: string;
  nome: string;
  matricula: string;
  turma: string;
  saldoPc: number;
  rank: string;
  role: 'student' | 'monitor' | 'admin' | 'dev'; // necessário pro guard do impersonate
  isBlocked: boolean;
  avatar?: string;
  cargosEspeciais?: string[];
}

export function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isImpersonating, impersonate } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: queryKeys.admin.users(),
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    }
  });

  const { data: classes = [] } = useQuery<string[]>({
    queryKey: ['admin', 'classes-turmas-list'],
    queryFn: async () => {
      const res = await api.get('/classrooms');
      return res.data.map((c: any) => c.serie || c.turma);
    }
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.matricula.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTurma = !selectedTurma || user.turma === selectedTurma;
      return matchesSearch && matchesTurma;
    });
  }, [users, searchTerm, selectedTurma]);

  // ── Mutations ─────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      await api.put(`/users/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users() });
      const previous = queryClient.getQueryData<User[]>(queryKeys.admin.users());
      queryClient.setQueryData<User[]>(
        queryKeys.admin.users(),
        (old) => old?.map(user => user._id === id ? { ...user, ...data } : user) || []
      );
      return { previous };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.admin.users(), context.previous);
      toast.error("Erro ao atualizar usuário.");
    },
    onSuccess: () => {
      toast.success("Usuário atualizado!");
      setEditingUser(null);
    }
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, block }: { id: string; block: boolean }) => {
      await api.put(`/users/${id}/block`, { block });
    },
    onMutate: async ({ id, block }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users() });
      const previous = queryClient.getQueryData<User[]>(queryKeys.admin.users());
      queryClient.setQueryData<User[]>(
        queryKeys.admin.users(),
        (old) => old?.map(user => user._id === id ? { ...user, isBlocked: block } : user) || []
      );
      return { previous };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.admin.users(), context.previous);
      toast.error("Erro ao bloquear/desbloquear.");
    },
    onSuccess: (_data: any, { block }) => {
      toast.success(block ? "Usuário bloqueado." : "Usuário desbloqueado.");
    }
  });

  const resetAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/student/${id}`);
    },
    onSuccess: () => {
      toast.success("Acesso resetado! O aluno voltou para o Primeiro Acesso.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
    onError: () => {
      toast.error("Erro ao resetar acesso do aluno.");
    }
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: string[] }) => {
      await api.put(`/users/${id}/special-roles`, { cargosEspeciais: roles });
    },
    onMutate: async ({ id, roles }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users() });
      const previous = queryClient.getQueryData<User[]>(queryKeys.admin.users());
      queryClient.setQueryData<User[]>(
        queryKeys.admin.users(),
        (old) => old?.map(user => user._id === id ? { ...user, cargosEspeciais: roles } : user) || []
      );
      return { previous };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.admin.users(), context.previous);
      toast.error("Erro ao atualizar cargos.");
    },
    onSuccess: () => {
      toast.success("Cargos atualizados!");
      setShowRolesModal(false);
      setSelectedUserRoles(null);
    }
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post('/dev/impersonate', { userId });
      return data;
    },
    onSuccess: (data) => {
      impersonate(data.token, data.user);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao iniciar impersonate');
    }
  });

  // ── Handlers ──────────────────────────────────────────────

  const handleEditProfile = (user: User) => setEditingUser(user);

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingUser._id,
      data: {
        nome: formData.get('nome') as string,
        matricula: formData.get('matricula') as string,
        turma: formData.get('turma') as string,
      }
    });
  };

  const handleToggleBlock = (user: User) => {
    if (!confirm(`${user.isBlocked ? 'Desbloquear' : 'Bloquear'} ${user.nome}?`)) return;
    toggleBlockMutation.mutate({ id: user._id, block: !user.isBlocked });
  };

  const handleResetAccess = (user: User) => {
    if (!confirm(`Resetar acesso de ${user.nome}? O aluno precisará fazer login novamente.`)) return;
    resetAccessMutation.mutate(user._id);
  };

  const handleOpenRoles = (user: User) => {
    setSelectedUserRoles(user);
    setShowRolesModal(true);
  };

  const handleToggleRole = (roleId: string) => {
    if (!selectedUserRoles) return;
    const currentRoles = selectedUserRoles.cargosEspeciais || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(r => r !== roleId)
      : [...currentRoles, roleId];
    setSelectedUserRoles({ ...selectedUserRoles, cargosEspeciais: newRoles });
  };

  const handleSaveRoles = () => {
    if (!selectedUserRoles) return;
    updateRolesMutation.mutate({
      id: selectedUserRoles._id,
      roles: selectedUserRoles.cargosEspeciais || []
    });
  };

  const handleImpersonate = (user: User) => {
    if (isImpersonating) {
      toast.error("Saia do impersonate atual antes de iniciar outro.");
      return;
    }
    impersonateMutation.mutate(user._id);
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <AdminLayout>
      <PageTransition>
        {/* ═══ HEADER + FILTROS ═══ */}
        <div className="mb-6 space-y-4">
          <div>
            <h1 className="font-vt323 text-3xl md:text-4xl text-green-400 uppercase">
              GESTÃO DE ALUNOS
            </h1>
            <p className="font-vt323 text-base md:text-lg text-slate-500">
              {users.length} alunos cadastrados
              {filteredUsers.length !== users.length && (
                <span className="text-green-600"> · {filteredUsers.length} exibidos</span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar nome ou matrícula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 font-mono text-sm focus:border-green-500 outline-none text-white placeholder:text-slate-600"
              />
            </div>

            <div className="relative sm:w-52">
              <select
                value={selectedTurma}
                onChange={e => setSelectedTurma(e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-4 pr-10 font-vt323 text-lg focus:border-green-500 outline-none text-white cursor-pointer"
              >
                <option value="">TODAS AS TURMAS</option>
                {classes.map(turma => (
                  <option key={turma} value={turma}>{turma}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* ═══ LISTA ═══ */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 font-press animate-pulse text-sm">
            CARREGANDO ALUNOS...
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-vt323 text-xl border-2 border-dashed border-slate-800 rounded-lg">
                NENHUM ALUNO ENCONTRADO
              </div>
            ) : (
              <AnimatePresence>
                {filteredUsers.map((user, idx) => {
                  const canImpersonateThis = ['student', 'monitor'].includes(user.role);
                  const isPending = impersonateMutation.isPending && impersonateMutation.variables === user._id;

                  return (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <PixelCard
                        className={cn(
                          '!p-0 overflow-hidden border-l-4 transition-all',
                          user.isBlocked
                            ? 'border-l-red-500 bg-red-950/40'
                            : 'border-l-green-500 bg-slate-900'
                        )}
                      >
                        {/* ── Conteúdo principal ── */}
                        <div className="flex items-start gap-3 p-3 md:p-4 md:items-center">
                          {/* Avatar */}
                          <div
                            className={cn(
                              'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-vt323 text-xl md:text-2xl flex-shrink-0 shadow-lg',
                              user.isBlocked
                                ? 'bg-red-900/80'
                                : 'bg-gradient-to-br from-green-600 to-blue-600'
                            )}
                          >
                            {user.nome.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-vt323 text-xl md:text-2xl text-white truncate leading-tight">
                                {user.nome}
                              </h3>
                              {/* Tag de monitor inline com o nome */}
                              {user.role === 'monitor' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-press border border-cyan-700/60 text-cyan-400 bg-cyan-900/20 flex-shrink-0">
                                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                                  MONITOR
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-400">{user.matricula}</span>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <span className="font-vt323 text-sm text-green-400">{user.turma}</span>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <span className="font-vt323 text-sm text-yellow-400">{user.saldoPc} PC$</span>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <span className="font-press text-[9px] text-purple-400 uppercase">{user.rank}</span>
                            </div>

                            {/* Badges de cargos */}
                            {user.cargosEspeciais && user.cargosEspeciais.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {user.cargosEspeciais.map(roleId => {
                                  const role = SPECIAL_ROLES.find(r => r.id === roleId);
                                  if (!role) return null;
                                  const Icon = role.icon;
                                  return (
                                    <span
                                      key={roleId}
                                      className={cn(
                                        'text-[8px] font-press px-1.5 py-0.5 rounded border flex items-center gap-1',
                                        role.color,
                                        'bg-slate-950 border-slate-800'
                                      )}
                                    >
                                      <Icon size={9} /> {role.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* ── Desktop: botões inline ── */}
                          <div className="hidden md:flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleOpenRoles(user)}
                              className="p-2 bg-slate-800 text-purple-400 hover:bg-purple-500/20 rounded border border-slate-700 transition-colors"
                              title="Cargos Especiais"
                            >
                              <UserCog size={18} />
                            </button>
                            <button
                              onClick={() => handleEditProfile(user)}
                              className="p-2 bg-slate-800 text-blue-400 hover:bg-blue-500/20 rounded border border-slate-700 transition-colors"
                              title="Editar Perfil"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(user)}
                              className={cn(
                                'p-2 rounded border transition-colors',
                                user.isBlocked
                                  ? 'bg-green-900/30 text-green-400 hover:bg-green-500/20 border-green-700'
                                  : 'bg-red-900/30 text-red-400 hover:bg-red-500/20 border-red-700'
                              )}
                              title={user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            >
                              {user.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                            </button>
                            <button
                              onClick={() => handleResetAccess(user)}
                              className="p-2 bg-slate-800 text-orange-400 hover:bg-orange-500/20 rounded border border-slate-700 transition-colors"
                              title="Resetar Acesso"
                            >
                              <Trash2 size={18} />
                            </button>
                            {canImpersonateThis && (
                              <button
                                onClick={() => handleImpersonate(user)}
                                disabled={isPending || isImpersonating}
                                className={cn(
                                  'p-2 rounded border transition-colors',
                                  isImpersonating
                                    ? 'bg-slate-800/30 text-slate-700 border-slate-800 cursor-not-allowed'
                                    : 'bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 border-slate-700'
                                )}
                                title={isImpersonating ? 'Já em modo impersonate' : `Visualizar como ${user.nome}`}
                              >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ── Mobile: toolbar de ações na base do card ── */}
                        <div className={cn(
                          "md:hidden border-t border-slate-800/80",
                          canImpersonateThis ? "grid grid-cols-5" : "grid grid-cols-4"
                        )}>
                          <button
                            onClick={() => handleOpenRoles(user)}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-purple-400 active:bg-purple-500/10 transition-colors"
                          >
                            <UserCog size={15} />
                            <span className="font-press text-[7px] leading-none">CARGOS</span>
                          </button>
                          <button
                            onClick={() => handleEditProfile(user)}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-blue-400 active:bg-blue-500/10 transition-colors border-l border-slate-800/80"
                          >
                            <Pencil size={15} />
                            <span className="font-press text-[7px] leading-none">EDITAR</span>
                          </button>
                          <button
                            onClick={() => handleToggleBlock(user)}
                            className={cn(
                              'flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors border-l border-slate-800/80',
                              user.isBlocked ? 'text-green-400 active:bg-green-500/10' : 'text-red-400 active:bg-red-500/10'
                            )}
                          >
                            {user.isBlocked ? <Unlock size={15} /> : <Lock size={15} />}
                            <span className="font-press text-[7px] leading-none">
                              {user.isBlocked ? 'LIBERAR' : 'BLOQUEAR'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleResetAccess(user)}
                            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-orange-400 active:bg-orange-500/10 transition-colors border-l border-slate-800/80"
                          >
                            <Trash2 size={15} />
                            <span className="font-press text-[7px] leading-none">RESETAR</span>
                          </button>
                          {canImpersonateThis && (
                            <button
                              onClick={() => handleImpersonate(user)}
                              disabled={isPending || isImpersonating}
                              className={cn(
                                'flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors border-l border-slate-800/80',
                                isImpersonating
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : 'text-cyan-400 active:bg-cyan-500/10'
                              )}
                            >
                              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                              <span className="font-press text-[7px] leading-none">VER COMO</span>
                            </button>
                          )}
                        </div>
                      </PixelCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* ═══ MODAL: EDIÇÃO DE PERFIL ═══ */}
        <AnimatePresence>
          {editingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            >
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                onClick={e => e.stopPropagation()}
                className="w-full sm:max-w-md"
              >
                <PixelCard className="bg-slate-900 border-2 border-blue-500 rounded-b-none sm:rounded-b-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-vt323 text-2xl md:text-3xl text-white">EDITAR PERFIL</h2>
                    <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white p-1">
                      <X size={22} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-press text-slate-400 block mb-1">NOME COMPLETO</label>
                      <input
                        name="nome"
                        defaultValue={editingUser.nome}
                        className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white font-vt323 text-xl focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-press text-slate-400 block mb-1">MATRÍCULA</label>
                      <input
                        name="matricula"
                        defaultValue={editingUser.matricula}
                        className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white font-vt323 text-xl focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-press text-slate-400 block mb-1">TURMA</label>
                      <select
                        name="turma"
                        defaultValue={editingUser.turma}
                        className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white font-vt323 text-xl focus:border-blue-500 outline-none"
                      >
                        {classes.map(turma => (
                          <option key={turma} value={turma}>{turma}</option>
                        ))}
                      </select>
                    </div>
                    <PixelButton type="submit" className="w-full bg-blue-600 hover:bg-blue-500" isLoading={updateMutation.isPending}>
                      SALVAR ALTERAÇÕES
                    </PixelButton>
                  </form>
                </PixelCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ MODAL: CARGOS ESPECIAIS ═══ */}
        <AnimatePresence>
          {showRolesModal && selectedUserRoles && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => { setShowRolesModal(false); setSelectedUserRoles(null); }}
            >
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                onClick={e => e.stopPropagation()}
                className="w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
              >
                <PixelCard className="bg-slate-900 border-2 border-purple-500 rounded-b-none sm:rounded-b-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-vt323 text-2xl md:text-3xl text-white">CARGOS ESPECIAIS</h2>
                      <p className="font-mono text-xs text-slate-400 truncate">{selectedUserRoles.nome}</p>
                    </div>
                    <button
                      onClick={() => { setShowRolesModal(false); setSelectedUserRoles(null); }}
                      className="text-slate-400 hover:text-white p-1 flex-shrink-0"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {SPECIAL_ROLES.map(role => {
                      const Icon = role.icon;
                      const isActive = selectedUserRoles.cargosEspeciais?.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role.id)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left active:scale-[0.98]',
                            isActive ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-950 border-slate-700 hover:border-slate-500'
                          )}
                        >
                          <Icon className={cn(role.color, 'flex-shrink-0')} size={22} />
                          <p className={cn('font-press text-[10px] md:text-xs flex-1 min-w-0', isActive ? 'text-white' : 'text-slate-400')}>
                            {role.label}
                          </p>
                          <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0', isActive ? 'bg-purple-600 border-purple-400' : 'border-slate-600')}>
                            {isActive && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <PixelButton onClick={handleSaveRoles} className="w-full bg-purple-600 hover:bg-purple-500" isLoading={updateRolesMutation.isPending}>
                    SALVAR CARGOS
                  </PixelButton>
                </PixelCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </AdminLayout>
  );
}
