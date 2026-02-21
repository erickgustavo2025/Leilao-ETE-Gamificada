import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Save, X, Trophy, Users, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { api } from '../../api/axios-config';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageHelper';
import { useGameSound } from '../../hooks/useGameSound';
import { PageTransition } from '../../components/layout/PageTransition';

// 🔥 IMPORTAÇÃO DA SUA CENTRAL DE KEYS
import { queryKeys } from '../../utils/queryKeys';

interface Classroom {
    _id: string;
    nome: string;
    serie: string;
    logo: string;
    cor: string;
    pontuacao: number;
    descricao?: string;
    alunosCount?: number;
}

interface Student {
    _id: string;
    nome: string;
    matricula: string;
    saldoPc: number;
    turma: string;
}

export function AdminClasses() {
    const { playSuccess, playError } = useGameSound();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🎯 GESTÃO DE ESTADOS (Movido para o topo para respeitar as Rules of Hooks)
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [pointsAmount, setPointsAmount] = useState('');

    // ✅ GET Classrooms (Usando a sua queryKey centralizada)
    const { data: classrooms = [], isLoading } = useQuery<Classroom[]>({
        queryKey: queryKeys.admin.classes,
        queryFn: async () => {
            const res = await api.get('/classrooms');
            return res.data;
        }
    });

    // ✅ CREATE Mutation
    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            await api.post('/classrooms', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            playSuccess();
            toast.success("Sala Criada!");
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes });
        },
        onError: () => {
            playError();
            toast.error("Erro ao criar sala.");
        }
    });

    // ✅ UPDATE Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
            await api.put(`/classrooms/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            playSuccess();
            toast.success("Sala Atualizada!");
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes });
        },
        onError: () => {
            playError();
            toast.error("Erro ao atualizar sala.");
        }
    });

    // ✅ DELETE Mutation (Optimistic)
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/classrooms/${id}`);
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes });
            const previous = queryClient.getQueryData<Classroom[]>(queryKeys.admin.classes);
            
            queryClient.setQueryData<Classroom[]>(
                queryKeys.admin.classes,
                (old) => old?.filter(c => c._id !== id) || []
            );

            return { previous };
        },
        // 🔥 CORREÇÃO DO TYPESCRIPT: tipando o context como 'any' para evitar o erro do 'unknown'
      onError: (_err: any, _id: string, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.admin.classes, context.previous);
            }
            playError();
            toast.error("Erro ao deletar sala.");
        },

        onSuccess: () => {
            toast.success("Sala Removida.");
        }
    });

    // 📝 Submit Handler
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const editingId = formData.get('editingId') as string;

        if (!formData.get('nome') || !formData.get('serie')) {
            return toast.error("Preencha Nome e Série!");
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, formData });
        } else {
            createMutation.mutate(formData);
        }

        e.currentTarget.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza? Isso apaga a sala (mas não os alunos).")) return;
        deleteMutation.mutate(id);
    };

    const handleEdit = (classroom: Classroom) => {
        const form = document.getElementById('class-form') as HTMLFormElement;
        if (!form) return;

        (form.elements.namedItem('editingId') as HTMLInputElement).value = classroom._id;
        (form.elements.namedItem('nome') as HTMLInputElement).value = classroom.nome;
        (form.elements.namedItem('serie') as HTMLInputElement).value = classroom.serie;
        (form.elements.namedItem('cor') as HTMLInputElement).value = classroom.cor;
        (form.elements.namedItem('pontuacao') as HTMLInputElement).value = classroom.pontuacao.toString();
        (form.elements.namedItem('descricao') as HTMLTextAreaElement).value = classroom.descricao || '';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 🎯 GET ALUNOS DA SALA (Condicional)
    const { data: students = [], isLoading: loadingStudents } = useQuery<Student[]>({
        queryKey: ['admin', 'students', selectedClassroom?.serie],
        queryFn: async () => {
            if (!selectedClassroom) return [];
            const res = await api.get('/users');
            return res.data.filter((u: Student) => u.turma === selectedClassroom.serie);
        },
        enabled: !!selectedClassroom
    });

    // ✅ BULK POINTS Mutation
    const bulkPointsMutation = useMutation({
        mutationFn: async ({ studentIds, amount, action }: { studentIds: string[]; amount: number; action: 'add' | 'remove' }) => {
            await api.put('/users/points/bulk', {
                studentIds,
                amount,
                action,
                description: `${action === 'remove' ? 'Multa' : 'Prêmio'} da Sala (Admin)`
            });
        },
      onSuccess: (_data: any, { amount, action }) => {
            playSuccess();
            toast.success(action === 'remove' ? "Multa Aplicada!" : "Pontos Enviados!", {
                description: `${amount} PC$ para ${selectedStudents.length} alunos.`
            });
            // Invalida a lista de alunos da turma atual E a lista de turmas
            queryClient.invalidateQueries({ queryKey: ['admin', 'students', selectedClassroom?.serie] });
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes });
        },
        onError: () => {
            playError();
            toast.error("Erro ao processar pontos.");
        }
    });

    const handleGivePoints = (isRemoval: boolean = false) => {
        const amount = parseInt(pointsAmount);
        if (!amount || amount <= 0) return toast.warning("Digite um valor válido.");
        if (selectedStudents.length === 0) return toast.warning("Selecione pelo menos um aluno.");

        if (!confirm(`Confirma ${isRemoval ? 'REMOVER' : 'DAR'} ${amount} PC$ para ${selectedStudents.length} alunos?`)) return;

        bulkPointsMutation.mutate({
            studentIds: selectedStudents,
            amount,
            action: isRemoval ? 'remove' : 'add'
        });
    };

    const toggleSelectStudent = (id: string) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedStudents(prev => 
            prev.length === students.length ? [] : students.map(s => s._id)
        );
    };

    return (
        <AdminLayout>
            <PageTransition>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="font-vt323 text-4xl text-blue-400">GESTÃO DE TURMAS</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* FORMULÁRIO */}
                    <PixelCard className="bg-slate-900 h-fit sticky top-6 border-2 border-blue-500">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-press text-sm flex items-center gap-2 text-white">
                                <Plus size={16} className="text-blue-400"/> NOVA SALA
                            </h2>
                        </div>

                        <form id="class-form" onSubmit={handleSubmit} className="space-y-4">
                            <input type="hidden" name="editingId" />

                            <div className="flex justify-center mb-4">
                                <label className="relative cursor-pointer group">
                                    <div className="w-24 h-24 bg-black border-2 border-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                                        <Upload className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        name="logo"
                                        className="hidden" 
                                        accept="image/*" 
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="text-[10px] font-press text-slate-400">NOME DO TIME</label>
                                <input 
                                    name="nome"
                                    className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-xl outline-none uppercase" 
                                    placeholder="EX: MONARCAS" 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-press text-slate-400">SÉRIE PADRÃO</label>
                                <input 
                                    name="serie"
                                    className="w-full bg-black border border-slate-700 p-2 text-white font-vt323 text-xl outline-none uppercase" 
                                    placeholder="EX: 3A DS" 
                                />
                                <p className="text-[10px] text-slate-500 font-mono mt-1">Use: 1A DS, 2B ADM (Sem bolinha º)</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-press text-slate-400">COR</label>
                                    <div className="flex items-center gap-2 bg-black border border-slate-700 p-1">
                                        <input 
                                            type="color" 
                                            name="cor"
                                            defaultValue="#3b82f6"
                                            className="w-8 h-8 bg-transparent cursor-pointer" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-press text-yellow-500">PONTOS</label>
                                    <input 
                                        type="number" 
                                        name="pontuacao"
                                        defaultValue={0}
                                        className="w-full bg-black border border-yellow-700 text-yellow-400 p-2 font-vt323 text-xl outline-none" 
                                    />
                                </div>
                            </div>

                            <PixelButton 
                                type="submit" 
                                className="w-full bg-blue-600"
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            >
                                <Save size={16}/> SALVAR
                            </PixelButton>
                        </form>
                    </PixelCard>

                    {/* LISTA DE SALAS */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isLoading ? (
                            <div className="col-span-2 text-center py-10 text-slate-500 font-press animate-pulse">CARREGANDO...</div>
                        ) : classrooms.length === 0 ? (
                            <div className="col-span-2 text-center py-10 text-slate-500">Nenhuma sala cadastrada</div>
                        ) : (
                            classrooms.map(room => (
                                <PixelCard 
                                    key={room._id} 
                                    className="flex flex-col p-4 border-l-4 relative group hover:bg-slate-800 transition-colors" 
                                    style={{ borderLeftColor: room.cor }}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-black border-2 border-slate-700 rounded-full flex-shrink-0 overflow-hidden relative shadow-lg">
                                            <img 
                                                src={getImageUrl(room.logo)} 
                                                alt={room.nome} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => (e.target as HTMLImageElement).src = '/assets/etegamificada.png'}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-vt323 text-3xl text-white leading-none mb-1">{room.nome}</h3>
                                            <p className="font-press text-[10px] text-slate-400 uppercase tracking-wider">{room.serie}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-between items-center">
                                        <span className="text-yellow-400 font-vt323 text-xl flex items-center gap-1">
                                            <Trophy size={16} /> {room.pontuacao}
                                        </span>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setSelectedClassroom(room)} 
                                                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded flex items-center gap-1 text-[10px] font-press"
                                            >
                                                <Users size={14} /> ALUNOS
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(room)} 
                                                className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 p-2 rounded"
                                            >
                                                <Pencil size={14}/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(room._id)} 
                                                className="bg-red-900/50 hover:bg-red-800 text-red-300 p-2 rounded"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                </PixelCard>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL DE GESTÃO DE ALUNOS */}
                {selectedClassroom && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <PixelCard className="w-full max-w-2xl bg-slate-900 border-2 border-slate-500 max-h-[90vh] flex flex-col">
                            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                                <div>
                                    <h2 className="font-vt323 text-3xl text-white">ALUNOS: {selectedClassroom.serie}</h2>
                                    <p className="font-mono text-xs text-slate-400">{students.length} alunos encontrados</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSelectedClassroom(null);
                                        setSelectedStudents([]);
                                        setPointsAmount('');
                                    }} 
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={24}/>
                                </button>
                            </div>

                            {/* Controles de Massa */}
                            <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex flex-wrap gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-press text-slate-400 block mb-1">VALOR (PC$)</label>
                                    <input 
                                        type="number" 
                                        value={pointsAmount} 
                                        onChange={e => setPointsAmount(e.target.value)} 
                                        className="w-full bg-black border border-slate-600 p-2 text-white font-vt323 text-xl" 
                                        placeholder="0" 
                                    />
                                </div>
                                <PixelButton 
                                    onClick={() => handleGivePoints(false)} 
                                    className="bg-green-600 hover:bg-green-500 text-xs py-3" 
                                    disabled={selectedStudents.length === 0 || bulkPointsMutation.isPending}
                                >
                                    + DAR PONTOS
                                </PixelButton>
                                <PixelButton 
                                    onClick={() => handleGivePoints(true)} 
                                    className="bg-red-600 hover:bg-red-500 text-xs py-3" 
                                    disabled={selectedStudents.length === 0 || bulkPointsMutation.isPending}
                                >
                                    - MULTAR
                                </PixelButton>
                            </div>

                            {/* Lista de Alunos */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                                    <button 
                                        onClick={toggleSelectAll} 
                                        className="flex items-center gap-2 text-slate-400 hover:text-white font-press text-[10px]"
                                    >
                                        {selectedStudents.length === students.length && students.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}
                                        SELECIONAR TODOS ({selectedStudents.length})
                                    </button>
                                </div>

                                {loadingStudents ? (
                                    <p className="text-center text-slate-500 py-10 font-vt323 text-xl">CARREGANDO ALUNOS...</p>
                                ) : students.length === 0 ? (
                                    <p className="text-center text-slate-500 py-10 font-vt323 text-xl">NENHUM ALUNO NESSA TURMA</p>
                                ) : (
                                    students.map(student => (
                                        <div 
                                            key={student._id} 
                                            onClick={() => toggleSelectStudent(student._id)} 
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded border cursor-pointer transition-all",
                                                selectedStudents.includes(student._id) 
                                                    ? "bg-blue-900/30 border-blue-500" 
                                                    : "bg-slate-800 border-slate-700 hover:border-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {selectedStudents.includes(student._id) ? (
                                                    <CheckSquare className="text-blue-400" size={20}/>
                                                ) : (
                                                    <Square className="text-slate-600" size={20}/>
                                                )}
                                                <div>
                                                    <p className="font-vt323 text-xl text-white leading-none">{student.nome}</p>
                                                    <p className="font-mono text-[10px] text-slate-500">{student.matricula}</p>
                                                </div>
                                            </div>
                                            <span className="font-vt323 text-xl text-yellow-400">{student.saldoPc} PC$</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PixelCard>
                    </div>
                )}
            </PageTransition>
        </AdminLayout>
    );
}