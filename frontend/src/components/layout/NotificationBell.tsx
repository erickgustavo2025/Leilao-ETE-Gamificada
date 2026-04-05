import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- IMPORTANTE
import { Bell, X, Check, MessageSquare, AlertCircle, Coins, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/axios-config';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket } from '../../services/socket';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';
import { PixelCard } from '../ui/PixelCard';

export const openTradeEvent = (tradeId: string) => {
    const event = new CustomEvent('openTradeModal', { detail: tradeId });
    window.dispatchEvent(event);
};

const getIcon = (type: string) => {
    switch (type) {
        case 'TRADE': return <Coins className="text-yellow-400" size={20} />;
        case 'SYSTEM': return <AlertCircle className="text-blue-400" size={20} />;
        case 'ACHIEVEMENT': return <Trophy className="text-purple-400" size={20} />;
        default: return <MessageSquare className="text-slate-400" size={20} />;
    }
};

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const socket = getSocket();

    useEffect(() => {
        if (user) {
            if (!socket.connected) socket.connect();
            socket.emit('join_user_room', user._id);

            fetchNotifications();

            const handleNewNotification = (notif: any) => {
                setNotifications(prev => [notif, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                if (!isOpen) {
                    toast.info("Nova Notificação", { description: notif.message });
                }
            };

            socket.on('new_notification', handleNewNotification);

            return () => {
                socket.off('new_notification', handleNewNotification);
            };
        }
    }, [user, isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/users/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/users/notifications/read');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("Tudo limpo!");
        } catch (e) {
            console.error(e);
        }
    };

    const handleClickNotification = async (notif: any) => {
        setIsOpen(false);
        if (notif.type === 'TRADE' && notif.data?.tradeId) {
            openTradeEvent(notif.data.tradeId); 
        }
    };

    // Componente do Modal Isolado
    const NotificationModal = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 md:pt-24 p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md"
                    >
                        <PixelCard className="w-full bg-slate-900 border-2 border-slate-600 shadow-2xl relative overflow-hidden" color="#64748b">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                                <h3 className="font-vt323 text-2xl text-white flex items-center gap-2">
                                    <Bell size={20} className="text-yellow-400"/> CENTRAL DE AVISOS
                                </h3>
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllAsRead} 
                                            className="text-[10px] font-press bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/50 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <Check size={10} /> LER TUDO
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Lista */}
                            <div className="max-h-[60vh] overflow-y-auto bg-slate-950/50 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center flex flex-col items-center opacity-50">
                                        <Bell size={48} className="mb-2 text-slate-600" />
                                        <p className="font-vt323 text-xl text-slate-500">NENHUMA NOTIFICAÇÃO</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <motion.div 
                                            key={notif._id}
                                            layout
                                            onClick={() => handleClickNotification(notif)}
                                            className={cn(
                                                "p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all flex gap-3 items-start group",
                                                !notif.read ? "bg-blue-900/10 border-l-4 border-l-blue-500" : "opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-lg bg-slate-900 border border-slate-700 group-hover:border-slate-500 transition-colors", !notif.read && "animate-pulse")}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("font-vt323 text-xl leading-none mb-1", !notif.read ? "text-white" : "text-slate-400")}>
                                                    {notif.message}
                                                </p>
                                                <p className="font-mono text-[10px] text-slate-500 flex justify-between">
                                                    <span>{notif.type}</span>
                                                    <span>{new Date(notif.createdAt).toLocaleTimeString()} - {new Date(notif.createdAt).toLocaleDateString()}</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </PixelCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* BOTÃO DO SINO (Renderizado no lugar normal) */}
            <button 
                onClick={() => setIsOpen(true)} 
                className="relative p-2 text-slate-400 hover:text-white transition-colors group"
            >
                <Bell size={24} className="group-hover:animate-swing" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg border border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* MODAL VIA PORTAL (Renderizado no Body, fora de qualquer overflow:hidden) */}
            {createPortal(NotificationModal, document.body)}
        </>
    );
}