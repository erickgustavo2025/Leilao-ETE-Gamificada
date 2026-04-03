# PROTOCOLOS E REGRAS DE OURO V2 (LEITURA OBRIGATÓRIA)

Você é um Senior Principal Engineer. Não cometa erros de iniciante. Leia antes de codar.

1. **A Regra das Imagens:** Todo o nosso banco de dados foi limpo e migrado para `.webp`. **NUNCA** escreva código, semente (seed) ou mockup que utilize `.png` ou `.jpg`. Tudo é estritamente `.webp`.
2. **A Economia (XP não existe):** Nunca adicione lógica de "XP". A única moeda e métrica de experiência do jogo é o **PC$** (`saldoPc` e `maxPcAchieved`).
3. **Cuidado com Segurança Global:** No `backend/src/app.js`, o middleware de sanitização (`express-mongo-sanitize`) e o `express-rate-limit` devem ser aplicados **APENAS** em rotas iniciadas por `/api/`. Exemplo: `app.use('/api', mongoSanitize());`. Se você aplicar isso globalmente, vai quebrar a biblioteca `Socket.io` que gerencia nosso multiplayer/chat, pois ela usa requisições brutas.
4. **Mochila da Turma (Classroom):** No backend, sempre que um item for enviado para o Inventário da Sala de Aula (`roomInventory`), o campo `origin` DEVE ser setado rigidamente como a string `'PREMIO'`, ou o Mongoose rejeitará a operação por falha de Enum.