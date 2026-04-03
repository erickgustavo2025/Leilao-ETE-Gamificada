const mongoose = require("mongoose");

const QuestSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quest",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  submissionContent: {
    type: String,
    required: true,
    minlength: [1, "O conteúdo não pode ser vazio"], // 🛡️ Evita strings vazias ""
    set: (v) => v?.replace(/<[^>]*>/g, "").trim(), // Remove tags HTML e espaços
    maxlength: 2000,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Pode ser Admin ou Monitor
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null, // 🕒 Auditoria: Quando a missão foi processada
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// ⚠️ REGRA DE OURO (ÍNDICE COMPOSTO): Bloqueia resubmissões se houver uma PENDING ou APPROVED
QuestSubmissionSchema.index(
  { studentId: 1, questId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: { $in: ["PENDING", "APPROVED"] } } 
  }
);

module.exports = mongoose.model("QuestSubmission", QuestSubmissionSchema);
