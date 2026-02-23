// ARQUIVO: frontend/src/components/features/ChatWidget.tsx

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Users, Gavel, Minimize2, Store, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket } from '../../services/socket';
import { PixelCard } from '../ui/PixelCard';
import { getImageUrl } from '../../utils/imageHelper';
import { cn } from '../../utils/cn';
import { useLocation } from 'react-router-dom';
import { StudentProfilePopup } from './StudentProfilePopup';

interface Message {
    id: string;
    text: string;
    sender: {
        _id: string;      // ✅ FIX: backend manda _id, não id
        nome: string;
        role: string;
        avatar?: string;
        turma?: string;
    };
    timestamp: string;
}

export function ChatWidget() {
    const { user } = useAuth();
    const location = useLocation();
    const socket = getSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeRoom, setActiveRoom] = useState('global');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleOpenProfile = (senderId: string) => {
        if (!senderId) return; // guarda contra undefined
        setProfileStudentId(senderId);
        setIsProfileOpen(true);
    };

    useEffect(() => {
        if (location.pathname.includes('/leilao')) {
            handleSwitchRoom('auction');
        } else if (location.pathname.includes('/market')) {
            if (location.state?.tradeId) {
                handleSwitchRoom(`trade_${location.state.tradeId}`);
                if (!isOpen) setIsOpen(true);
            } else {
                handleSwitchRoom('market');
            }
        } else {
            handleSwitchRoom('global');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    useEffect(() => {
        if (!user) return;
        if (!socket.connected) socket.connect();

        if (activeRoom === 'global' && !location.pathname.includes('/leilao') && !location.pathname.includes('/market')) {
            socket.emit('join_chat_room', { room: 'global', user });
        }

        const onMessage = (msg: Message) => {
            setMessages((prev) => {
                const newHistory = [...prev, msg];
                if (newHistory.length > 100) return newHistory.slice(newHistory.length - 100);
                return newHistory;
            });
            scrollToBottom();
            if (!isOpen) setUnreadCount(prev => prev + 1);
        };

        const onHistory = (history: Message[]) => {
            setMessages(history);
            scrollToBottom();
        };

        socket.on('receive_message', onMessage);
        socket.on('chat_history', onHistory);

        return () => {
            socket.off('receive_message', onMessage);
            socket.off('chat_history', onHistory);
        };
    }, [user, isOpen, socket, activeRoom]);

    const handleSwitchRoom = (room: string) => {
        if (activeRoom === room) return;
        socket.emit('leave_chat_room', activeRoom);
        setActiveRoom(room);
        setMessages([]);
        if (user) socket.emit('join_chat_room', { room, user });
    };

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !user) return;
        socket.emit('send_message', {
            room: activeRoom,
            message,
            user: {
                _id: user._id,
                nome: user.nome,
                role: user.role,
                avatar: user.avatar,
                turma: user.turma
            }
        });
        setMessage('');
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const getRoomConfig = () => {
        if (activeRoom === 'global') return { label: 'GLOBAL', icon: Users, color: 'text-blue-400' };
        if (activeRoom === 'auction') return { label: 'CASA DE LEILÕES', icon: Gavel, color: 'text-yellow-400' };
        if (activeRoom === 'market') return { label: 'MERCADO PÚBLICO', icon: Store, color: 'text-cyan-400' };
        if (activeRoom.startsWith('trade_')) return { label: 'NEGOCIAÇÃO PRIVADA', icon: ArrowRightLeft, color: 'text-indigo-400' };
        return { label: activeRoom, icon: MessageSquare, color: 'text-slate-400' };
    };

    const roomConfig = getRoomConfig();
    const RoomIcon = roomConfig.icon;

    if (!user) return null;

    return (
        <>
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setIsOpen(true); setUnreadCount(0); scrollToBottom(); }}
                    className="fixed bottom-4 right-4 z-[90] w-14 h-14 bg-slate-900 border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] group"
                >
                    <MessageSquare className="text-blue-400 group-hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border border-slate-900 animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={cn(
                            "fixed right-4 z-[100] transition-all duration-300",
                            isMinimized ? "bottom-4 w-72" : "bottom-4 w-[90vw] md:w-96"
                        )}
                    >
                        <PixelCard className="p-0 overflow-hidden shadow-2xl bg-slate-900 border-2 border-slate-600">
                            <div
                                className="bg-slate-800/80 p-3 flex items-center justify-between cursor-pointer border-b border-slate-700"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full animate-pulse", socket.connected ? "bg-green-500" : "bg-red-500")}></div>
                                    <RoomIcon size={14} className={roomConfig.color} />
                                    <span className={cn("font-press text-[10px] uppercase tracking-wider", roomConfig.color)}>
                                        {roomConfig.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="text-slate-400 hover:text-white">
                                        <Minimize2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-slate-400 hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <>
                                    <div className="flex bg-slate-950/50 border-b border-slate-800">
                                        <button
                                            onClick={() => handleSwitchRoom('global')}
                                            className={cn("flex-1 py-2 text-[10px] font-press flex justify-center gap-1", activeRoom === 'global' ? "bg-blue-900/20 text-blue-400" : "text-slate-500 hover:text-white")}
                                        >
                                            <Users size={12} /> GLOBAL
                                        </button>
                                        {location.pathname.includes('/leilao') && (
                                            <button
                                                onClick={() => handleSwitchRoom('auction')}
                                                className={cn("flex-1 py-2 text-[10px] font-press flex justify-center gap-1", activeRoom === 'auction' ? "bg-yellow-900/20 text-yellow-400" : "text-slate-500 hover:text-white")}
                                            >
                                                <Gavel size={12} /> LEILÃO
                                            </button>
                                        )}
                                        {location.pathname.includes('/market') && !activeRoom.startsWith('trade_') && (
                                            <button
                                                onClick={() => handleSwitchRoom('market')}
                                                className={cn("flex-1 py-2 text-[10px] font-press flex justify-center gap-1", activeRoom === 'market' ? "bg-cyan-900/20 text-cyan-400" : "text-slate-500 hover:text-white")}
                                            >
                                                <Store size={12} /> MERCADO
                                            </button>
                                        )}
                                    </div>

                                    <div ref={scrollRef} className="h-[50vh] md:h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/50">
                                        {messages.length === 0 && (
                                            <p className="text-center text-slate-600 font-mono text-xs mt-10">
                                                Início do chat #{activeRoom.split('_')[0]}...
                                            </p>
                                        )}
                                        {messages.map((msg, idx) => {
                                            // ✅ FIX: usa _id (campo correto que o backend manda)
                                            const isMe = msg.sender._id === user._id;
                                            const showHeader = idx === 0 || messages[idx - 1].sender._id !== msg.sender._id;

                                            return (
                                                <div key={idx} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                                    {showHeader && !isMe && (
                                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                                            {/* ✅ FIX: msg.sender._id ao invés de msg.sender.id */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenProfile(msg.sender._id)}
                                                                className="flex items-center gap-2 active:opacity-50 transition-opacity"
                                                                style={{ WebkitTapHighlightColor: 'transparent' }}
                                                            >
                                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-black border border-slate-600">
                                                                    {msg.sender.avatar ? (
                                                                        <img src={getImageUrl(msg.sender.avatar)} alt="avt" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white text-[10px] font-press uppercase">
                                                                            {msg.sender.nome.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] font-press text-slate-400 uppercase">{msg.sender.nome.split(' ')[0]}</span>
                                                            </button>
                                                            {msg.sender.role === 'admin' && <span className="bg-red-500 text-white text-[8px] px-1 rounded font-press">ADM</span>}
                                                            {msg.sender.role === 'dev' && <span className="bg-green-500 text-black text-[8px] px-1 rounded font-press">DEV</span>}
                                                        </div>
                                                    )}

                                                    <div className={cn(
                                                        "max-w-[85%] px-3 py-2 rounded-lg font-vt323 text-lg leading-tight break-words relative shadow-sm",
                                                        isMe
                                                            ? "bg-blue-600 text-white rounded-tr-none"
                                                            : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                                                    )}>
                                                        {msg.text}
                                                        <div className="text-[8px] font-mono opacity-50 text-right mt-1">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <form onSubmit={sendMessage} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder={activeRoom.includes('trade') ? "Negocie aqui..." : "Digite sua mensagem..."}
                                            className="flex-1 bg-black/50 border border-slate-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none placeholder-slate-600 transition-colors"
                                            maxLength={200}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!message.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white p-2 rounded transition-colors shadow-lg active:scale-95"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </>
                            )}
                        </PixelCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <StudentProfilePopup
                isOpen={isProfileOpen}
                onClose={() => { setIsProfileOpen(false); setProfileStudentId(null); }}
                studentId={profileStudentId || undefined}
            />
        </>
    );
}
