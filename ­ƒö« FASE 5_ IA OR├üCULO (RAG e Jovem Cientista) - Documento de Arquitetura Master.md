# 🔮 FASE 5: IA ORÁCULO (RAG e Jovem Cientista) - Documento de Arquitetura Master

**Autor:** Manus AI
**Data:** 03 de Abril de 2026
**Versão:** 1.0

---

## 1. VISÃO GERAL DO SISTEMA

### Objetivos Educacionais e Técnicos

A Fase 5 do projeto ETE Gamificada introduz o **IA Oráculo**, um assistente inteligente baseado em Large Language Models (LLMs) que visa potencializar o aprendizado dos alunos, fornecendo suporte contextualizado e personalizado. O diferencial desta fase é a integração de um sistema de **Retrieval-Augmented Generation (RAG)** com documentos educacionais (como PDFs do ENEM) e a coleta de dados para um **estudo científico** sobre o impacto da IA no rendimento acadêmico dos alunos.

*   **Educacionais:**
    *   Oferecer suporte instantâneo e contextualizado para dúvidas dos alunos sobre o conteúdo do ENEM e outras matérias.
    *   Personalizar a experiência de aprendizado, adaptando as respostas ao contexto do aluno (página atual, histórico).
    *   Incentivar a pesquisa e a autonomia do aluno, fornecendo informações relevantes de forma acessível.
*   **Técnicos:**
    *   Implementar um pipeline de RAG eficiente e escalável utilizando a API de Embeddings do Gemini e MongoDB.
    *   Desenvolver um "Widget Flutuante" no frontend para integração fluida da IA na UI.
    *   Projetar um modelo de dados (`AIInteraction`) para coletar interações com a IA e métricas de rendimento acadêmico para análise científica.
    *   Garantir a segurança e a privacidade dos dados dos alunos, especialmente ao lidar com informações sensíveis como notas.

### Arquitetura de Alto Nível

A arquitetura do IA Oráculo é dividida em duas grandes partes: o pipeline de pré-processamento (offline) para o RAG e o fluxo de interação em tempo de execução (online). O sistema se integra ao backend e frontend existentes, adicionando um novo serviço de IA e uma coleção de dados para pesquisa.

```mermaid
graph TD
    subgraph Pré-processamento (Offline)
        A[PDFs do ENEM] --> B(Chunking de Texto)
        B --> C(Gemini Embeddings API)
        C --> D(MongoDB - Embeddings Collection)
    end

    subgraph Runtime (Online)
        E[Aluno (Frontend)] --> F(Widget Flutuante)
        F --> G(Backend - AI Controller)
        G --> H{MongoDB - Embeddings Collection}
        H --> I(Contexto Relevante)
        I --> J(Gemini LLM API)
        J --> K(Resposta da IA)
        K --> F
        G --> L(MongoDB - AIInteraction Collection)
    end

    M[CRON Job] --> N(Backend - AI Controller)
    N --> L
```

---

## 2. RETRIEVAL-AUGMENTED GENERATION (RAG)

O coração do IA Oráculo é o sistema RAG, que permite à IA responder perguntas com base em um corpus de documentos específicos (PDFs do ENEM), evitando alucinações e garantindo a relevância educacional.

### 2.1 Pré-processamento (Offline)

Esta etapa é executada uma única vez (ou sempre que novos documentos forem adicionados) para preparar o corpus de conhecimento.

1.  **Extração e Chunking de Texto:**
    *   **Ferramenta:** Utilizar bibliotecas como `pdfminer.six` (Python) ou `pdf-parse` (Node.js) para extrair texto de PDFs.
    *   **Processo:** Os PDFs do ENEM são lidos, e o texto é dividido em "chunks" (pedaços) de aproximadamente 500 tokens. É crucial que os chunks mantenham o contexto, evitando quebras no meio de frases ou parágrafos importantes.
    *   **Metadados:** Cada chunk deve ser associado a metadados relevantes (ex: `source_document`, `page_number`, `topic`).
2.  **Geração de Embeddings:**
    *   **API:** Gemini Embeddings API (gratuita para o tier free).
    *   **Processo:** Cada chunk de texto é enviado à API de Embeddings do Gemini, que retorna um vetor numérico (embedding) que representa semanticamente o conteúdo do chunk.
3.  **Persistência no MongoDB:**
    *   **Collection:** `document_embeddings`
    *   **Schema:**
        ```javascript
        // backend/src/models/DocumentEmbedding.js
        const mongoose = require("mongoose");

        const DocumentEmbeddingSchema = new mongoose.Schema({
          chunkText: {
            type: String,
            required: true,
          },
          sourceDocument: {
            type: String,
            required: true,
          },
          pageNumber: {
            type: Number,
            min: 1,
          },
          topic: {
            type: String,
            trim: true,
          },
          embedding: {
            type: [Number], // Array de floats
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        });

        // Índice para busca vetorial (se MongoDB Atlas com $vectorSearch)
        // Ou índice regular para busca por texto se for usar produto escalar manual
        DocumentEmbeddingSchema.index({ embedding: "2dsphere" }); // Exemplo para $vectorSearch
        DocumentEmbeddingSchema.index({ topic: 1 });

        module.exports = mongoose.model("DocumentEmbedding", DocumentEmbeddingSchema);
        ```
    *   **Armazenamento:** O `chunkText`, metadados e o vetor de embedding são salvos nesta coleção.

### 2.2 Runtime (Online)

Esta etapa ocorre a cada pergunta do aluno ao IA Oráculo.

1.  **Pergunta do Aluno:** O aluno digita uma pergunta no frontend.
2.  **Geração de Embedding da Pergunta:**
    *   A pergunta do aluno é enviada à Gemini Embeddings API para gerar seu vetor de embedding.
3.  **Busca por Similaridade (Retrieval):**
    *   **Tecnologia:** MongoDB.
    *   **Processo:** O embedding da pergunta é usado para realizar uma busca por similaridade vetorial na coleção `document_embeddings`.
        *   **MongoDB Atlas ($vectorSearch):** Se o MongoDB estiver no Atlas, usar `$vectorSearch` para busca nativa e otimizada.
        *   **Produto Escalar Manual:** Se não estiver no Atlas, calcular o produto escalar (dot product) entre o embedding da pergunta e todos os embeddings armazenados, selecionando os `k` (ex: 3) chunks mais relevantes.
    *   **Resultado:** Os `k` chunks de texto mais semanticamente próximos à pergunta são recuperados.
4.  **Injeção de Contexto (Augmentation):**
    *   Os chunks recuperados são formatados e injetados no prompt do LLM como "contexto" antes da pergunta do aluno.
    *   **Exemplo de Prompt:**
        ```
        Você é o Gil, assistente da ETE Gamificada. Responda à pergunta do aluno com base EXCLUSIVAMENTE no contexto fornecido. Se a resposta não estiver no contexto, diga que não sabe.

        Contexto:
        """
        [Chunk 1 do ENEM]
        [Chunk 2 do ENEM]
        [Chunk 3 do ENEM]
        """

        Pergunta do aluno: [Pergunta do Aluno]
        ```
5.  **Geração de Resposta (Generation):**
    *   **API:** Gemini LLM API (ou outro LLM compatível com OpenAI API).
    *   **Processo:** O prompt (com contexto e pergunta) é enviado ao LLM, que gera uma resposta.
6.  **Resposta ao Aluno:** A resposta do LLM é exibida no frontend.

---

## 3. WIDGET FLUTUANTE (FRONTEND)

O Widget Flutuante é um componente React que integra o IA Oráculo de forma não intrusiva na interface do usuário, adaptando o contexto da IA à página atual do aluno.

### Estrutura e Comportamento

*   **Componente React:** Um componente fixo no `App.tsx` (ou layout principal), fora de todas as rotas, com `position: fixed`.
*   **Detecção de Rota:** Utiliza `useLocation()` do React Router para detectar a rota atual (`location.pathname`).
*   **Injeção de Contexto Adicional:** Com base na rota, o widget injeta informações adicionais no System Prompt do LLM.
    *   **Exemplo:** Se o aluno está em `/beco-diagonal`, o prompt pode incluir: "O aluno está na página: /beco-diagonal. Nesta página ele pode comprar itens coletivos com a sua turma...". Isso guia a IA para respostas mais relevantes ao contexto da UI.
*   **UI/UX:** Ícone flutuante clicável que abre/fecha um chatbox. Design consistente com o tema cyberpunk/terminal.

### Exemplo de Componente (Esquemático)

```typescript
// frontend/src/components/AIFloatingWidget.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { sendMessageToAI } from '../api/aiService'; // Função para interagir com o backend da IA

interface AIInteractionMessage {
  role: 'user' | 'ai';
  content: string;
}

const AIFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIInteractionMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Efeito para injetar contexto baseado na rota
  useEffect(() => {
    // Lógica para determinar o contexto da página e talvez enviar uma mensagem inicial à IA
    // ou apenas preparar o system prompt para a próxima interação.
    console.log('Aluno está na página:', location.pathname);
    // Ex: Se a página for de investimentos, a IA pode ter um prompt inicial sobre finanças.
  }, [location.pathname]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: AIInteractionMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Envia a pergunta do usuário junto com o contexto da página
      const aiResponse = await sendMessageToAI(input, location.pathname);
      const aiMessage: AIInteractionMessage = { role: 'ai', content: aiResponse.message };
      setMessages(prev => [...prev, aiMessage]);
      // TODO: Registrar interação no backend para o estudo do Jovem Cientista
    } catch (error) {
      console.error('Erro ao interagir com a IA:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Desculpe, tive um problema ao processar sua solicitação.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'X' : '🤖'}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-gray-800 border border-purple-500 rounded-lg shadow-xl flex flex-col">
          <div className="p-3 border-b border-purple-500 text-purple-300 font-bold">IA Oráculo</div>
          <div className="flex-1 p-3 overflow-y-auto text-sm">
            {messages.map((msg, index) => (
              <div key={index} className={cn("mb-2", msg.role === 'user' ? 'text-right' : 'text-left')}>
                <span className={cn(
                  "inline-block p-2 rounded-lg",
                  msg.role === 'user' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-green-300'
                )}>
                  {msg.content}
                </span>
              </div>
            ))}
            {isLoading && <p className="text-green-400">Digitando...</p>}
          </div>
          <div className="p-3 border-t border-purple-500 flex">
            <input
              type="text"
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-l-lg p-2 text-sm focus:outline-none focus:border-purple-400"
              placeholder="Pergunte ao Oráculo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              disabled={isLoading}
            />
            <button
              className="bg-purple-600 text-white rounded-r-lg p-2 text-sm hover:bg-purple-700 focus:outline-none"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFloatingWidget;
```

---

## 4. COLETA DE DADOS PARA O JOVEM CIENTISTA

Esta é a parte crucial para o estudo científico, conforme a visão do Chief Architect (`claude idea.md`). O objetivo é correlacionar o uso da IA com o rendimento acadêmico real dos alunos.

### Modelo de Dados `AIInteraction`

**Collection:** `ai_interactions`

```javascript
// backend/src/models/AIInteraction.js
const mongoose = require("mongoose");

const AIInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pergunta: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  resposta: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  categoria: {
    type: String,
    enum: ["SUPORTE", "TUTORIA", "ENEM", "INVESTIMENTO", "GERAL"], // Expandir categorias
    default: "GERAL",
  },
  paginaOrigem: {
    type: String, // Ex: /beco-diagonal, /gil-investe, /enem
    required: true,
  },
  avaliacaoAluno: {
    type: Number,
    min: 1,
    max: 5, // Avaliação do aluno sobre a utilidade da resposta (1 a 5 estrelas)
    default: null, // Pode ser coletado posteriormente
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
  // 🎓 O CRUZAMENTO CIENTÍFICO: Snapshot das notas do aluno no momento da interação
  snapshotNotas: {
    n1_media: { type: Number, min: 0, max: 10, default: null },   // Média das N1s
    n2_media: { type: Number, min: 0, max: 10, default: null },   // Média das N2s
    redacao_media: { type: Number, min: 0, max: 1000, default: null }, // Média das redações
    simulado_enem_score: { type: Number, min: 0, max: 1000, default: null }, // Último score do simulado ENEM
    // Outras métricas acadêmicas relevantes
  },
  // Para análise longitudinal: rendimento futuro (calculado por CRON)
  rendimentoDepois_n1_media: { type: Number, min: 0, max: 10, default: null },
  rendimentoDepois_n2_media: { type: Number, min: 0, max: 10, default: null },
  // ... e assim por diante para outras métricas
}, { timestamps: true });

AIInteractionSchema.index({ userId: 1 });
AIInteractionSchema.index({ categoria: 1 });
AIInteractionSchema.index({ criadoEm: -1 });

module.exports = mongoose.model("AIInteraction", AIInteractionSchema);
```

### Coleta de `snapshotNotas`

*   No momento em que o aluno interage com a IA, o `AIController` deve realizar um `populate` no modelo `User` para obter as notas mais recentes do aluno e salvá-las no campo `snapshotNotas` da `AIInteraction`.
*   Isso requer que o modelo `User` seja estendido para incluir campos como `n1_media`, `n2_media`, `redacao_media`, `simulado_enem_score`.

### CRON Job para Análise Longitudinal

*   **Objetivo:** Calcular o `rendimentoDepois` (ex: notas 7 dias ou 30 dias após a interação com a IA) para o estudo científico.
*   **Timing:** Um CRON job (ex: semanal ou mensal) percorrerá as `AIInteraction`s mais antigas que ainda não têm `rendimentoDepois` preenchido.
*   **Processo:** Para cada interação, ele buscará as notas atualizadas do `User` (ou de uma coleção de histórico de notas) e preencherá os campos `rendimentoDepois_n1_media`, etc.
*   **Privacidade:** É crucial garantir que este processo seja anonimizado ou que os dados sejam tratados com a máxima privacidade e consentimento, conforme as políticas da escola.

---

## 5. BACKEND ARCHITECTURE

### Controllers

*   **`aiController.js`:**
    *   `processAIRequest(req, res)`: Recebe a pergunta do aluno e o `paginaOrigem`.
        *   Gera embedding da pergunta.
        *   Busca chunks relevantes no `DocumentEmbedding`.
        *   Monta o prompt com contexto.
        *   Chama a Gemini LLM API.
        *   Salva a interação no `AIInteraction` (incluindo `snapshotNotas`).
        *   Retorna a resposta da IA.
    *   `submitFeedback(req, res)`: Permite ao aluno avaliar a resposta da IA (`avaliacaoAluno`).
*   **`embeddingProcessor.js` (Utilitário/Serviço):**
    *   `generateEmbeddings(text)`: Função para chamar a Gemini Embeddings API.
    *   `searchSimilarChunks(queryEmbedding, k)`: Função para buscar chunks no MongoDB.
*   **`cronJobs.js` (Módulo de CRONs):**
    *   `processDocumentsForEmbeddings()`: CRON para processar novos PDFs e gerar embeddings.
    *   `updateAIInteractionPerformanceMetrics()`: CRON para preencher os campos `rendimentoDepois` no `AIInteraction`.

### Routes `/api/ai/*`

```javascript
// backend/src/routes/aiRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { processAIRequest, submitFeedback } = require("../controllers/aiController");
const mongoSanitize = require("express-mongo-sanitize");

const router = express.Router();

router.use(mongoSanitize());

router.post("/ask", protect, processAIRequest);
router.post("/feedback", protect, submitFeedback);

module.exports = router;
```

### Middleware de Segurança Específico

*   **Validação de Entrada:** Rigorosa validação da `pergunta` do aluno (tamanho máximo, sanitização XSS).
*   **Privacidade de Dados:** Garantir que os dados de `snapshotNotas` sejam acessados apenas com as permissões adequadas e que o armazenamento e uso para pesquisa sigam as políticas de privacidade.
*   **Rate Limiting:** Implementar rate limiting para o endpoint `/api/ai/ask` para prevenir abusos e controlar o custo da API do Gemini.

---

## 6. FRONTEND ARCHITECTURE

### Páginas e Componentes

*   **`AIFloatingWidget.tsx`:** (Conforme detalhado na seção 3) Componente principal do IA Oráculo.
*   **`AIChatbox.tsx`:** Componente interno do widget para exibir o histórico de conversas e a interface de input.
*   **`FeedbackStars.tsx`:** Componente para o aluno dar feedback (1-5 estrelas) sobre a resposta da IA.

### React Query Hooks Customizados

*   `useAIConversation()`: Hook para gerenciar o estado da conversa com a IA (mensagens, loading).
*   `useSendMessageToAI()`: `useMutation` para enviar perguntas à IA.
*   `useSubmitAIFeedback()`: `useMutation` para enviar feedback do aluno.

### Estado Global Necessário

*   **`AuthContext`:** Para obter o `userId` e outras informações do aluno para registrar a interação.
*   **React Query Cache:** Gerencia o cache de conversas (se houver necessidade de persistir conversas curtas).

### Design System e Responsividade

*   Manter a consistência com o design cyberpunk/terminal e a abordagem Mobile-First.
*   O widget deve ser responsivo e não obstruir a navegação principal em telas pequenas.

### Loading States e Error Boundaries

*   **Loading States:** Indicadores visuais durante o processamento da pergunta pela IA.
*   **Error Boundaries:** Para o widget, garantindo que falhas na IA não quebrem a aplicação principal.

---

## 7. SEGURANÇA E PROTEÇÕES

### Validação de Entrada

*   **Backend:** Validação rigorosa da `pergunta` e `resposta` da IA para evitar injeção de conteúdo malicioso ou excesso de dados.
*   **Sanitização XSS:** Aplicação de `express-mongo-sanitize` nas rotas `/api/ai/*`.

### Proteção de Dados Sensíveis

*   O acesso aos dados de notas dos alunos (`snapshotNotas`) deve ser restrito e auditado. Apenas o backend deve ter permissão para ler e gravar esses dados na coleção `AIInteraction`.
*   Garantir que a API do Gemini não receba PII (Personally Identifiable Information) sensíveis dos alunos, apenas a pergunta e o contexto educacional.

### Rate Limiting

*   Implementar rate limiting no endpoint `/api/ai/ask` para controlar o número de requisições por usuário em um determinado período, prevenindo abusos e otimizando o uso da API do Gemini (que possui limites de requisições gratuitas).

### Logs de Segurança

*   Registrar todas as interações com a IA, incluindo `userId`, `pergunta`, `resposta`, `paginaOrigem`, e quaisquer erros. Isso é crucial para o estudo científico e para auditoria de segurança.

---

## 8. PERFORMANCE E ESCALABILIDADE

### Otimizações de Query MongoDB

*   **`DocumentEmbedding` Collection:**
    *   Índice vetorial para `$vectorSearch` (se MongoDB Atlas) ou índices para busca por texto.
*   **`AIInteraction` Collection:**
    *   Índices em `userId`, `criadoEm` (para buscas de histórico) e `categoria`.

### Otimização da API do Gemini

*   **Cache de Respostas (Opcional):** Para perguntas muito comuns, pode-se considerar um cache de respostas no Redis para evitar chamar o LLM repetidamente.
*   **Parâmetros do LLM:** Otimizar `temperature`, `top_k`, `top_p` para equilibrar criatividade e precisão, e controlar o custo.

---

## 9. CONTRATOS DE API

### Especificação OpenAPI/Swagger

Extender a especificação OpenAPI para incluir os novos endpoints da IA:

*   `/api/ai/ask` (POST)
*   `/api/ai/feedback` (POST)

Cada endpoint terá seu schema de request/response, exemplos e códigos de erro definidos.

---

## 10. TESTES E QUALIDADE

### Casos de Teste Unitário

*   **`AIInteraction` Model:** Validações de schema.
*   **`aiController.js`:** Testar `processAIRequest` (com e sem contexto, com diferentes perguntas), `submitFeedback`.
*   **`embeddingProcessor.js`:** Testar `generateEmbeddings` e `searchSimilarChunks`.
*   **CRON Jobs:** Testar `processDocumentsForEmbeddings` e `updateAIInteractionPerformanceMetrics`.

### Casos de Teste de Integração

*   **Fluxo Completo de Interação:** Aluno pergunta -> Widget envia -> Backend processa RAG -> Gemini responde -> Resposta exibida -> Aluno avalia.
*   **RAG:** Testar se a IA usa o contexto fornecido e se a busca por similaridade retorna chunks relevantes.
*   **Coleta de Dados:** Verificar se as interações são salvas corretamente no `AIInteraction` com `snapshotNotas`.

### Testes de Carga

*   Simular múltiplos alunos interagindo com a IA simultaneamente para verificar a latência e o custo da API do Gemini.

### Critérios de Aceitação

*   O IA Oráculo responde perguntas dos alunos de forma contextualizada e relevante.
*   A IA utiliza o conteúdo dos PDFs do ENEM como base para suas respostas.
*   As interações com a IA são registradas no `AIInteraction` com os dados de `snapshotNotas`.
*   O widget flutuante é funcional e responsivo em todas as páginas.
*   A privacidade dos dados dos alunos é garantida.

---

## 11. DEPLOYMENT E MONITORAMENTO

### Variáveis de Ambiente Necessárias

*   `GEMINI_API_KEY`: Chave de API para o Gemini LLM e Embeddings.
*   `MONGO_URI`: String de conexão com o MongoDB.

### Métricas a Monitorar

*   **Backend:**
    *   Latência de requisições `/api/ai/ask`.
    *   Custo da API do Gemini (número de tokens processados).
    *   Taxa de acerto do RAG (se possível medir).
    *   Tempo de execução dos CRON jobs de embeddings e métricas de performance.
*   **Frontend:**
    *   Engajamento com o widget (aberturas, perguntas).
    *   Avaliações dos alunos (`avaliacaoAluno`).

### Alertas Críticos

*   Alta latência ou erros no endpoint `/api/ai/ask`.
*   Excesso de uso da API do Gemini (para controlar custos).
*   Falhas nos CRON jobs de processamento de embeddings ou métricas de performance.

---

## 12. GLOSSÁRIO E REFERÊNCIAS

### Termos Técnicos

*   **IA Oráculo:** Assistente inteligente baseado em LLM na ETE Gamificada.
*   **RAG (Retrieval-Augmented Generation):** Técnica que combina recuperação de informação com geração de texto por LLMs.
*   **Embeddings:** Representações vetoriais numéricas de texto, capturando seu significado semântico.
*   **LLM (Large Language Model):** Modelo de linguagem grande (ex: Gemini).
*   **Chunking:** Processo de dividir documentos longos em pedaços menores.
*   **$vectorSearch:** Funcionalidade do MongoDB Atlas para busca por similaridade vetorial.
*   **AIInteraction:** Coleção no MongoDB para registrar as interações dos alunos com a IA.
*   **snapshotNotas:** Registro das notas do aluno no momento de uma interação com a IA.

### Referências Externas

*   [claude idea.md]
*   [DIRETRIZES_GLOBAIS_ETE.md]
*   [11_ARQUITETURA_FASE4_GIL_INVESTE_MASTER.md]
*   [11.2_ARQUITETURA_FASE4_STARTUPS_ALUNOS.md]

### Links Úteis

*   [Gemini API Documentation](https://ai.google.dev/docs)
*   [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/)

---

**FIM DO DOCUMENTO**
