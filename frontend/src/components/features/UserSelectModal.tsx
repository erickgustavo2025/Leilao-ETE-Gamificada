import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, X } from 'lucide-react';
import { api } from '../../api/axios-config';
import { PixelCard } from '../ui/PixelCard';
import { PixelButton } from '../ui/PixelButton';
import { toast } from 'sonner';

interface UserSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserSelected: (user: any) => void;
}

export function UserSelectModal({ isOpen, onClose, onUserSelected }: UserSelectModalProps) {
    const [matricula, setMatricula] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matricula) return;
        
        setLoading(true);
        try {
            // Rota de busca de usuário (deve estar em userRoutes)
            const userRes = await api.get(`/users/find/${matricula}`);
            
            // Valida se achou
            if (userRes.data && userRes.data._id) {
                onUserSelected(userRes.data);
                // Não fechamos aqui, quem fecha é o componente pai quando recebe o user
                // Mas podemos limpar o campo
                setMatricula('');
            } else {
                toast.error("Aluno não encontrado.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar aluno. Verifique a matrícula.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                    <PixelCard className="w-full max-w-sm bg-slate-900 border-2 border-cyan-500 relative">
                        <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={20}/></button>
                        <h2 className="font-vt323 text-3xl text-cyan-400 mb-4 text-center">INICIAR TROCA</h2>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className="font-press text-[10px] text-slate-500 mb-1 block">MATRÍCULA DO ALUNO</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={matricula}
                                        onChange={e => setMatricula(e.target.value)}
                                        className="w-full bg-black border border-slate-700 pl-10 p-3 text-white font-mono focus:border-cyan-500 outline-none rounded"
                                        placeholder="Ex: 2023100"
                                    />
                                </div>
                            </div>
                            <PixelButton type="submit" isLoading={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                                <Search size={16} className="mr-2"/> BUSCAR ALUNO
                            </PixelButton>
                        </form>
                    </PixelCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}