import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Zap, Activity, BarChart as ChartIcon, 
  Search, ChevronRight, GraduationCap, BookMarked,
  FileSpreadsheet, LayoutDashboard, Plus, Upload, Trash2, FileText, Book
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { toast } from 'sonner';
import { api } from '../../api/axios-config';
import { ProfessorLayout } from '../../components/layout/ProfessorLayout';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { PageTransition } from '../../components/layout/PageTransition';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
    _id: string;
    nome: string;
    matricula: string;
    saldoPc: number;
    xp: number;
    turma: string;
}

interface EngagementData {
    date: string;
    passiveVisits: number;
    activeLogins: number;
}

export function ProfessorDashboard() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'questionarios' | 'materiais' | 'ementa' | 'pesquisa'>('overview');
    const [surveyAnswers, setSurveyAnswers] = useState<number[]>(new Array(4).fill(5));
    const [ementaText, setEmentaText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('CONTEUDO_AULA');
    const [selectedAno, setSelectedAno] = useState('1');
    const [selectedTrimestre, setSelectedTrimestre] = useState('1');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [trainingDifficulty, setTrainingDifficulty] = useState<'FACIL' | 'MEDIO' | 'DIFICIL'>('MEDIO');
    const [numQuestions, setNumQuestions] = useState(5);
    
    const [contextIndex, setContextIndex] = useState(0);
    const vinculoAtivo = authUser?.disciplinas?.[contextIndex];

    // --- BUSCA DE DADOS ---

    // --- MÓDULO RAG (MATERIAIS) ---
    const { data: materials = [], isLoading: loadingMaterials } = useQuery({
        queryKey: ['professor', 'materials', vinculoAtivo?.disciplinaId],
        queryFn: async () => {
            const res = await api.get(`/professor/materials/${vinculoAtivo?.disciplinaId}`);
            return res.data;
        },
        enabled: !!vinculoAtivo && activeTab === 'materiais'
    });

    // --- BUSCA TÓPICOS DA EMENTA (NOVO PJC 2.0) ---
    const { data: ementaTopics = [] } = useQuery({
        queryKey: ['professor', 'topics', vinculoAtivo?.disciplinaId],
        queryFn: async () => {
            const res = await api.get(`/professor/materials/topics/${vinculoAtivo?.disciplinaId}`);
            return res.data;
        },
        enabled: !!vinculoAtivo && (activeTab === 'materiais' || activeTab === 'questionarios')
    });

    const uploadMaterialMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await api.post('/professor/materials/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (res: any) => {
            toast.success(res.message);
            setSelectedFile(null);
            queryClient.invalidateQueries({ queryKey: ['professor', 'materials'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Erro no upload.')
    });

    const deleteMaterialMutation = useMutation({
        mutationFn: (fileId: string) => api.delete(`/professor/materials/${fileId}`),
        onSuccess: () => {
            toast.success('Material removido.');
            queryClient.invalidateQueries({ queryKey: ['professor', 'materials'] });
        }
    });
    const { data: engagement = [] } = useQuery<EngagementData[]>({
        queryKey: ['professor', 'engagement'],
        queryFn: async () => {
            const res = await api.get('/professor/analytics/engagement?days=7');
            return res.data.map((d: any) => ({
                ...d,
                date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }));
        }
    });

    const { data: students = [], isLoading: loadingStudents } = useQuery<Student[]>({
        queryKey: ['professor', 'students', vinculoAtivo?.turmas],
        queryFn: async () => {
            if (!vinculoAtivo) return [];
            const res = await api.get('/professor/students');
            return res.data.filter((s: Student) => vinculoAtivo.turmas.includes(s.turma));
        },
        enabled: !!vinculoAtivo
    });
    
    const { data: gradesData = [], isLoading: loadingGrades } = useQuery({
        queryKey: ['professor', 'grades', vinculoAtivo?.disciplinaId, contextIndex],
        queryFn: async () => {
            if (!vinculoAtivo) return [];
            const res = await api.get('/professor/grades', {
                params: {
                    disciplinaId: vinculoAtivo.disciplinaId,
                    tipo: vinculoAtivo.isRedacao ? 'REDACAO' : 'REGULAR'
                }
            });
            return res.data; 
        },
        enabled: !!vinculoAtivo && activeTab === 'grades'
    });

    const { data: correlationData = [] } = useQuery({
        queryKey: ['professor', 'correlation', vinculoAtivo?.disciplinaId, contextIndex],
        queryFn: async () => {
            if (!vinculoAtivo) return [];
            const res = await api.get('/professor/grades/correlation', {
                params: {
                    disciplinaId: vinculoAtivo.disciplinaId,
                    turma: vinculoAtivo.turmas[0],
                    trimestre: 1
                }
            });
            return res.data;
        },
        enabled: !!vinculoAtivo && activeTab === 'grades'
    });

    const toggleLockMutation = useMutation({
        mutationFn: (turma: string) => api.post('/professor/exam-lock', { 
            turmaId: turma,
            disciplinaId: vinculoAtivo?.disciplinaId 
        }),
        onSuccess: (res: any) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['professor', 'students'] });
        }
    });

    const importMutation = useMutation({
        mutationFn: (data: any) => api.post('/professor/grades/import', data),
        onSuccess: (res: any) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['professor', 'grades'] });
        }
    });

    // --- MÓDULO DE QUESTIONÁRIOS ---
    const { data: teacherQuestions = [], isLoading: loadingQuestions } = useQuery({
        queryKey: ['professor', 'quizzes', vinculoAtivo?.disciplinaId],
        queryFn: async () => {
            const res = await api.get('/quizzes', { params: { disciplinaId: vinculoAtivo?.disciplinaId } });
            return res.data;
        },
        enabled: !!vinculoAtivo && activeTab === 'questionarios'
    });

    // --- MÓDULO PJC 2.0: SIMULADOS DE TREINO ---
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [generatedTitle, setGeneratedTitle] = useState('');

    const generateTrainingQuizMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/professor/training-quizzes/generate', data);
            return res.data;
        },
        onSuccess: (res: any) => {
            setGeneratedQuestions(res.questions);
            setGeneratedTitle(res.titulo);
            toast.success('Questões geradas via RAG com sucesso!');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Erro na geração IA.')
    });

    const saveTrainingQuizMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/professor/training-quizzes', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Simulado de treino publicado!');
            setGeneratedQuestions([]);
            queryClient.invalidateQueries({ queryKey: ['professor', 'quizzes'] });
        }
    });

    // --- MÓDULO DE PESQUISA (PJC) ---
    const { data: surveyStatus = { answered: false } } = useQuery({
        queryKey: ['professor', 'survey-status'],
        queryFn: async () => {
            const res = await api.get('/professor/surveys/status');
            return res.data;
        },
        enabled: !!vinculoAtivo && activeTab === 'pesquisa'
    });

    const submitSurveyMutation = useMutation({
        mutationFn: (data: any) => api.post('/professor/surveys/submit', data),
        onSuccess: (res: any) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['professor', 'survey-status'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao enviar pesquisa.')
    });

    // --- MÓDULO PJC ANALYTICS (NOVO) ---
    const { data: pjcGaps = {}, isLoading: loadingGaps } = useQuery({
        queryKey: ['professor', 'pjc-gaps', vinculoAtivo?.disciplinaId],
        queryFn: async () => {
            const res = await api.get(`/professor/pjc/gaps/${vinculoAtivo?.disciplinaId}`);
            return res.data.gaps;
        },
        enabled: !!vinculoAtivo && activeTab === 'pesquisa'
    });

    const exportPJCData = async () => {
        try {
            const res = await api.get(`/professor/pjc/export/${vinculoAtivo?.disciplinaId}`);
            const data = res.data.dataset;
            
            // Converter para CSV estruturado PJC (B)
            const headers = ['Timestamp', 'Turma', 'Pseudonimo', 'Topico', 'Pergunta', 'Resposta', 'ScoreRAG', 'Modelo'];
            const csvRows = data.map((it: any) => [
                new Date(it.timestamp).toISOString(),
                it.studentTurma || 'N/A',
                it.studentPseudonym,
                `"${it.studentTopic}"`,
                `"${it.questionWashed?.replace(/"/g, '""')}"`,
                `"${it.answerWashed?.replace(/"/g, '""')}"`,
                it.ragScore,
                it.modelUsed
            ].join(','));

            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `PJC_Dataset_SCIENTIFIC_${vinculoAtivo?.nomeDisciplina}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Dataset PJC exportado com separação por turmas!');
        } catch {
            toast.error('Erro ao exportar dados.');
        }
    };

    // --- MÓDULO DE EMENTA ---
    const { isLoading: loadingEmenta } = useQuery({
        queryKey: ['professor', 'ementa', vinculoAtivo?.disciplinaId],
        queryFn: async () => {
            const res = await api.get('/professor/ementa', { params: { disciplinaId: vinculoAtivo?.disciplinaId } });
            setEmentaText(res.data.ementa);
            return res.data;
        },
        enabled: !!vinculoAtivo && activeTab === 'ementa'
    });

    const saveEmentaMutation = useMutation({
        mutationFn: (data: any) => api.put('/professor/ementa', data),
        onSuccess: (res: any) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['professor', 'ementa'] });
        },
        onError: () => toast.error('Erro ao salvar ementa.')
    });

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.matricula.includes(searchTerm)
        ).sort((a, b) => b.xp - a.xp);
    }, [students, searchTerm]);

    const stats = useMemo(() => {
        if (students.length === 0) return { avgXp: 0, totalSaldo: 0 };
        const totalXp = students.reduce((acc, s) => acc + s.xp, 0);
        const totalSaldo = students.reduce((acc, s) => acc + s.saldoPc, 0);
        return {
            avgXp: Math.round(totalXp / students.length),
            totalSaldo
        };
    }, [students]);

    return (
        <ProfessorLayout>
            <PageTransition>
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <BookMarked size={16} />
                                <span className="text-[10px] font-press uppercase tracking-widest">Contexto Acadêmico</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-press text-white uppercase leading-none">
                                {vinculoAtivo?.nomeDisciplina || 'DASHBOARD GLOBAL'}
                            </h1>
                            <div className="flex gap-2 mt-3">
                                {vinculoAtivo?.turmas?.map(t => (
                                    <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-slate-400">
                                        TURMA {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {authUser?.disciplinas && authUser.disciplinas.length > 1 && (
                            <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-white/5">
                                {authUser.disciplinas.map((v: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setContextIndex(idx);
                                            setActiveTab('overview');
                                        }}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-press transition-all ${
                                            idx === contextIndex ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        {v.ano}º ANO - {v.curso}
                                    </button>
                                ))}
                            </div>
                        )}
                    </header>

                    <div className="flex gap-4 border-b border-white/5 pb-2 overflow-x-auto">
                        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'overview' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}><LayoutDashboard size={14} /> VISÃO GERAL</button>
                        <button onClick={() => setActiveTab('grades')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'grades' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><FileSpreadsheet size={14} /> NOTAS</button>
                        <button onClick={() => setActiveTab('questionarios')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'questionarios' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-500 hover:text-slate-300'}`}><Zap size={14} /> QUESTIONÁRIOS</button>
                        <button onClick={() => setActiveTab('materiais')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'materiais' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}><BookMarked size={14} /> MATERIAIS IA</button>
                        <button onClick={() => setActiveTab('ementa')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'ementa' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}><GraduationCap size={14} /> EMENTA</button>
                        <button onClick={() => setActiveTab('pesquisa')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-press whitespace-nowrap transition-all ${activeTab === 'pesquisa' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-slate-500 hover:text-slate-300'}`}><Activity size={14} /> PESQUISA PJC</button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <PixelCard className="p-6 bg-blue-500/5 border-blue-500/20"><p className="text-[10px] font-press text-blue-400/70 mb-2 uppercase">Média de XP</p><h3 className="text-3xl font-press text-white">{stats.avgXp}</h3></PixelCard>
                                <PixelCard className="p-6 bg-yellow-500/5 border-yellow-500/20"><p className="text-[10px] font-press text-yellow-500/70 mb-2 uppercase">PIB da Turma</p><h3 className="text-3xl font-press text-white">{stats.totalSaldo.toLocaleString()}</h3></PixelCard>
                                <PixelCard className="p-6 bg-red-500/5 border-red-500/20 text-right"><p className="text-[10px] font-press text-red-500/70 mb-2 uppercase">Escudo Pedagógico</p><h3 className="text-xl font-press text-white uppercase">{(vinculoAtivo?.turmas?.length ?? 0) > 1 ? 'MULTITURMA' : 'SALA ATIVA'}</h3></PixelCard>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                        <Search className="text-slate-500" size={20} />
                                        <input type="text" placeholder="BUSCAR ALUNO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-white font-mono text-sm w-full" />
                                    </div>
                                    <div className="space-y-3">
                                        {loadingStudents ? (
                                            [...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="text-center py-10 opacity-20">
                                                <Users size={32} className="mx-auto mb-2" />
                                                <p className="font-press text-[8px] uppercase">Nenhum aluno encontrado</p>
                                            </div>
                                        ) : (
                                            filteredStudents.map((s, idx) => (
                                                <PixelCard key={s._id} className="p-4 bg-slate-900/40 border-white/5 flex items-center justify-between group hover:bg-slate-800/60 transition-all">
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-press text-xs text-slate-500">#{idx + 1}</div>
                                                        <div><h3 className="font-press text-[10px] text-white uppercase">{s.nome}</h3><p className="font-mono text-[9px] text-slate-500 mt-1">{s.matricula} • {s.turma}</p></div>
                                                    </div>
                                                    <div className="flex gap-8 items-center pr-4 text-right">
                                                        <div><p className="text-[8px] font-press text-slate-600">XP</p><p className="font-press text-[10px] text-blue-400">{s.xp}</p></div>
                                                        <div><p className="text-[8px] font-press text-slate-600">SALDO</p><p className="font-press text-[10px] text-yellow-500">{s.saldoPc}</p></div>
                                                        <ChevronRight className="text-slate-700 group-hover:text-white" size={20} />
                                                    </div>
                                                </PixelCard>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <PixelCard className="p-6 bg-purple-500/5 border-purple-500/20">
                                        <h3 className="font-press text-[10px] text-purple-500 uppercase mb-6 text-center">Rastro Digital (PJC)</h3>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={engagement}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                                    <XAxis dataKey="date" hide />
                                                    <YAxis hide />
                                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', fontSize: '10px' }} />
                                                    <Area type="monotone" dataKey="passiveVisits" stroke="#8b5cf6" fill="#8b5cf610" />
                                                    <Area type="monotone" dataKey="activeLogins" stroke="#10b981" fill="#10b98110" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </PixelCard>
                                    <PixelCard className="p-6 bg-red-500/5 border-red-500/20">
                                        <h3 className="font-press text-[10px] text-red-500 uppercase mb-6 text-center">Segurança de Prova</h3>
                                        <div className="space-y-3">
                                            {vinculoAtivo?.turmas?.map(t => (
                                                <div key={t} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                    <p className="font-press text-[10px] text-white">{t}</p>
                                                    <PixelButton variant="secondary" className="px-3 py-1 text-[8px]" onClick={() => toggleLockMutation.mutate(t)}>TRAVAR</PixelButton>
                                                </div>
                                            ))}
                                        </div>
                                    </PixelCard>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'grades' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <PixelCard className="p-6 bg-slate-900/40 border-white/5">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                            <ChartIcon size={18} />
                                        </div>
                                        <h3 className="text-xs font-press text-blue-400 uppercase">Gestão de Performance</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[8px] font-press text-slate-500 border-b border-white/5">
                                                    <th className="pb-4">ALUNO</th>
                                                    <th className="pb-4 text-center">TURMA</th>
                                                    <th className="pb-4 text-center">N1</th>
                                                    <th className="pb-4 text-center">N2</th>
                                                    <th className="pb-4 text-right">MÉDIA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[10px] font-mono">
                                                {loadingGrades ? (
                                                    [...Array(3)].map((_, i) => (
                                                        <tr key={i} className="animate-pulse">
                                                            <td className="py-4 bg-white/5 rounded my-1" colSpan={5}>&nbsp;</td>
                                                        </tr>
                                                    ))
                                                ) : gradesData.length === 0 ? (
                                                    <tr>
                                                        <td className="py-10 text-center opacity-30 italic" colSpan={5}>Nenhum registro de nota encontrado.</td>
                                                    </tr>
                                                ) : (
                                                    gradesData.map((g: any) => (
                                                        <tr key={g._id} className="border-b border-white/5">
                                                            <td className="py-4 font-press text-white uppercase text-[8px]">{g.alunoId.nome}</td>
                                                            <td className="py-4 text-center text-slate-400">{g.alunoId.turma}</td>
                                                            <td className="py-4 text-center text-blue-400">{g.n1}</td>
                                                            <td className="py-4 text-center text-purple-400">{g.n2}</td>
                                                            <td className="py-4 text-right text-emerald-400">{((g.n1 + g.n2) / 2).toFixed(1)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </PixelCard>
                            </div>
                            <div className="space-y-6">
                                <PixelCard className="p-6 bg-blue-500/5 border-blue-500/20">
                                    <h3 className="text-xs font-press text-blue-500 mb-4 uppercase">Importar Planilha</h3>
                                    <PixelButton 
                                        variant="secondary" 
                                        className="w-full text-[9px]" 
                                        onClick={() => importMutation.mutate({})}
                                        isLoading={importMutation.isPending}
                                    >
                                        <Plus size={14} className="mr-2" /> SELECIONAR CSV
                                    </PixelButton>
                                </PixelCard>
                                <PixelCard className="p-6 bg-emerald-500/5 border-emerald-500/20">
                                    <h3 className="text-xs font-press text-emerald-500 mb-6 uppercase">Correlação IA vs NOTA</h3>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={correlationData}>
                                                <Area type="monotone" dataKey="mediaAcademica" stroke="#10b981" fill="#10b98120" />
                                                <Area type="monotone" dataKey="interacoesIA" stroke="#8b5cf6" fill="#8b5cf620" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </PixelCard>
                            </div>
                        </div>
                    )}

                    {activeTab === 'questionarios' && (
                        <div className="space-y-6">
                            <PixelCard className="p-6 bg-orange-500/5 border-orange-500/20">
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex-1">
                                            <h3 className="font-press text-xs text-orange-400 uppercase mb-2">Mágica IA: Gerador PJC 2.0</h3>
                                            <p className="text-[10px] text-slate-500 font-mono italic">"Baseado estritamente no seu material didático (Regra X=X)"</p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[8px] font-press text-slate-600 uppercase">Assunto</label>
                                                <select 
                                                    value={selectedTopic}
                                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-orange-500/50 outline-none w-48"
                                                >
                                                    <option value="">SELECIONE UM TÓPICO...</option>
                                                    {ementaTopics.map((t: string) => (
                                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[8px] font-press text-slate-600 uppercase">Dificuldade</label>
                                                <select 
                                                    value={trainingDifficulty}
                                                    onChange={(e) => setTrainingDifficulty(e.target.value as any)}
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-orange-500/50 outline-none w-32"
                                                >
                                                    <option value="FACIL">FÁCIL (1min/q)</option>
                                                    <option value="MEDIO">MÉDIO (2min/q)</option>
                                                    <option value="DIFICIL">DIFÍCIL (4min/q)</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[8px] font-press text-slate-600 uppercase">Qtd</label>
                                                <input 
                                                    type="number" 
                                                    value={numQuestions}
                                                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-orange-500/50 outline-none w-16"
                                                />
                                            </div>
                                            <PixelButton 
                                                variant="primary" 
                                                className="px-6 py-2 bg-orange-600 text-[10px] mt-auto"
                                                onClick={() => generateTrainingQuizMutation.mutate({
                                                    disciplinaId: vinculoAtivo?.disciplinaId,
                                                    topico: selectedTopic,
                                                    trimestre: selectedTrimestre,
                                                    dificuldade: trainingDifficulty,
                                                    quantidade: numQuestions
                                                })}
                                                isLoading={generateTrainingQuizMutation.isPending}
                                                disabled={!selectedTopic}
                                            >
                                                <Zap size={14} className="mr-2" /> GERAR VIA RAG
                                            </PixelButton>
                                        </div>
                                    </div>

                                    {generatedQuestions.length > 0 && (
                                        <div className="bg-black/40 p-6 rounded-2xl border border-orange-500/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <h4 className="font-press text-[10px] text-white uppercase">{generatedTitle}</h4>
                                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                                {generatedQuestions.map((q, idx) => (
                                                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-[11px] text-slate-200 font-mono mb-2">Q{idx+1}: {q.pergunta}</p>
                                                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                                                            {q.alternativas.map((alt: string, i: number) => (
                                                                <div key={i} className={`p-2 rounded border ${i === q.respostaCorreta ? 'border-emerald-500/50 text-emerald-400' : 'border-white/5'}`}>
                                                                    {String.fromCharCode(65+i)}) {alt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-[8px] text-slate-500 mt-2 italic">💡 Explicação: {q.explicacao}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <PixelButton variant="secondary" className="px-4 py-1.5 text-[8px]" onClick={() => setGeneratedQuestions([])}>DESCARTAR</PixelButton>
                                                <PixelButton 
                                                    variant="primary" 
                                                    className="px-6 py-1.5 bg-emerald-600 text-[8px]"
                                                    onClick={() => saveTrainingQuizMutation.mutate({
                                                        disciplinaId: vinculoAtivo?.disciplinaId,
                                                        titulo: generatedTitle,
                                                        topico: selectedTopic,
                                                        trimestre: selectedTrimestre,
                                                        dificuldade: trainingDifficulty,
                                                        questoes: generatedQuestions
                                                    })}
                                                    isLoading={saveTrainingQuizMutation.isPending}
                                                >
                                                    PUBLICAR TREINO (10 PC$)
                                                </PixelButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </PixelCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <PixelCard className="p-6 border-dashed border-white/10 bg-white/5 text-center cursor-pointer hover:bg-white/10 flex flex-col items-center justify-center min-h-[160px]">
                                    <Plus size={32} className="mx-auto text-slate-500 mb-2" />
                                    <p className="font-press text-[9px] text-slate-500 uppercase">NOVA QUESTÃO MANUAL</p>
                                </PixelCard>

                                {loadingQuestions ? (
                                    [...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)
                                ) : teacherQuestions.length === 0 ? (
                                    <div className="md:col-span-2 lg:col-span-2 text-center py-10 opacity-20 flex flex-col items-center justify-center">
                                        <BookMarked size={32} className="mb-2" />
                                        <p className="font-press text-[8px] uppercase">Seu banco de questões está vazio</p>
                                    </div>
                                ) : (
                                    teacherQuestions.map((q: any) => (
                                        <PixelCard key={q._id} className="p-5 bg-slate-900 border-white/5 relative group">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-press ${q.origem === 'IA' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {q.origem}
                                                </span>
                                                <span className="text-[8px] font-mono text-slate-600">{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="font-mono text-[11px] text-white leading-relaxed mb-4 line-clamp-3 italic">
                                                "{q.pergunta}"
                                            </p>
                                            <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                                                <span className="text-[8px] font-press text-slate-500 uppercase">{q.dificuldade}</span>
                                                <button className="text-[8px] font-press text-blue-400 hover:text-white transition-colors">VER DETALHES</button>
                                            </div>
                                        </PixelCard>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'materiais' && (
                        <div className="space-y-6">
                            <PixelCard className="p-8 bg-green-500/5 border-green-500/20">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                                                <Upload size={20} />
                                            </div>
                                            <h3 className="text-xs font-press text-green-400 uppercase">Treinar Oráculo GIL</h3>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-6">
                                            Envie materiais (PDF, DOCX, MD) para que a IA aprenda seu conteúdo. 
                                            O Oráculo usará estes dados para mentorar seus alunos nesta disciplina.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-press text-slate-500 uppercase ml-1">Categoria</label>
                                                <select 
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-green-500/50 outline-none"
                                                >
                                                    <option value="CONTEUDO_AULA">CONTEÚDO DE AULA</option>
                                                    <option value="EXERCICIOS">EXERCÍCIOS / LISTAS</option>
                                                    <option value="GABARITO">GABARITO OFICIAL</option>
                                                    <option value="EMENTA">EMENTA / CRONOGRAMA</option>
                                                    <option value="MATERIAL_APOIO">MATERIAL DE APOIO</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-press text-slate-500 uppercase ml-1">Filtros Acadêmicos</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select 
                                                        value={selectedAno}
                                                        onChange={(e) => setSelectedAno(e.target.value)}
                                                        data-testid="upload-ano"
                                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-green-500/50 outline-none"
                                                    >
                                                        <option value="1">1º ANO</option>
                                                        <option value="2">2º ANO</option>
                                                        <option value="3">3º ANO</option>
                                                    </select>
                                                    <select 
                                                        value={selectedTrimestre}
                                                        onChange={(e) => setSelectedTrimestre(e.target.value)}
                                                        data-testid="upload-trimestre"
                                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-green-500/50 outline-none"
                                                    >
                                                        <option value="1">1º TRIM</option>
                                                        <option value="2">2º TRIM</option>
                                                        <option value="3">3º TRIM</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-press text-slate-500 uppercase ml-1">Assunto Relacionado</label>
                                                <select 
                                                    value={selectedTopic}
                                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white focus:border-green-500/50 outline-none"
                                                >
                                                    <option value="">TODOS OS ASSUNTOS</option>
                                                    {ementaTopics.map((t: string) => (
                                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-press text-slate-500 uppercase ml-1">Arquivo</label>
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 font-mono text-[10px] text-slate-400 file:bg-transparent file:border-none file:text-green-400 file:font-press file:text-[9px] file:mr-4 cursor-pointer"
                                                    accept=".pdf,.docx,.doc,.txt,.md"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                        <PixelButton 
                                            variant="primary" 
                                            data-testid="upload-submit"
                                            className="px-8 py-3 bg-green-600 text-[10px]"
                                            disabled={!selectedFile || uploadMaterialMutation.isPending}
                                            onClick={() => {
                                                if (!selectedFile || !vinculoAtivo) return;
                                                const formData = new FormData();
                                                formData.append('material', selectedFile);
                                                formData.append('category', selectedCategory);
                                                formData.append('disciplinaId', vinculoAtivo.disciplinaId);
                                                formData.append('ano', selectedAno);
                                                formData.append('trimestre', selectedTrimestre);
                                                formData.append('topico', selectedTopic);
                                                uploadMaterialMutation.mutate(formData);
                                            }}
                                            isLoading={uploadMaterialMutation.isPending}
                                        >
                                            <Zap size={14} className="mr-2" /> INDEXAR AGORA
                                        </PixelButton>
                                        {selectedFile && <p className="text-[8px] font-mono text-slate-500 uppercase">{selectedFile.name}</p>}
                                    </div>
                                </div>
                            </PixelCard>

                            <PixelCard className="p-6 bg-slate-900/40 border-white/5">
                                <h3 className="text-[10px] font-press text-white uppercase mb-6 flex items-center gap-2">
                                    <BookMarked size={14} className="text-slate-500" /> Materiais Ativos na IA
                                </h3>
                                
                                {loadingMaterials ? (
                                    <div className="space-y-3">
                                        {[1,2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : materials.length === 0 ? (
                                    <div className="text-center py-12 opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                                        <FileText size={32} className="mx-auto mb-2" />
                                        <p className="font-press text-[8px] uppercase">Nenhum material indexado para esta disciplina</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {materials.map((m: any) => (
                                            <div key={m.fileId} className="py-4 flex items-center justify-between group">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-press text-[10px] text-white uppercase truncate max-w-[200px] md:max-w-md">{m.fileName}</h4>
                                                        <div className="flex gap-3 mt-1">
                                                            <span className="text-[8px] font-press text-green-500/70">{m.category.replace('_', ' ')}</span>
                                                            <span className="text-[8px] font-mono text-slate-500">INDEXADO EM: {new Date(m.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => deleteMaterialMutation.mutate(m.fileId)}
                                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Remover Material"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </PixelCard>
                        </div>
                    )}

                    {activeTab === 'ementa' && (
                        <div className="space-y-6">
                            <PixelCard className="p-8 bg-yellow-500/5 border-yellow-500/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                                        <BookMarked size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-press text-yellow-500 uppercase">Ementa do Trimestre</h3>
                                        <p className="text-[10px] text-slate-500 font-mono">Defina o que o Oráculo GIL deve priorizar agora.</p>
                                    </div>
                                </div>

                                {loadingEmenta ? (
                                    <div className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5 mb-4" />
                                ) : (
                                    <textarea 
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-slate-300 focus:outline-none focus:border-yellow-500/50 transition-all mb-4"
                                        placeholder="Resumo dos tópicos principais..."
                                        value={ementaText}
                                        onChange={(e) => setEmentaText(e.target.value)}
                                    />
                                )}

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                        CONTEXTO ATIVO NO ORÁCULO
                                    </div>
                                    <PixelButton 
                                        variant="primary" 
                                        className="px-8 bg-yellow-600 border-yellow-500 text-[10px]"
                                        onClick={() => saveEmentaMutation.mutate({
                                            disciplinaId: vinculoAtivo?.disciplinaId,
                                            ementa: ementaText
                                        })}
                                        isLoading={saveEmentaMutation.isPending}
                                    >
                                        ATUALIZAR DIRETRIZES
                                    </PixelButton>
                                </div>
                            </PixelCard>

                            <PixelCard className="p-6 bg-slate-900/40 border-white/5">
                                <h4 className="text-[9px] font-press text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <FileText size={14} /> Arquivos de Cronograma Indexados
                                </h4>
                                <div className="space-y-2">
                                    {materials.filter((m: any) => m.category === 'EMENTA').length === 0 ? (
                                        <p className="text-[9px] font-mono text-slate-600 italic py-4 text-center border border-dashed border-white/5 rounded-xl">
                                            Nenhum arquivo de ementa (PDF/DOCX) subido ainda.
                                        </p>
                                    ) : (
                                        materials.filter((m: any) => m.category === 'EMENTA').map((m: any) => (
                                            <div key={m.fileId} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Book size={14} className="text-yellow-500/50" />
                                                    <span className="text-[10px] font-mono text-slate-300">{m.fileName}</span>
                                                </div>
                                                <span className="text-[8px] font-press text-yellow-500/40 uppercase">VIGENTE</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PixelCard>
                        </div>
                    )}

                    {activeTab === 'pesquisa' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="text-center mb-10">
                                <Activity className="mx-auto text-pink-500 mb-4" size={48} />
                                <h3 className="font-press text-lg text-white uppercase mb-2">Central Científica PJC 2K26</h3>
                                <p className="font-mono text-xs text-slate-400 italic">"Monitoramento de Alta Performance e Extração de Evidências"</p>
                                
                                <div className="mt-8 flex justify-center gap-4">
                                   <PixelButton 
                                      variant="primary" 
                                      className="bg-purple-600 border-purple-400 text-[10px] px-6"
                                      onClick={exportPJCData}
                                   >
                                      <FileSpreadsheet size={16} className="mr-2" /> EXPORTAR DATASET (ANONIMIZADO)
                                   </PixelButton>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                <PixelCard className="p-6 bg-slate-900/60 border-purple-500/20">
                                    <h4 className="font-press text-[10px] text-purple-400 uppercase mb-4 flex items-center gap-2">
                                        <Zap size={14} /> Gaps de Conhecimento
                                    </h4>
                                    <p className="text-[9px] text-slate-500 font-mono mb-4">Perguntas foiras do material indexado (RAG Score &lt; 0.5)</p>
                                    
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {loadingGaps ? (
                                            <p className="animate-pulse text-[9px] font-mono text-slate-600">Sincronizando lacunas...</p>
                                        ) : Object.keys(pjcGaps).length === 0 ? (
                                            <p className="text-[9px] font-mono text-slate-700 italic">Nenhuma lacuna crítica detectada hoje.</p>
                                        ) : (
                                            Object.entries(pjcGaps).map(([topic, questions]: any) => (
                                                <div key={topic} className="p-3 bg-black/40 rounded-xl border border-white/5">
                                                    <p className="text-[8px] font-press text-purple-500/80 mb-2 uppercase">{topic}</p>
                                                    <ul className="space-y-2">
                                                        {questions.map((q: string, idx: number) => (
                                                            <li key={idx} className="text-[10px] text-slate-400 font-mono border-l border-purple-500/30 pl-2 leading-tight">
                                                                {q}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </PixelCard>

                                <PixelCard className="p-6 bg-slate-900/60 border-pink-500/20">
                                    <h4 className="font-press text-[10px] text-pink-400 uppercase mb-4 flex items-center gap-2">
                                        <Activity size={14} /> Métricas de Resiliência
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                            <span className="text-[9px] font-press text-slate-500 uppercase">Economia de Tokens</span>
                                            <span className="text-xs font-mono text-emerald-400">ATIVO (Cache Semântico)</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                            <span className="text-[9px] font-press text-slate-500 uppercase">Modelo Primário</span>
                                            <span className="text-xs font-mono text-blue-400">GEMINI 2.0 FLASH</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                                            <span className="text-[9px] font-press text-slate-500 uppercase">Modelo Fallback</span>
                                            <span className="text-xs font-mono text-orange-400">NVIDIA GLM5</span>
                                        </div>
                                    </div>
                                </PixelCard>
                            </div>

                            <div className="bg-white/5 h-px w-full my-8" />

                            {surveyStatus.answered ? (
                                <PixelCard className="p-12 bg-green-500/5 border-green-500/20 text-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ChevronRight size={32} className="text-green-500" />
                                    </div>
                                    <h3 className="font-press text-sm text-white mb-2 uppercase">Pesquisa Concluída!</h3>
                                    <p className="font-mono text-xs text-slate-400">Você já contribuiu com os dados deste mês. Obrigado!</p>
                                </PixelCard>
                            ) : (
                                <>
                                    {[
                                        "A AI ajudou no engajamento?", 
                                        "Melhora no desempenho?", 
                                        "Aumento na curiosidade?", 
                                        "Facilitou o ensino?"
                                    ].map((q, i) => (
                                        <PixelCard key={i} className="p-6 bg-slate-900/40 border-white/5">
                                            <p className="font-press text-[10px] text-white mb-6 uppercase leading-relaxed">{q}</p>
                                            <div className="flex justify-between gap-1">
                                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                                    <button 
                                                        key={n} 
                                                        onClick={() => {
                                                            const newAnswers = [...surveyAnswers];
                                                            newAnswers[i] = n;
                                                            setSurveyAnswers(newAnswers);
                                                        }}
                                                        className={`flex-1 py-3 border rounded font-mono text-sm transition-all ${
                                                            surveyAnswers[i] === n 
                                                            ? 'bg-pink-500 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </PixelCard>
                                    ))}
                                    <PixelButton 
                                        variant="primary" 
                                        className="w-full py-4 bg-pink-600 border-pink-400 uppercase font-press text-xs"
                                        onClick={() => submitSurveyMutation.mutate({
                                            disciplinaId: vinculoAtivo?.disciplinaId,
                                            respostas: surveyAnswers.map((n, i) => ({
                                                pergunta: [
                                                    "A AI ajudou no engajamento?", 
                                                    "Melhora no desempenho?", 
                                                    "Aumento na curiosidade?", 
                                                    "Facilitou o ensino?"
                                                ][i],
                                                nota: n
                                            }))
                                        })}
                                        isLoading={submitSurveyMutation.isPending}
                                    >
                                        Enviar Pesquisa Mensal
                                    </PixelButton>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </PageTransition>
        </ProfessorLayout>
    );
}
