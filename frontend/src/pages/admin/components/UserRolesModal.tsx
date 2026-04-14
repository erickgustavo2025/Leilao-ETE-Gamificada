import React from 'react';
import { X, Check } from 'lucide-react';
import { PixelCard } from '../../../components/ui/PixelCard';
import { PixelButton } from '../../../components/ui/PixelButton';
import { cn } from '../../../utils/cn';
import { User, BADGE_CATALOG, CATEGORIES } from '../types';
import { motion } from 'framer-motion';

interface UserRolesModalProps {
    user: User;
    onClose: () => void;
    onSave: (id: string, roles: string[]) => void;
    isLoading: boolean;
    // Local state management passed down or handled here
    onToggleRole: (roleId: string) => void;
}

export const UserRolesModal: React.FC<UserRolesModalProps> = ({ user, onClose, onSave, isLoading, onToggleRole }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <PixelCard className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-vt323 text-2xl text-white">CARGOS & BADGES</h2>
                        <p className="font-press text-[7px] text-slate-500 uppercase mt-1">{user.nome}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className={cn('w-1.5 h-1.5 rounded-full bg-current', cat.color)} />
                                <h3 className={cn('font-press text-[9px] uppercase tracking-wider', cat.color)}>{cat.label}</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {BADGE_CATALOG.filter(b => b.group === cat.id).map(role => {
                                    const isActive = user.cargosEspeciais?.includes(role.id);
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => onToggleRole(role.id)}
                                            className={cn(
                                                'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all group relative overflow-hidden',
                                                isActive 
                                                    ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                                                    : 'bg-black/40 border-slate-800 hover:border-slate-700'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125',
                                                isActive ? 'bg-purple-400' : 'bg-slate-700'
                                            )} />
                                            <span className={cn(
                                                'font-press text-[8px] flex-1 leading-relaxed',
                                                isActive ? 'text-white font-bold' : 'text-slate-500'
                                            )}>
                                                {role.label}
                                            </span>
                                            {isActive && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check size={12} className="text-purple-400" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                    <PixelButton 
                        onClick={() => onSave(user._id, user.cargosEspeciais || [])} 
                        className="w-full bg-purple-600 shadow-lg shadow-purple-900/20" 
                        isLoading={isLoading}
                    >
                        SALVAR ALTERAÇÕES
                    </PixelButton>
                </div>
            </PixelCard>
        </div>
    );
}


