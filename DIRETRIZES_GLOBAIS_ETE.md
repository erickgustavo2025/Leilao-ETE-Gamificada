# 🏛️ DIRETRIZES GLOBAIS DA ETE GAMIFICADA (A CONSTITUIÇÃO)

**LEITURA OBRIGATÓRIA PARA QUALQUER DESENVOLVEDOR OU AGENTE DE IA.**
Este documento rege as leis absolutas de Arquitetura, Segurança e UI/UX do ecossistema ETE Gamificada. A violação destas regras resultará em rejeição imediata do código.

---

## 📱 1. UI/UX E FRONTEND (A LEI DA EXPERIÊNCIA)

### 1.1 Mobile-First é Inegociável
A maioria dos alunos acessa o sistema pelo celular no pátio da escola.
- **Design Base:** Desenhe todas as telas pensando no smartphone primeiro (`w-full`, `flex-col`, `p-4`).
- **Expansão:** Use os prefixos do Tailwind (`md:`, `lg:`) apenas para expandir a interface para monitores maiores.
- **Performance de Renderização:** Evite renderizar milhares de partículas animadas em telas de celular (ex: desative efeitos pesados do Framer Motion em telas menores usando hooks como `useIsMobile`).

### 1.2 A Lei do Cache (Extermínio do F5)
O sistema é uma SPA (Single Page Application) pura.
- **Proibido:** `window.location.reload()` ou `window.location.href = ...` para atualizar dados.
- **Obrigatório:** Mutações no banco de dados devem ser refletidas na tela utilizando `@tanstack/react-query` através do `queryClient.invalidateQueries()`. A navegação deve ser limpa e sem "piscar" a tela.
- **Exceções:** Apenas tratamento de `vite:preloadError` no `main.tsx` ou redirecionamentos de sessão (Erro 401) no `axios-config.ts`.

### 1.3 O Padrão Visual Absoluto
- **Imagens:** O formato `.png` ou `.jpg` é estritamente proibido. Toda imagem de item, badge ou artefato deve usar `.webp`.
- **Estilização:** O uso de CSS inline é desencorajado. Use estritamente Tailwind CSS e a função utilitária `cn()` para mesclar classes dinâmicas.

---

## 🛡️ 2. BACKEND E SEGURANÇA (A LEI DA DESCONFIANÇA)

### 2.1 Nunca Confie no Frontend
A interface visual é apenas uma ilusão. O usuário pode burlar botões desativados via DevTools.
- **Validação:** Verificações de saldo, permissões de cargo e limites de compra devem ocorrer SEMPRE no backend antes de qualquer inserção no banco de dados.
- **Sanitização XSS:** Todo texto livre enviado pelo usuário (ex: links de submissão, chat) deve ter tags HTML removidas diretamente no setter do Schema do Mongoose ou na validação do Controller.
- **Vazio não é Dado:** Em campos obrigatórios de String, o schema deve possuir `minlength: 1`. Strings vazias (`""`) não são válidas.

### 2.2 Segurança Global e Redes
- **Isolamento de Middlewares:** O `express-mongo-sanitize` não deve ser injetado de forma global na aplicação (`app.use()`), pois quebra os pacotes binários do `Socket.io`. Ele deve ser aplicado ESTRITAMENTE nas rotas da API (`app.use('/api', mongoSanitize())`).

---

## 💾 3. BANCO DE DADOS E ARQUITETURA (A LEI DA INTEGRIDADE)

### 3.1 Transações Atômicas e Concorrência
O sistema lida com economia virtual (PC$) que afeta a vida acadêmica real.
- **Sessões Mongoose:** Qualquer fluxo que debite PC$ ou modifique mais de um documento simultaneamente DEVE usar `session.startTransaction()`.
- **Prevenção de Race Condition:** Para debitar saldos, não use `user.saldoPc -= valor; user.save()`. Use OBRIGATORIAMENTE operações atômicas (`bulkWrite` ou `updateOne`) acompanhadas do filtro de segurança: `{ saldoPc: { $gte: valor_do_debito } }`.

### 3.2 O Princípio DRY (Don't Repeat Yourself)
- Lógicas repetidas (como a entrega de recompensas, verificação de hierarquia ou cálculo de experiência) devem ser isoladas na pasta `backend/src/utils/` e importadas pelos controllers.

### 3.3 A Fonte da Verdade
- Os arquivos do banco de dados (Mongoose Collections) mandam. Nenhum arquivo `hardcoded` de configuração no backend deve sobrescrever os dados persistidos no banco.
- **Enums Estritos:** Respeite a tipagem do Schema. Exemplo: Itens enviados para a `roomInventory` da `Classroom` devem obrigatoriamente ter a tag `origin: 'PREMIO'`.

---

## 💼 4. REGRAS DE NEGÓCIO E GAMIFICAÇÃO (A LEI DO JOGO)

### 4.1 A Economia Única
- A única métrica de progressão e moeda de troca da ETE Gamificada é o **PC$** (Pontos de Conhecimento).
- Não existe conceito paralelo de "XP" ou "Levels" dissociados do PC$. O Rank do aluno (`Iniciante`, `Bronze`, `Lendário`) é calculado com base no `maxPcAchieved` (Maior saldo de PC$ alcançado na vida do aluno, ignorando o quanto ele gastou na loja).

### 4.2 Justiça Social e Rateios
- **Compras Coletivas (Beco Diagonal):** O rateio de benefícios para a turma nunca é dividido igualmente. Usa-se o cálculo proporcional à riqueza de cada aluno (Método do Maior Resto) para garantir que quem possui mais dinheiro virtual pague a maior parcela da compra.