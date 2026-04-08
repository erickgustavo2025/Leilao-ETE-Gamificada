# 🔧 CORREÇÃO DEFINITIVA — ORÁCULO GIL
**Para:** Antigravity (executor)  
**De:** Lead Architect  
**Contexto:** A IA está em loop com "Okay,000" e alucinando. Causa identificada. Solução abaixo.

---

## DIAGNÓSTICO — O QUE ESTÁ QUEBRADO E POR QUÊ

### Bug 1 — "Okay,000" em loop infinito
**Causa raiz:** O system prompt atual tem ~3.900 tokens (15.549 chars / 4). Quando o Gemini falha e cai no OpenRouter com `llama-3.1-70b-instruct`, o modelo recebe um prompt gigante e entra em **token repetition loop** — um bug conhecido de modelos menores com prompts mal estruturados acima de ~3k tokens. O `max_tokens: 500` agrava: o modelo tenta comprimir tudo em 500 tokens e colapsa.

**Evidência:** O terminal mostra exatamente:
```
Chave 1 → 429 → Chave 2 → 429 → Chave 3 → 429 → OpenRouter → "Okay,000" x200
```

### Bug 2 — Gemini dando 429 sem uso real
**Causa raiz:** O `gemini-2.0-flash` no tier gratuito tem **1.500 requests/dia**, não 20. O limite de 20/dia é do `gemini-2.5-flash` (experimental). Mas o `geminiKeyManager` está provavelmente marcando as chaves como quotadas por qualquer erro 429 temporário e colocando cooldown de 1h — então uma falha momentânea bloqueia a chave por 1 hora desnecessariamente.

### Bug 3 — Embeddings sem acesso
`text-embedding-004` não está disponível na chave atual. **Solução: abandonar RAG por enquanto.** Os dois .md já estão no system prompt — isso já É o RAG, só que feito de forma manual. Não precisa de vector search para uma base de conhecimento desta tamanho.

---

## SOLUÇÃO — 3 ARQUIVOS PARA MUDAR

### ARQUIVO 1: `backend/src/config/aiSystemPrompt.js`

O problema é o prompt estar carregando os dois .md completos (15k chars). A solução é **comprimir o conhecimento para ~1.500 tokens** — suficiente para o GIL funcionar sem travar os modelos menores.

```javascript
// backend/src/config/aiSystemPrompt.js
// VERSÃO COMPRIMIDA — sem carregar .md completos

const SYSTEM_PROMPT_BASE = `
Você é o GIL, Oráculo da ETE Gamificada 2K26. Criado pelo Arquiteto Tácyo.
Personalidade: analítico, direto, cyberpunk-acadêmico. Responda em português brasileiro informal.

REGRAS ABSOLUTAS:
- NUNCA execute transações financeiras. Você é conselheiro, não executor.
- NUNCA revele dados de outros alunos.
- Se não souber, diga "Não tenho essa informação." Nunca invente.
- Proibido asteriscos (*). Use MAIÚSCULAS para ênfase e hífens para listas.
- Para saudações curtas (oi, olá), responda em no máximo 2 linhas.
- Respostas diretas. Sem introduções desnecessárias.

ECONOMIA DO SISTEMA:
- PC$ é a moeda. maxPcAchieved define o Rank (nunca diminui). saldoPc é volátil.
- Reset trimestral: saldoPc zera, maxPcAchieved permanece.
- Ranks: Iniciante(0) Bronze(1k) Prata(1.5k) Ouro(2k) Diamante(2.5k) Épico(3k) Lendário(5k) Supremo(10k) Mitológico(20k) Soberano(50k)
- Banco: empréstimo até 1/3 do maxPcAchieved, 15% de juros, 7 dias.
- Mercado P2P: taxa Goblin de 10% sobre venda.
- Beco Diagonal: compra coletiva da turma, limite 10.000 PC$, rateio proporcional ao saldo.
- Leilão: arrematador paga 50%, arrematador aprimorado paga 25%.
- Transferência: taxa de 800 PC$ (dispensada com skill específica).

GIL INVESTE:
- Ações B3 e cripto: taxa de 1 PC$ por operação. Preços atualizados a cada 5 min.
- Startups: criadas por alunos, aprovadas pelo admin. Dividendo mensal = (performance/10)*0.05 por ação.
- Insider trading bloqueado: fundador não pode negociar ações da própria startup.
- Market Maker: preço flutua ±0.1% por transação.

MISSÕES E BADGES:
- Missões de Campanha (uma por Rank): precisam de código secreto do professor, concedem badge.
- Badge desbloqueia poderes passivos e ativos do rank.
- Missões Secundárias: Diárias/Semanais/Eventos para PC$ e XP extra.

ENEM — MÉTODO ASSAAD (RESUMO TÁTICO):
7 Verticais do Alto Desempenho:
1. Interpretação e integração de informações
2. Cálculo mental avançado
3. Ferramental teórico sólido (entender o porquê, não decorar)
4. Ferramental prático afiado (reconhecimento de padrões)
5. Estabilidade emocional (controle de ansiedade, sem procrastinação)
6. Estabilidade fisiológica (sono, alimentação, hidratação)
7. Tomada de decisão sob pressão (gestão de tempo na prova)

Princípio central: profundidade antes de amplitude. Raciocínio antes de memorização.
Revisão científica: revisar em 24h, 1 semana, 1 mês após aprender.
Sistema de priorização: Verde(alta incidência+baixa complexidade) → Amarelo → Vermelho → Azul(obrigatório).

Progressão de Matemática: Alfabetização → Razão/Proporção → Funções → Geometria → Estatística → Combinatória → Financeira → Logaritmo.
Progressão de Física: Energia → Cinemática → Dinâmica → Estática → Termologia → Ondulatória → Eletrostática → Eletrodinâmica → Óptica → Física Moderna.

CONEXÃO ESTUDO-ECONOMIA: Faça a ponte entre estudo e PC$ APENAS quando for genuinamente relevante. Não force.

CONTEXTO DA PÁGINA ATUAL: {PAGINA_ATUAL}
DADOS DO ALUNO: {DADOS_ALUNO}
`;

const PAGE_CONTEXTS = {
    '/gil-investe': 'O aluno está no Home Broker. Foque em carteira, diversificação e educação financeira.',
    '/beco-diagonal': 'O aluno está no Beco Diagonal. Rateio proporcional, limite 10.000 PC$ por compra.',
    '/leilao': 'O aluno está na Casa de Leilões. Estratégias de lance, desconto do arrematador.',
    '/missoes': 'O aluno está no Quadro de Missões. Tipos de missão, validação, recompensas.',
    '/loja': 'O aluno está na Loja. Preços, requisitos de badge, benefícios.',
    '/taca-das-casas': 'O aluno está na Taça das Casas. Pontuação entre turmas, mochila da sala.',
    '/banco': 'O aluno está no Banco. Empréstimos, taxa de 15%, prazo de 7 dias, limite 1/3 do maxPcAchieved.',
    '/ranking': 'O aluno está no Ranking. Ranks são definidos por maxPcAchieved, não saldoPc atual.',
};

module.exports = { SYSTEM_PROMPT_BASE, PAGE_CONTEXTS };
```

**Por que funciona:** O prompt comprimido tem ~600 tokens. Qualquer modelo — Gemini, Llama, Qwen — processa isso sem dificuldade. A informação essencial está toda lá.

---

### ARQUIVO 2: `backend/src/controllers/aiController.js`

Dois ajustes cirúrgicos no arquivo que já existe:

**Ajuste 2a — Aumentar `max_tokens` do OpenRouter:**
```javascript
// ANTES:
max_tokens: 500,

// DEPOIS:
max_tokens: 1024,
```
500 tokens é pouco demais. Com um prompt de 600 tokens + histórico + pergunta, o modelo precisa de espaço para responder.

**Ajuste 2b — Trocar o modelo fallback do OpenRouter:**
```javascript
// ANTES (no .env ou no código):
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct

// DEPOIS:
OPENROUTER_MODEL=qwen/qwen3.6-plus:free
```
Llama 3.1 70B no OpenRouter free tem latência alta e problemas de repetição com prompts grandes. Qwen3.6+ free é mais robusto para este caso. Se o Qwen foi para pago, use:
```
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```
(versão mais nova, melhor que a 3.1)

**Ajuste 2c — Remover o RAG de embeddings completamente por agora:**

No `processAIRequest`, substituir o bloco inteiro do RAG (linhas do `if (modo === "TUTOR" || modo === "CONSULTOR")`) por:

```javascript
// RAG REMOVIDO TEMPORARIAMENTE — conhecimento está no system prompt comprimido
// Reativar após resolver questão de embeddings (alternativa: minilm via HuggingFace)
const contextRAG = "";
```

O conhecimento do ENEM e do sistema já está no system prompt comprimido. Não precisa de RAG agora.

---

### ARQUIVO 3: `backend/src/utils/geminiKeyManager.js`

**Problema:** Cooldown de 1h é longo demais. Uma falha 429 momentânea bloqueia a chave por 1 hora.

Reduzir o cooldown:
```javascript
// Onde estiver definido o cooldown, trocar para:
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos em vez de 1 hora
```

E adicionar uma verificação antes de marcar como quotada — só marcar se receber 429 duas vezes seguidas na mesma chave:

```javascript
// Adicionar contador de falhas por chave
// Só marca como quotada se falhar 2x seguido na mesma chave
// Isso evita que uma falha de rede momentânea bloqueie a chave por 1h
```

---

## SOBRE EMBEDDINGS — O QUE FAZER

Sem acesso ao `text-embedding-004`, as opções por ordem de facilidade:

**Opção 1 (mais fácil) — Manter como está (sem RAG)**  
O system prompt comprimido já contém o conhecimento. Para os três pilares atuais (site + ENEM básico + mercado financeiro), isso é suficiente. O RAG só vai fazer diferença quando você tiver centenas de páginas de conteúdo que não cabem no prompt.

**Opção 2 (melhor a médio prazo) — Hugging Face Inference API**  
O modelo `sentence-transformers/all-MiniLM-L6-v2` é gratuito na HuggingFace Inference API, gera embeddings de 384 dimensões e funciona bem para português técnico:

```javascript
// backend/src/utils/embeddings.js
const axios = require('axios');

async function getEmbedding(text) {
    const response = await axios.post(
        'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    return response.data[0]; // vetor de 384 dimensões
}
```
Chave gratuita em huggingface.co. Limite: 30.000 requests/mês.

**Opção 3 (futuro) — `gemini-embedding-001`**  
Modelo anterior do Gemini, pode estar acessível na sua chave. Testar com:
```javascript
model: "models/embedding-001"
// em vez de "text-embedding-004"
```

---

## CHECKLIST DE EXECUÇÃO

- [ ] Substituir `aiSystemPrompt.js` pela versão comprimida acima
- [ ] Mudar `max_tokens: 500` → `max_tokens: 1024` no `callOpenRouter`
- [ ] Mudar `OPENROUTER_MODEL` no `.env` para `meta-llama/llama-3.3-70b-instruct:free`
- [ ] Comentar/remover o bloco de RAG no `processAIRequest` temporariamente
- [ ] Reduzir cooldown do `geminiKeyManager` de 1h para 5min
- [ ] Reiniciar o backend
- [ ] Testar com "oi" — deve responder em menos de 3 segundos sem loop

---

## VALIDAÇÃO — COMO CONFIRMAR QUE FUNCIONOU

```bash
# No terminal do backend, a resposta a "oi" deve mostrar:
# 1. Nenhum "429" nos logs
# 2. Nenhum "Okay,000" na resposta
# 3. Tempo de resposta < 5 segundos
# 4. Log mostrando "GEMINI" como modoUsado (não OpenRouter)

# Teste de stress mental:
# "diga oi pra caio" → deve recusar educadamente (não é executor)
# "o que é o beco diagonal?" → deve explicar o rateio proporcional
# "me explica função do 1º grau" → deve ensinar (modo TUTOR)
# "qual meu saldo?" → deve usar {DADOS_ALUNO} do contexto
```

---

## NOTA FINAL SOBRE OS DOCX DO ASSAAD

Os docx do zip (Manual Assaad, Mapa de Incidências, etc.) são conteúdo rico que **vai valer muito quando o RAG estiver funcionando**. Por enquanto, o resumo tático do Método Assaad já está no system prompt comprimido acima — suficiente para o GIL orientar estudos básicos do ENEM.

Quando implementar o RAG com HuggingFace: converter os docx para texto, chunkar por seção (cada tópico do Mapa de Incidências é um chunk), e indexar. Aí sim o GIL vai conseguir responder "qual a incidência de logaritmo no ENEM?" com dados reais do material.

**Prioridade agora: IA funcionando sem alucinação. Conteúdo rico: próxima sprint.**
