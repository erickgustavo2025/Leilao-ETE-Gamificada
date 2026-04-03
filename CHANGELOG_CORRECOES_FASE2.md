# 📑 CHANGELOG - CORREÇÕES OBRIGATÓRIAS FASE 2

Este documento detalha as correções críticas de infraestrutura e vazamento de memória aplicadas na **Fase 2** do projeto **ETE Gamificada**, conforme auditoria do Lead Architect.

---

## 🔴 1. Bug Crítico: Double-Save no Banco de Dados
- **Arquivo:** `backend/src/utils/questRewards.js`
- **Problema:** A função `deliverQuestRewards` estava chamando `await user.save();`, resultando em duas gravações consecutivas no mesmo documento do usuário quando os controllers (`validateSecretCode` e `approveQuest`) também chamavam `user.save()`. Isso gerava um risco de Race Condition e travamento do Mongoose.
- **Solução:** Removido o `await user.save();` de dentro de `deliverQuestRewards`. Agora, o utilitário apenas muta o objeto `user` em memória, e a responsabilidade de persistir as alterações no banco de dados (`user.save()`) recai exclusivamente sobre os controllers que invocam `deliverQuestRewards`.

## 🔴 2. Bug Crítico: Exportação de Rotas Inválida
- **Arquivo:** `backend/src/routes/adminQuestRoutes.js`
- **Problema:** As rotas de aprovação e rejeição (`/approvals`, etc.) estavam definidas após a linha `module.exports = router;`, o que causava um comportamento inconsistente e problemas com linters/bundlers.
- **Solução:** A linha `module.exports = router;` foi movida para a **última linha** do arquivo, garantindo que todas as rotas sejam devidamente anexadas ao objeto `router` antes de ser exportado.

## 🟡 3. Lacuna de Lógica: Índice e Auditoria no QuestSubmission
- **Arquivo:** `backend/src/models/QuestSubmission.js`
- **Problema de Índice:** O índice único anterior (`partialFilterExpression: { status: "PENDING" }`) permitia que um aluno submetesse novamente uma missão que já havia sido aprovada, o que poderia levar a recompensas duplicadas em caso de erro.
- **Solução de Índice:** O `partialFilterExpression` foi alterado para `partialFilterExpression: { status: { $in: ["PENDING", "APPROVED"] } }`. Isso garante que um aluno não possa ter mais de uma submissão pendente ou aprovada para a mesma missão, prevenindo ganhos de XP/recompensas indevidos.
- **Problema de Auditoria:** Faltava um campo para registrar a data e hora da revisão da submissão.
- **Solução de Auditoria:** Adicionado o campo `reviewedAt: { type: Date, default: null }` ao `QuestSubmissionSchema`.

## 🟡 4. Lacuna de Validação: Conteúdo Vazio
- **Arquivo:** `backend/src/models/QuestSubmission.js`
- **Problema:** O campo `submissionContent` era `required: true`, mas o MongoDB aceita strings vazias (`""`) como válidas, o que permitia submissões sem conteúdo relevante.
- **Solução:** Adicionada a validação `minlength: [1, 'O conteúdo não pode ser vazio']` ao campo `submissionContent` no schema. Isso garante que o conteúdo da submissão tenha pelo menos um caractere, forçando o aluno a fornecer alguma informação.

## 🔄 Atualização dos Controllers
- **Arquivos:** `backend/src/controllers/adminQuestController.js` e `backend/src/controllers/questController.js`
- **Descrição:** As funções `approveQuest` e `rejectQuest` em `adminQuestController.js` foram atualizadas para registrar a data e hora da revisão no novo campo `submission.reviewedAt = new Date();` antes de salvar a submissão.
- **Descrição:** A mensagem de erro em `questController.js` para submissões duplicadas foi atualizada para refletir o novo comportamento do índice, informando que o aluno já possui uma solicitação 
