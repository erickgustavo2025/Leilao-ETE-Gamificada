const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreItem' },
    itemNome: { type: String, required: true },
    itemDescricao: String,
    itemImagem: String,
    itemRaridade: String,
    itemExpiresAt: Date,
    tipo: { 
        type: String, 
        enum: ['personal_item', 'room_item'], 
        default: 'personal_item' 
    },
    classroomOrigin: { type: String },
    hash: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['PENDENTE', 'USADO', 'CANCELADO'],
        default: 'PENDENTE'
    },
    validadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dataUso: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);