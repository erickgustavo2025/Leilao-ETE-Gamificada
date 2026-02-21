// ARQUIVO: backend/src/controllers/feedbackController.js
const Feedback = require('../models/Feedback');
const User = require('../models/User');

exports.createFeedback = async (req, res) => {
  try {
    const { tipo, mensagem } = req.body;
    
    // 🔧 CORREÇÃO CRÍTICA AQUI:
    // O authMiddleware salva o objeto user completo. O ID fica em _id.
    const userId = req.user._id; 

    const user = await User.findById(userId);

    if (!tipo || !mensagem) {
      return res.status(400).json({ message: 'Tipo e mensagem são obrigatórios.' });
    }

    const novoFeedback = await Feedback.create({
      userId,
      nome: user.nome,
      turma: user.turma,
      tipo,
      mensagem,
      status: 'pendente'
    });

    res.status(201).json({ message: 'Feedback enviado!', feedback: novoFeedback });
  } catch (error) {
    console.error('Erro feedback:', error);
    res.status(500).json({ message: 'Erro interno.' });
  }
};

exports.getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100);
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
};


exports.markAsResolved = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await Feedback.findByIdAndUpdate(
            id, 
            { status: 'resolvido' },
            { new: true } // Retorna o item atualizado
        );
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};


exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        await Feedback.findByIdAndDelete(id);
        res.json({ message: 'Feedback removido' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar' });
    }
};