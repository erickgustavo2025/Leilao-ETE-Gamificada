import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Lock, Search, User,
    AlertTriangle, Info, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios-config';
import { PixelCard } from '../../components/ui/PixelCard';
import { cn } from '../../utils/cn';

interface Regulation {
    _id: string;
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
    updatedAt?: string;
}

export function Regulations() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: regulations = [], isLoading } = useQuery({
        queryKey: ['public', 'regulations'],
        queryFn: async () => {
            const res = await api.get('/regulations');
            return res.data as Regulation[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const filteredRegs = regulations.filter(reg =>
        reg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.teacherName && reg.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#050505] p-4 md:p-8 pt-24 md:pt-28">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/50 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <BookOpen className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h1 className="font-press text-xl text-white tracking-tight">REGULAMENTOS</h1>
                            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mt-1">Código de Ética e Poderes por Professor</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="BUSCAR REGRA OU PROFESSOR..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs font-press text-white focus:outline-none focus:border-blue-500/50 transition-all w-full md:w-64"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="font-press text-[10px] text-slate-500 animate-pulse">SINCRONIZANDO REGRAS...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredRegs.map((reg, idx) => (
                            <motion.div
                                key={reg._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <PixelCard className={cn(
                                    "p-6 bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all",
                                    reg.type === 'GENERAL' ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-purple-500"
                                )}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded font-press text-[7px] border",
                                                    reg.type === 'GENERAL'
                                                        ? "bg-blue-900/20 border-blue-500/30 text-blue-400"
                                                        : "bg-purple-900/20 border-purple-500/30 text-purple-400"
                                                )}>
                                                    {reg.type === 'GENERAL' ? 'GERAL' : 'PROFESSOR'}
                                                </span>
                                                <h2 className="font-press text-xs text-white">{reg.title}</h2>
                                            </div>

                                            {reg.teacherName && (
                                                <div className="flex items-center gap-2 text-purple-400">
                                                    <User size={14} />
                                                    <span className="font-vt323 text-xl">{reg.teacherName}</span>
                                                </div>
                                            )}

                                            <div className="bg-black/30 rounded-lg p-4 border border-slate-800/50">
                                                <p className="font-mono text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                                                    {reg.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-64 space-y-4">
                                            {(reg.blockedSkills.length > 0 || reg.blockedBenefits.length > 0) && (
                                                <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3">
                                                    <h3 className="font-press text-[8px] text-red-400 mb-2 flex items-center gap-2">
                                                        <Lock size={10} /> BLOQUEIOS
                                                    </h3>
                                                    <div className="flex flex-wrap gap-1">
                                                        {reg.blockedSkills.map(s => s && (
                                                            <span key={s} className="bg-red-900/20 text-red-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-900/30">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {reg.usageLimits.preventConsecutiveSameSkill && (
                                                <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-lg p-3">
                                                    <h3 className="font-press text-[8px] text-yellow-400 mb-1 flex items-center gap-2">
                                                        <AlertTriangle size={10} /> USO ÉTICO
                                                    </h3>
                                                    <p className="text-[9px] font-mono text-yellow-500/80">
                                                        Proibido uso consecutivo da mesma habilidade.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-[9px] font-press text-slate-600 pt-2">
                                                <Info size={10} />
                                                <span>ÚLTIMA ATUALIZAÇÃO: {reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </PixelCard>
                            </motion.div>
                        ))}

                        {filteredRegs.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-slate-900 rounded-2xl">
                                <p className="font-press text-[10px] text-slate-700">NENHUM REGULAMENTO ENCONTRADO</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
