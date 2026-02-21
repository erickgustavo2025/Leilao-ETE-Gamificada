import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { UserPlus, Search, Shield, GraduationCap, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PixelButton } from '../../components/ui/PixelButton';
import { cn } from '../../utils/cn';

export function DevUsers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [search, setSearch] = useState('');

  // Form State (mantido)
  const [formData, setFormData] = useState({
    nome: '', matricula: '', dataNascimento: '', turma: '', role: 'student'
  });

  // ==================== QUERIES ====================
  
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['devUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      
      // 🛡️ BLINDAGEM CRÍTICA MANTIDA
      if (Array.isArray(data)) return data;
      if (data.users && Array.isArray(data.users)) return data.users;
      console.warn("Formato de resposta inesperado:", data);
      return [];
    },
    enabled: activeTab === 'list', // Só busca quando na aba list
    staleTime: 3 * 60 * 1000,
  });

  // ==================== MUTATIONS ====================
  
  const createUserMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      return await api.post('/users/manual', payload);
    },
    onSuccess: (response) => {
      toast.success(`Usuário criado! Senha inicial: ${response.data.initialPassword}`);
      setFormData({ nome: '', matricula: '', dataNascimento: '', turma: '', role: 'student' });
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['devUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar');
    }
  });

  // ==================== HANDLERS ====================

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  // ==================== DERIVAÇÕES ====================
  
  // 🛡️ FILTRO BLINDADO (mantido)
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter(u => 
    (u.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.matricula || '').includes(search)
  );

  return (
    <div className="p-6 md:p-10 space-y-8 bg-black/90 min-h-full text-green-500 font-mono">
      
      {/* Header e Tabs */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-green-900 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-vt323 text-green-400">USER_DATABASE</h1>
          <p className="text-xs text-green-700">GERENCIAMENTO DE ENTIDADES</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('list')}
                className={cn("px-4 py-2 text-xs border transition-all", activeTab === 'list' ? "bg-green-500 text-black border-green-500 font-bold" : "border-green-900 hover:border-green-500")}
            >
                LIST_VIEW
            </button>
            <button 
                onClick={() => setActiveTab('create')}
                className={cn("px-4 py-2 text-xs border transition-all flex items-center gap-2", activeTab === 'create' ? "bg-green-500 text-black border-green-500 font-bold" : "border-green-900 hover:border-green-500")}
            >
                <UserPlus size={14} /> NEW_USER
            </button>
        </div>
      </header>

      {/* ABA LISTA */}
      {activeTab === 'list' && (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou matrícula..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black border border-green-900 p-3 pl-10 text-green-400 focus:outline-none focus:border-green-500 font-mono text-sm"
                    />
                </div>
                <button onClick={() => refetch()} className="bg-green-900/20 border border-green-900 px-4 hover:bg-green-900/40 text-green-500">
                    <RefreshCw size={18} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
                    <p className="animate-pulse">LOADING DATA...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 text-green-900">NENHUM USUÁRIO ENCONTRADO</div>
            ) : (
                <div className="grid gap-2 h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {filteredUsers.map(user => (
                        <div key={user._id} className="bg-black/50 border border-green-900/50 p-3 flex justify-between items-center hover:border-green-500 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded", user.role === 'admin' ? "bg-red-900/20 text-red-500" : "bg-green-900/20 text-green-500")}>
                                    {user.role === 'admin' ? <Shield size={16}/> : <GraduationCap size={16}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-green-400">{user.nome}</p>
                                    <p className="text-[10px] text-green-700 font-mono">MAT: {user.matricula} | TURMA: {user.turma}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-green-600">PC$: {user.saldoPc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* ABA CRIAR */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="max-w-2xl mx-auto space-y-6 border border-green-900 p-8 bg-black relative">
            <div className="absolute top-0 left-0 bg-green-500 text-black text-[10px] font-bold px-2 py-1">MODE: INSERT</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs text-green-700">NOME COMPLETO</label>
                    <input 
                        required
                        value={formData.nome}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                        className="w-full bg-black border border-green-800 p-2 text-green-400 focus:border-green-500 outline-none uppercase"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-green-700">MATRÍCULA</label>
                    <input 
                        required
                        value={formData.matricula}
                        onChange={e => setFormData({...formData, matricula: e.target.value})}
                        className="w-full bg-black border border-green-800 p-2 text-green-400 focus:border-green-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-green-700">DATA NASCIMENTO</label>
                    <input 
                        required
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={formData.dataNascimento}
                        onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
                        className="w-full bg-black border border-green-800 p-2 text-green-400 focus:border-green-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-green-700">TURMA</label>
                    <select 
                        required
                        value={formData.turma}
                        onChange={e => setFormData({...formData, turma: e.target.value})}
                        className="w-full bg-black border border-green-800 p-2 text-green-400 focus:border-green-500 outline-none"
                    >
                        <option value="">SELECIONE...</option>
                        <option value="1A ADM">1A ADM</option>
                        <option value="1B ADM">1B ADM</option>
                        <option value="2A ADM">2A ADM</option>
                        <option value="2B ADM">2B ADM</option>
                        <option value="3A ADM">3A ADM</option>
                        <option value="3B ADM">3B ADM</option>
                        <option value="1A DS">1A DS</option>
                        <option value="1B DS">1B DS</option>
                        <option value="2A DS">2A DS</option>
                        <option value="2B DS">2B DS</option>
                        <option value="3A DS">3A DS</option>
                        <option value="3B DS">3B DS</option>
                        <option value="DEV TEAM">DEV TEAM (TESTE)</option>
                    </select>
                </div>
            </div>

            <div className="pt-6 border-t border-green-900/50 flex justify-end">
                <PixelButton type="submit" variant="success" className="w-full md:w-auto" isLoading={createUserMutation.isPending}>
                    <Save size={16} className="mr-2" />
                    CADASTRAR NO SISTEMA
                </PixelButton>
            </div>
        </form>
      )}

    </div>
  );
}