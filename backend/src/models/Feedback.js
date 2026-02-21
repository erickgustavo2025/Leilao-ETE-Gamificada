const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nome: String, // Salvar o nome pra facilitar a leitura sem populate
  turma: String,
  tipo: {
    type: String,
    enum: ['sugestao', 'bug', 'erro', 'critica', 'elogio', 'outro'],
    required: true
  },
  mensagem: {
    type: String,
    required: true,
    maxlength: 1000 // Limite pra ninguém mandar a Bíblia
  },
  status: {
    type: String,
    enum: ['pendente', 'lido', 'resolvido'],
    default: 'pendente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);