// frontend/src/components/features/AIWidget/index.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, X, Send, MessageSquare, Plus, Clock, 
    ChevronLeft, BrainCircuit 
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { api } from '../../../api/axios-config';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '../../../utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Message {
    role: 'user' | 'ai';
    content: string;
    interactionId?: string;
    modo?: string;
}

interface SessionSummary {
    _id: string;
    title: string;
    updatedAt: string;
    lastMessage: string;
}

export function AIWidget() {
    const { signed } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'chat' | 'sessions'>('chat');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Olá! Sou o Oráculo GIL. Como posso ajudar na sua jornada hoje? 🔮' }
    ]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── BUSCAR SESSÕES
    const { data: sessions = [], refetch: refetchSessions } = useQuery<SessionSummary[]>({
        queryKey: ['ai-sessions'],
        queryFn: async () => {
            const res = await api.get('/ai/sessions');
            return res.data;
        },
        enabled: signed && isOpen
    });

    // ── ENVIAR PERGUNTA
    const askMutation = useMutation({
        mutationFn: async (pergunta: string) => {
            const res = await api.post('/ai/ask', {
                pergunta,
                paginaOrigem: location.pathname,
                sessionId: currentSessionId
            });
            return res.data;
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: data.resposta,
                modo: data.modo,
                interactionId: data.interactionId
            }]);
            if (!currentSessionId) {
                setCurrentSessionId(data.sessionId);
                queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
            }
        }
    });

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, askMutation.isPending]);

    const handleSend = () => {
        if (!input.trim() || askMutation.isPending) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        askMutation.mutate(userMsg);
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{ role: 'ai', content: 'Nova conversa iniciada. O que posso fazer por você? 🔮' }]);
        setView('chat');
    };

    const handleLoadSession = async (sessionId: string) => {
        try {
            const res = await api.get(`/ai/sessions/${sessionId}`);
            const history: Message[] = res.data.map((m: any) => ({
                role: m.role,
                content: m.content,
            }));
            setMessages(history.length > 0 ? history : [{
                role: 'ai', content: 'Continuando nossa conversa... 🔮'
            }]);
            setCurrentSessionId(sessionId);
            setView('chat');
        } catch (err) {
            console.error("Erro ao carregar sessão:", err);
        }
    };

    const isPublicPath = (path: string) => {
        const publics = ['/login', '/maintenance', '/first-access', '/forgot-password', '/reset-password'];
        return publics.some(p => path.startsWith(p)) || path === '/';
    };

    if (!signed || isPublicPath(location.pathname)) return null;

    return (
        <>
            {/* ── BOTÃO FLUTUANTE — canto inferior ESQUERDO ── */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-[150] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: isOpen
                        ? '0 0 30px rgba(124,58,237,0.7)'
                        : '0 0 15px rgba(124,58,237,0.4)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: isOpen
                        ? '0 0 30px rgba(124,58,237,0.6)'
                        : ['0 0 12px rgba(124,58,237,0.3)', '0 0 24px rgba(124,58,237,0.6)', '0 0 12px rgba(124,58,237,0.3)']
                }}
                transition={{ repeat: isOpen ? 0 : Infinity, duration: 2.5 }}
                aria-label="Abrir Oráculo GIL"
            >
                <AnimatePresence mode="wait">
                    {isOpen
                        ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={22} className="text-white" />
                          </motion.div>
                        : <motion.div key="spark" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Sparkles size={22} className="text-white" />
                          </motion.div>
                    }
                </AnimatePresence>
            </motion.button>

            {/* ── CHAT BOX — abre para CIMA e para a DIREITA do botão ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="fixed bottom-24 left-6 z-[149] flex rounded-2xl overflow-hidden"
                        style={{
                            width: view === 'sessions' ? '520px' : '360px',
                            maxWidth: 'calc(100vw - 1.5rem)',
                            height: '600px',
                            maxHeight: '72vh',
                            background: 'rgba(7, 7, 26, 0.94)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            boxShadow: '0 0 40px rgba(124,58,237,0.18), inset 0 0 40px rgba(124,58,237,0.03)',
                            transition: 'width 0.25s ease',
                        }}
                    >
                        {/* ── SIDEBAR DE SESSÕES ── */}
                        <AnimatePresence>
                            {view === 'sessions' && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 200, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="border-r border-purple-500/20 flex flex-col overflow-hidden"
                                    style={{ minWidth: 200 }}
                                >
                                    <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
                                        <span className="font-press text-[8px] text-purple-400 uppercase tracking-widest">Histórico</span>
                                        <button onClick={handleNewChat} className="p-1 hover:bg-purple-500/20 rounded text-purple-300 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {sessions.map(s => (
                                            <button
                                                key={s._id}
                                                onClick={() => handleLoadSession(s._id)}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-[11px] font-mono hover:bg-purple-500/10 transition-colors border-b border-white/5",
                                                    currentSessionId === s._id && "bg-purple-500/15 text-purple-300"
                                                )}
                                            >
                                                <p className="text-slate-200 truncate font-bold mb-1">{s.title || 'Conversa'}</p>
                                                <div className="flex items-center gap-1 text-slate-500 text-[9px]">
                                                    <Clock size={10} />
                                                    {new Date(s.updatedAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <p className="text-slate-600 text-[9px] truncate mt-1 italic">{s.lastMessage}</p>
                                            </button>
                                        ))}
                                        {sessions.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-40 opacity-30">
                                                <MessageSquare size={24} className="mb-2" />
                                                <p className="text-[9px] font-mono">Sem histórico</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-3 text-[8px] text-slate-600 font-mono text-center border-t border-white/5 bg-black/20">
                                        Memória de 7 dias ativada 🧠
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── ÁREA DO CHAT ── */}
                        <div className="flex flex-col flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-500/20 shrink-0 bg-purple-500/5">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center border border-purple-500/40">
                                        <BrainCircuit size={18} className="text-purple-300" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#07071a] animate-pulse" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-press text-[9px] text-purple-100 uppercase tracking-widest truncate">Oráculo GIL</h3>
                                    <p className="text-[8px] text-purple-400/70 font-mono truncate">Inteligência Artificial ETE</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setView(v => v === 'sessions' ? 'chat' : 'sessions'); refetchSessions(); }}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            view === 'sessions' ? 'bg-purple-500/30 text-purple-200' : 'text-slate-500 hover:text-purple-300 hover:bg-purple-500/10'
                                        )}
                                        title="Histórico de conversas"
                                    >
                                        {view === 'sessions' ? <ChevronLeft size={16} /> : <MessageSquare size={16} />}
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Mensagens */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
                                {messages.map((msg, i) => (
                                    <ChatBubble key={i} message={msg} />
                                ))}
                                {askMutation.isPending && <TypingIndicator />}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-purple-500/20 bg-black/20">
                                <div className="relative flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Pergunte ao Oráculo..."
                                        disabled={askMutation.isPending}
                                        className="flex-1 bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 placeholder:text-slate-700 disabled:opacity-50 transition-all"
                                        maxLength={1000}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || askMutation.isPending}
                                        className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:shadow-none active:scale-95"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-[8px] text-slate-700 font-mono mt-2 text-center uppercase tracking-tighter">
                                    Powered by OpenRouter • Qwen 3.6 Plus
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
