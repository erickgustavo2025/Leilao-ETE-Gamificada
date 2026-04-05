// frontend/src/components/features/AIWidget/index.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/axios-config';
import { useAuth } from '../../../contexts/AuthContext';
import { Sparkles, X, Send, ChevronDown } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';

interface Message {
    role: 'user' | 'ai';
    content: string;
    interactionId?: string;
    modo?: string;
}

// Páginas onde o widget NÃO deve aparecer (login, landing, maintenance)
const HIDDEN_ON = ['/', '/login', '/maintenance', '/first-access', '/forgot-password', '/reset-password'];

export function AIWidget() {
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Olá! Sou o GIL, seu Oráculo. Pode me perguntar sobre o site, seus investimentos ou suas dúvidas de ENEM. 🔮' }
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Não renderizar em páginas públicas
    if (!user || HIDDEN_ON.includes(location.pathname)) return null;

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    const askMutation = useMutation({
        mutationFn: async (pergunta: string) => {
            const res = await api.post('/ai/ask', { pergunta, paginaOrigem: location.pathname });
            return res.data;
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.resposta,
                modo: data.modo,
                interactionId: data.interactionId
            }]);
        },
        onError: () => {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: 'Tive um problema técnico. Tente novamente em instantes.',
            }]);
        }
    });

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || askMutation.isPending) return;
        setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
        setInput('');
        askMutation.mutate(trimmed);
    };

    return (
        <>
            {/* ── BOTÃO FLUTUANTE ── */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: isOpen
                        ? '0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.3)'
                        : '0 0 15px rgba(124,58,237,0.4)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: isOpen
                    ? '0 0 30px rgba(124,58,237,0.6)'
                    : ['0 0 15px rgba(124,58,237,0.3)', '0 0 25px rgba(124,58,237,0.6)', '0 0 15px rgba(124,58,237,0.3)']
                }}
                transition={{ repeat: isOpen ? 0 : Infinity, duration: 2 }}
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

            {/* ── CHAT BOX ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 z-[149] w-[340px] md:w-[400px] flex flex-col rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(7, 7, 26, 0.92)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(124,58,237,0.4)',
                            boxShadow: '0 0 40px rgba(124,58,237,0.2), inset 0 0 40px rgba(124,58,237,0.03)',
                            maxHeight: '70vh',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                            <span className="font-press text-[9px] text-purple-300 uppercase tracking-widest">ORACULO GIL — ONLINE</span>
                            <button onClick={() => setIsOpen(false)} className="ml-auto p-1 text-slate-600 hover:text-white">
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '50vh' }}>
                            {messages.map((msg, i) => (
                                <ChatBubble key={i} message={msg} />
                            ))}
                            {askMutation.isPending && <TypingIndicator />}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-purple-500/20 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Pergunte ao Oráculo..."
                                disabled={askMutation.isPending}
                                className="flex-1 bg-black/40 border border-purple-500/30 rounded-xl px-3 py-2 text-white text-sm font-mono outline-none focus:border-purple-400 placeholder:text-slate-700 disabled:opacity-50"
                                maxLength={1000}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || askMutation.isPending}
                                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
