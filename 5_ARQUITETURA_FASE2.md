# ARQUITETURA FASE 2: O SISTEMA DE SUBMISSÕES (QuestSubmission)

## 🏗️ O Novo Model: `backend/src/models/QuestSubmission.js`
Crie a coleção `QuestSubmission`. Isso resolve o antigo problema O(n*m) do banco de dados, permitindo buscar tudo com um único `.populate('studentId questId')`.
- `studentId`: ObjectId (Ref: User)
- `questId`: ObjectId (Ref: Quest)
- `status`: Enum ['PENDING', 'APPROVED', 'REJECTED'] (Default: 'PENDING')
- `submissionContent`: String (Com setter no schema para remover tags: `set: (v) => v?.replace(/<[^>]*>/g, '').trim()`, maxlength: 2000)
- `reviewedBy`: ObjectId (Ref: Admin) - Nullable
- `submittedAt`: Date (Default: Date.now)

**⚠️ REGRA DE OURO (ÍNDICE COMPOSTO):** Para evitar que o aluno clique duas vezes e burle o sistema, adicione OBRIGATORIAMENTE este índice no schema:
`QuestSubmissionSchema.index({ studentId: 1, questId: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });`

## 🧩 O Princípio DRY (Don't Repeat Yourself)
A lógica de entregar Loot (PC$, itens, buffs) está duplicada em `validateSecretCode` e `approveQuest`. 
Crie um arquivo `backend/src/utils/questRewards.js` exportando a função `async function deliverQuestRewards(user, quest)`. Extraia a lógica de entrega para lá e faça os dois controllers importarem e usarem essa função.