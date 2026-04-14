import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, Lock, Unlock, Pencil, UserCog, X,
  Eye, Loader2, UserPlus, RefreshCcw, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext'; 
import { cn } from '../../utils/cn';
import { PageTransition } from '../../components/layout/PageTransition';
import { queryKeys } from '../../utils/queryKeys';
import { EditUserModal } from './components/EditUserModal';
import { UserRolesModal } from './components/UserRolesModal';
import { User } from './types';

// ── Componente de Linha de Usuário (Refatorado para Pixel Style) ──
const UserRow: React.FC<{ 
  user: User; 
  onBlock: (id: string, currentStatus: boolean) => void;
  onEdit: (user: User) => void;
  onShowRoles: (user: User) => void;
  onReset: (id: string) => void;
  onImpersonate: (id: string) => void;
  isImpersonating: boolean;
  impersonatePendingId: string | null;
}> = ({ user, onBlock, onEdit, onShowRoles, onReset, onImpersonate, isImpersonating, impersonatePendingId }) => {
  if (!user) return null;

  const canImpersonateThis = ['student', 'monitor'].includes(user.role);
  const isPending = impersonatePendingId === user._id;

  return (
    <div className="pb-3 px-2">
      <PixelCard
        className={cn(
          '!p-0 overflow-hidden border-l-4 transition-all',
          user.isBlocked
            ? 'border-l-red-500 bg-red-950/20'
            : 'border-l-green-500 bg-slate-900/40 hover:bg-slate-900/60'
        )}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4">
          <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
            {/* Avatar Pixel */}
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white font-vt323 text-2xl flex-shrink-0 shadow-lg border-2',
              user.isBlocked ? 'bg-red-900/50 border-red-500/30' : 'bg-slate-800 border-slate-700'
            )}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover rounded-lg" />
              ) : (
                user.nome.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-vt323 text-2xl text-white truncate leading-none">
                  {user.nome}
                </h3>
                {user.role === 'monitor' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-press bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <ShieldCheck size={10} /> MONITOR
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-slate-500">
                <span className="text-slate-300">#{user.matricula}</span>
                <span className="text-green-500/70">{user.turma}</span>
                <span className="text-yellow-500">{user.saldoPc} PC$</span>
                <span className="text-purple-400 uppercase tracking-tighter font-press text-[8px]">{user.rank}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
            <button onClick={() => onEdit(user)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Editar">
              <Pencil size={18} />
            </button>
            <button onClick={() => onShowRoles(user)} className="p-2 text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 rounded-lg transition-all" title="Cargos">
              <UserCog size={18} />
            </button>
            <button 
                onClick={() => onBlock(user._id, user.isBlocked)} 
                className={cn('p-2 rounded-lg transition-all', user.isBlocked ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10')}
                title={user.isBlocked ? 'Desbloquear' : 'Bloquear'}
            >
              {user.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
            <button onClick={() => onReset(user._id)} className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Resetar Acesso">
              <X size={18} />
            </button>

            <div className="w-px h-6 bg-white/5 mx-1 hidden md:block" />

            <PixelButton
                variant="primary"
                className="!py-1.5 !px-3 font-press text-[7px]"
                onClick={() => onImpersonate(user._id)}
                disabled={!canImpersonateThis || isImpersonating || isPending}
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} className="mr-2" />}
              {isPending ? 'ACESSANDO...' : 'LOGAR COMO'}
            </PixelButton>
          </div>
        </div>
      </PixelCard>
    </div>
  );
};

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isImpersonating, impersonate } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState<User | null>(null);

  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: queryKeys.admin.users(),
    queryFn: async () => {
      const res = await api.get('/admin'); // Rota index do adminController
      return res.data;
    }
  });

  const { data: classes = [] } = useQuery<string[]>({
    queryKey: ['admin', 'classes-turmas-list'],
    queryFn: async () => {
      const res = await api.get('/classrooms');
      return res.data.map((c: any) => c.serie || c.turma).filter(Boolean);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      await api.put('/users/profile', { id, ...data });
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      setEditingUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao atualizar")
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, block }: { id: string; block: boolean }) => {
      await api.put('/users/block', { studentId: id, block });
    },
    onSuccess: (_, variables) => {
      toast.success(variables.block ? "Usuário bloqueado." : "Usuário desbloqueado.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    }
  });

  const resetAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/student/${id}`);
    },
    onSuccess: () => {
      toast.success("Cadastro resetado! O aluno pode fazer o Primeiro Acesso novamente.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    }
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: string[] }) => {
      await api.put(`/users/${id}/special-roles`, { cargosEspeciais: roles });
    },
    onSuccess: () => {
      toast.success("Cargos salvos com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      setShowRolesModal(false);
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
      toast.success(`Logado como ${data.user.nome}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao impersonar")
  });

  return (
    <AdminLayout>
      <PageTransition>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserPlus size={18} className="text-green-400" />
                <span className="font-press text-[9px] text-green-400 uppercase tracking-widest">Controle de Habitantes</span>
              </div>
              <h1 className="font-vt323 text-4xl text-white uppercase leading-none">Gestão de Alunos</h1>
              <p className="font-vt323 text-lg text-slate-500 mt-1">
                Monitorando {users.length} usuários na rede gamificada
              </p>
            </div>
            
            <div className="flex gap-2">
                <PixelButton variant="secondary" onClick={() => refetch()} className="!px-4">
                    <RefreshCcw size={16} className={cn("mr-2", isLoading && "animate-spin")} />
                    ATUALIZAR
                </PixelButton>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-12 pr-4 font-vt323 text-xl text-white outline-none focus:border-green-500/50 transition-all"
                />
              </div>
              <select
                value={selectedTurma}
                onChange={e => setSelectedTurma(e.target.value)}
                className="bg-black/40 border border-slate-700 rounded-xl py-3 px-6 font-vt323 text-xl text-white outline-none cursor-pointer hover:border-slate-600 transition-all"
              >
                <option value="">TODAS AS TURMAS</option>
                {classes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="overflow-y-auto pr-1 min-h-[400px] max-h-[calc(100vh-400px)] custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={40} className="text-green-500 animate-spin" />
                  <p className="font-press text-[10px] text-slate-600 uppercase">Processando base de dados...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                  <X size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                  <p className="font-vt323 text-2xl text-slate-700 uppercase">Nenhum rastro encontrado na rede.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onBlock={(id, current) => { if (confirm(current ? 'Desbloquear habitante?' : 'Bloquear acesso ao sistema?')) toggleBlockMutation.mutate({ id, block: !current }); }}
                      onEdit={setEditingUser}
                      onShowRoles={(u) => { setSelectedUserRoles(u); setShowRolesModal(true); }}
                      onReset={(id) => { if (confirm('ATENÇÃO: Redefinir cadastro apagará a senha e o e-mail atual do aluno. Prosseguir?')) resetAccessMutation.mutate(id); }}
                      onImpersonate={(id) => impersonateMutation.mutate(id)}
                      isImpersonating={isImpersonating}
                      impersonatePendingId={impersonateMutation.isPending ? impersonateMutation.variables as string : null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modais de Gerenciamento */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            classes={classes}
            onClose={() => setEditingUser(null)}
            onSave={(id, data) => updateMutation.mutate({ id, data })}
            isLoading={updateMutation.isPending}
          />
        )}

        {showRolesModal && selectedUserRoles && (
          <UserRolesModal
            user={selectedUserRoles}
            onClose={() => setShowRolesModal(false)}
            onSave={(id, roles) => updateRolesMutation.mutate({ id, roles })}
            onToggleRole={(roleId) => {
              const current = selectedUserRoles.cargosEspeciais || [];
              const next = current.includes(roleId) ? current.filter(r => r !== roleId) : [...current, roleId];
              setSelectedUserRoles({ ...selectedUserRoles, cargosEspeciais: next });
            }}
            isLoading={updateRolesMutation.isPending}
          />
        )}
      </PageTransition>
    </AdminLayout>
  );
};

