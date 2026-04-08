import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Shield, User, AlertTriangle } from 'lucide-react';
import { api } from '../../api/axios-config';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import { PixelCard } from '../../components/ui/PixelCard';
import { PixelButton } from '../../components/ui/PixelButton';
import { AdminLayout } from '../../components/layout/AdminLayout';


const SKILL_OPTIONS = [
    { id: 'AJUDA_DIVINA', name: '🙌 Ajuda Divina' },
    { id: 'REDUCAO_DANO', name: '🛡️ Redução de Dano' },
    { id: 'AUREA_SABER', name: '✨ Áurea do Saber' },
    { id: 'INVISIBILIDADE_1', name: '👻 Invisibilidade' },
    { id: 'CONVERTER_PC', name: '📝 Converter PC em Nota' },
    { id: 'AJUDA_SUPREMA', name: '🔥 Ajuda Suprema' },
    { id: 'RESSUSCITAR', name: '💖 Ressuscitar' },
    { id: 'ARREMATADOR', name: '🔨 Arrematador de Leilões' },
];

const BENEFIT_OPTIONS = [
    { id: 'MARKETPLACE', name: '🛒 Acesso ao Mercado P2P' },
    { id: 'ETE_BANK', name: '🏦 Empréstimos Bancários' },
    { id: 'STARTUP_INVEST', name: '📈 Investimento em Startups' },
    { id: 'ROULETTE', name: '🎡 Roleta de Prêmios' },
];

interface Regulation {
    _id?: string;
    type: 'GENERAL' | 'TEACHER';
    title: string;
    content: string;
    teacherName?: string;
    blockedSkills: string[];
    blockedBenefits: string[];
    usageLimits: {
        maxDailySkills: number | null;
        preventConsecutiveSameSkill: boolean;
    };
    isActive: boolean;
}

export function AdminRegulations() {
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentReg, setCurrentReg] = useState<Regulation>({
        type: 'GENERAL',
        title: '',
        content: '',
        blockedSkills: [],
        blockedBenefits: [],
        usageLimits: { maxDailySkills: null, preventConsecutiveSameSkill: false },
        isActive: true
    });

    const toggleSelection = (field: 'blockedSkills' | 'blockedBenefits', id: string) => {
        const current = [...currentReg[field]];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setCurrentReg({ ...currentReg, [field]: current });
    };

    useEffect(() => {
        loadRegulations();
    }, []);

    async function loadRegulations() {
        try {
            const res = await api.get('/admin/regulations');
            setRegulations(res.data);
        } catch {
            toast.error("Erro ao carregar regulamentos.");
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        if (!currentReg.title || !currentReg.content) {
            return toast.warning("Título e conteúdo são obrigatórios.");
        }

        try {
            if (currentReg._id) {
                await api.put(`/admin/regulations/${currentReg._id}`, currentReg);
                toast.success("Regulamento atualizado!");
            } else {
                await api.post('/admin/regulations', currentReg);
                toast.success("Regulamento criado!");
            }
            setIsEditing(false);
            loadRegulations();
        } catch {
            toast.error("Erro ao salvar regulamento.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja excluir este regulamento?")) return;
        try {
            await api.delete(`/admin/regulations/${id}`);
            toast.success("Removido com sucesso.");
            loadRegulations();
        } catch {
            toast.error("Erro ao excluir.");
        }
    };

    return (
        <AdminLayout>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-press text-xl text-white">MOTOR DE REGULAMENTOS</h1>
                    <p className="text-slate-400 font-mono text-sm">Gestão de regras éticas e restrições por professor</p>
                </div>
                <PixelButton onClick={() => {
                    setCurrentReg({
                        type: 'GENERAL',
                        title: '',
                        content: '',
                        blockedSkills: [],
                        blockedBenefits: [],
                        usageLimits: { maxDailySkills: null, preventConsecutiveSameSkill: false },
                        isActive: true
                    });
                    setIsEditing(true);
                }}>
                    <Plus size={16} className="mr-2" /> NOVO REGULAMENTO
                </PixelButton>
            </div>

            {isEditing && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <PixelCard className="p-6 bg-slate-900 border-blue-500/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-press text-slate-500 mb-2">TIPO</label>
                                <select 
                                    value={currentReg.type}
                                    onChange={e => setCurrentReg({...currentReg, type: e.target.value as any})}
                                    className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-sm rounded"
                                >
                                    <option value="GENERAL">GERAL (ESCOLA)</option>
                                    <option value="TEACHER">ESPECÍFICO (PROFESSOR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-press text-slate-500 mb-2">TÍTULO DA REGRA</label>
                                <input 
                                    type="text"
                                    value={currentReg.title}
                                    onChange={e => setCurrentReg({...currentReg, title: e.target.value})}
                                    className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-sm rounded"
                                    placeholder="Ex: Regras de Uso Ético"
                                />
                            </div>
                        </div>

                        {currentReg.type === 'TEACHER' && (
                            <div className="mb-4">
                                <label className="block text-[10px] font-press text-slate-500 mb-2">NOME DO PROFESSOR</label>
                                <input 
                                    type="text"
                                    value={currentReg.teacherName || ''}
                                    onChange={e => setCurrentReg({...currentReg, teacherName: e.target.value})}
                                    className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-sm rounded"
                                    placeholder="Ex: Prof. Girafales"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-[10px] font-press text-slate-500 mb-2">CONTEÚDO / DESCRIÇÃO</label>
                            <textarea 
                                value={currentReg.content}
                                onChange={e => setCurrentReg({...currentReg, content: e.target.value})}
                                className="w-full bg-black border border-slate-700 p-2 text-white font-mono text-sm rounded h-32"
                                placeholder="Descreva as regras detalhadamente..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-press text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={14} /> BLOQUEAR SKILLS
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {SKILL_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleSelection('blockedSkills', opt.id)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full border text-[9px] font-press transition-all',
                                                currentReg.blockedSkills.includes(opt.id)
                                                    ? 'bg-red-500 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                                    : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
                                            )}
                                        >
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-press text-orange-400 flex items-center gap-2">
                                    <Shield size={14} /> BLOQUEAR BENEFÍCIOS
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {BENEFIT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleSelection('blockedBenefits', opt.id)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full border text-[9px] font-press transition-all',
                                                currentReg.blockedBenefits.includes(opt.id)
                                                    ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                                    : 'bg-black border-slate-800 text-slate-500 hover:border-slate-600'
                                            )}
                                        >
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-700 bg-black text-blue-600"
                                            checked={currentReg.usageLimits.preventConsecutiveSameSkill}
                                            onChange={e => setCurrentReg({
                                                ...currentReg, 
                                                usageLimits: { ...currentReg.usageLimits, preventConsecutiveSameSkill: e.target.checked }
                                            })}
                                        />
                                        <span className="text-[9px] font-press text-slate-400">EVITAR USO CONSECUTIVO DA MESMA SKILL</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                            <PixelButton onClick={() => setIsEditing(false)} className="bg-slate-800 border-slate-700 text-slate-400">
                                <X size={16} className="mr-2" /> CANCELAR
                            </PixelButton>
                            <PixelButton onClick={handleSave} className="bg-blue-600 border-blue-400">
                                <Save size={16} className="mr-2" /> SALVAR REGULAMENTO
                            </PixelButton>
                        </div>
                    </PixelCard>
                </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {regulations.map(reg => (
                    <PixelCard key={reg._id} className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-lg border ${reg.type === 'GENERAL' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                                    {reg.type === 'GENERAL' ? <Shield size={24} /> : <User size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[8px] font-press px-2 py-0.5 rounded border ${reg.type === 'GENERAL' ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' : 'bg-purple-900/30 border-purple-500/50 text-purple-400'}`}>
                                            {reg.type === 'GENERAL' ? 'GERAL' : 'PROFESSOR'}
                                        </span>
                                        <h2 className="font-press text-xs text-white">{reg.title}</h2>
                                    </div>
                                    {reg.teacherName && <p className="text-[10px] font-mono text-purple-400 mb-2">Professor: {reg.teacherName}</p>}
                                    <p className="text-xs text-slate-400 font-mono line-clamp-2 max-w-2xl">{reg.content}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setCurrentReg(reg); setIsEditing(true); }} className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => reg._id && handleDelete(reg._id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </PixelCard>
                ))}
                {regulations.length === 0 && !loading && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="font-press text-[10px] text-slate-600">NENHUM REGULAMENTO CADASTRADO</p>
                    </div>
                )}
            </div>
        </div>
        </AdminLayout>
    );
}
