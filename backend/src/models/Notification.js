const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['TRADE', 'SYSTEM', 'AUCTION', 'ACHIEVEMENT'], required: true },
    message: { type: String, required: true },
    link: { type: String }, // Ex: "/trade/view/123"
    data: { type: Object }, // Dados extras (id do trade, etc)
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 604800 } // Expira em 7 dias
});

module.exports = mongoose.model('Notification', NotificationSchema);