const Notification = require('../models/Notification');

module.exports = {
    async getMyNotifications(req, res) {
        try {
            const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar notificações' });
        }
    },

    async markAsRead(req, res) {
        try {
            await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao marcar como lida' });
        }
    },

    // Função interna para criar e emitir (não é rota)
    async create(userId, type, message, data = {}) {
        try {
            const notif = await Notification.create({ user: userId, type, message, data });
            
            // Emite via Socket se o usuário estiver online
            if (global.io) {
                global.io.to(userId.toString()).emit('new_notification', notif);
            }
            return notif;
        } catch (error) {
            console.error("Erro ao criar notificação:", error);
        }
    }
};