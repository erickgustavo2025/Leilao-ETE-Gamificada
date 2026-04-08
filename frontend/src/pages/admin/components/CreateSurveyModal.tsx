import React, { useState } from 'react';
import { 
    X, Plus, Trash2, HelpCircle, 
    ChevronDown, Save, Loader2,
    GraduationCap, Wallet, Activity, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface Question {
    id: string;
    text: string;
    type: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'boolean';
    options?: string[];
    required: boolean;
}

interface CreateSurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    isSaving: boolean;
}

export function CreateSurveyModal({ isOpen, onClose, onSave, isSaving }: CreateSurveyModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rewardAmount, setRewardAmount] = useState(100);
    const [category, setCategory] = useState<'education' | 'financial' | 'performance' | 'general'>('general');
    const [questions, setQuestions] = useState<Question[]>([
        { id: 'q1', text: '', type: 'text', required: true }
    ]);

    const categories = [
        { id: 'education', label: 'Educação', icon: GraduationCap },
        { id: 'financial', label: 'Financeiro', icon: Wallet },
        { id: 'performance', label: 'Desempenho', icon: Activity },
        { id: 'general', label: 'Geral', icon: Globe },
    ] as const;

    const addQuestion = () => {
        const newId = `q${Date.now()}`;
        setQuestions([...questions, { id: newId, text: '', type: 'text', required: true }]);
    };

    const removeQuestion = (id: string) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const options = q.options || ['Opção 1'];
                return { ...q, options: [...options, `Opção ${options.length + 1}`] };
            }
            return q;
        }));
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
            }
            return q;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Filtra perguntas sem texto antes de enviar
        const validQuestions = questions.filter(q => q.text && q.text.trim());
        
        if (validQuestions.length === 0) {
            return alert('A pesquisa deve ter pelo menos uma pergunta preenchida!');
        }

        onSave({
            title,
            description,
            rewardAmount,
            category,
            questions: validQuestions
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-purple-500/30 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div>
                        <h2 className="font-vt323 text-4xl text-white uppercase leading-none">Nova Pesquisa Científica</h2>
                        <p className="font-mono text-[10px] text-purple-400 uppercase tracking-widest mt-1">Laboratório Jovem Cientista</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block font-press text-[8px] text-slate-500 uppercase mb-2">Título da Pesquisa</label>
                                <input 
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Impacto da Gamificação..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-press text-[8px] text-slate-500 uppercase mb-2">Descrição (Opcional)</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Explique o objetivo da coleta..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-purple-500 outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block font-press text-[8px] text-slate-500 uppercase mb-3">Categoria/Assunto</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id as any)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                                                category === cat.id 
                                                    ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                    : "bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                            )}
                                        >
                                            <cat.icon size={18} />
                                            <span className="font-mono text-[9px] uppercase">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-3xl self-start">
                            <label className="block font-press text-[8px] text-purple-400 uppercase mb-4">Recompensa (PC$)</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="number"
                                    min={50}
                                    max={1000}
                                    value={rewardAmount}
                                    onChange={e => setRewardAmount(Number(e.target.value))}
                                    className="w-24 bg-black/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white font-vt323 text-2xl outline-none"
                                />
                                <p className="font-mono text-[9px] text-slate-500 uppercase">
                                    Valor creditado automaticamente na conta do aluno.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-slate-800" />

                    {/* Perguntas Dinâmicas */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-press text-[10px] text-white uppercase tracking-tighter">Perguntas do Questionário</h3>
                            <button 
                                type="button"
                                onClick={addQuestion}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-400 rounded-xl transition-all font-mono text-[10px] uppercase"
                            >
                                <Plus size={14} /> Adicionar Pergunta
                            </button>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence>
                                {questions.map((q, qIndex) => (
                                    <motion.div 
                                        key={q.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-4 relative"
                                    >
                                        <div className="absolute -left-3 top-6 w-6 h-6 bg-slate-800 text-white font-press text-[8px] rounded flex items-center justify-center">
                                            {qIndex + 1}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-8">
                                                <input 
                                                    value={q.text}
                                                    onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                                                    placeholder="Digite sua pergunta aqui..."
                                                    className="w-full bg-transparent border-b border-slate-800 focus:border-purple-500 py-2 text-white font-mono text-sm outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <div className="relative">
                                                    <select 
                                                        value={q.type}
                                                        onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="text">Discursiva</option>
                                                        <option value="rating">Estrelas (1-5)</option>
                                                        <option value="multiple_choice">Múltipla Escolha</option>
                                                        <option value="checkbox">Caixa de Seleção</option>
                                                        <option value="boolean">Verdadeiro/Falso</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 flex justify-end">
                                                <button 
                                                    type="button"
                                                    disabled={questions.length === 1}
                                                    onClick={() => removeQuestion(q.id)}
                                                    className="p-2 text-rose-500/50 hover:text-rose-500 disabled:opacity-30 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                                            <div className="pl-4 border-l-2 border-purple-500/20 space-y-2 mt-4">
                                                <p className="font-press text-[7px] text-slate-600 uppercase mb-2">Opções de Resposta</p>
                                                {q.options?.map((opt, optIndex) => (
                                                    <div key={optIndex} className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                                                        <input 
                                                            value={opt}
                                                            onChange={e => updateOption(q.id, optIndex, e.target.value)}
                                                            className="flex-1 bg-transparent border-b border-slate-900 py-1 text-slate-400 font-mono text-xs outline-none focus:border-slate-700 transition-colors"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeOption(q.id, optIndex)}
                                                            className="p-1 text-slate-600 hover:text-rose-500"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button"
                                                    onClick={() => addOption(q.id)}
                                                    className="text-[9px] font-mono text-purple-400 hover:text-purple-300 underline ml-6"
                                                >
                                                    + Adicionar Opção
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-slate-800 bg-black/20 flex md:flex-row flex-col items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <HelpCircle size={16} />
                        <p className="font-mono text-[10px] uppercase">Máximo sugerido: 10 perguntas.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 font-press text-[10px] text-slate-400 hover:text-white transition-colors"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isSaving || !title}
                            className="flex items-center gap-3 px-8 py-3 bg-purple-600 disabled:bg-slate-800 text-white font-press text-[10px] rounded-2xl hover:bg-purple-500 transition-all shadow-lg"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            LANÇAR PESQUISA
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
