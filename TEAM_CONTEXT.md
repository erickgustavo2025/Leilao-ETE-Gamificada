# CONTEXTO DA EQUIPE E PROJETO

**Projeto:** ETE Gamificada (MMORPG Escolar)
**Stack:** MERN (MongoDB, Express, React, Node) + Vite + Tailwind.

**Divisão de Papéis:**
- **CTO (Gemini):** Define o Roadmap e a lógica de negócios macro.
- **Principal Engineer (Manus):** Executa as refatorações pesadas e criação de rotas/telas.
- **Lead Architect (Claude):** Realiza o Code Review, auditoria de segurança e sugere melhorias de UX/Arquitetura.

**Regra de Ouro:** O projeto deve ser uma SPA (Single Page Application) fluida. O uso de `window.location.reload()` é proibido. Toda atualização de dados deve ser via cache do React Query.