// backend/src/services/AIRotatorService.js
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HttpsProxyAgent } = require('https-proxy-agent');
const AISemanticCache = require('../models/AISemanticCache');
const geminiKeyManager = require('../utils/geminiKeyManager');
const HuggingFaceService = require('./HuggingFaceService');

class AIRotatorService {
    constructor() {
        this.currentKeyIndex = 0;
        this.currentProxyIndex = 0;
        this._initialized = false;
        this.nvidiaKeys = [];
        this.proxies = [];
    }

    /**
     * Garante que as configurações do .env sejam carregadas (Lazy Load)
     */
    _ensureInitialized() {
        if (this._initialized) return;

        // 🔑 Rotação Dinâmica de Chaves NVIDIA
        this.nvidiaKeys = Object.keys(process.env)
            .filter(k => k.match(/^NVIDIA_API_KEY_\d+$/))
            .sort()
            .map(k => process.env[k])
            .filter(Boolean);
        
        if (this.nvidiaKeys.length === 0 && process.env.NVIDIA_API_KEY) {
            this.nvidiaKeys.push(process.env.NVIDIA_API_KEY);
        }

        // 📡 CONFIGURAÇÃO DO IP SHIELD (PROXIES)
        let proxyString = process.env.AI_PROXIES || '';
        proxyString = proxyString.replace(/^["']|["']$/g, '');
        
        this.proxies = proxyString
            ? proxyString.split(',').map(p => p.trim()).filter(Boolean)
            : [];

        this._initialized = true;
        if (this.proxies.length > 0) {
            console.log(`🛡️  [IP Shield] Sistema inicializado com ${this.proxies.length} proxies.`);
        }
    }

    getNextProxyAgent() {
        this._ensureInitialized();
        if (this.proxies.length === 0) return null;
        
        const proxy = this.proxies[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
        
        try {
            return new HttpsProxyAgent(proxy);
        } catch (e) {
            console.error(`❌ [IP Shield] Erro ao criar agent para proxy ${proxy}:`, e.message);
            return null;
        }
    }

    getNextNvidiaKey() {
        this._ensureInitialized();
        if (this.nvidiaKeys.length === 0) return null;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.nvidiaKeys.length;
        return this.nvidiaKeys[this.currentKeyIndex];
    }

    /**
     * Tenta encontrar uma resposta similar no cache semântico antes de gastar tokens
     */
    async checkSemanticCache(prompt, disciplinaId) {
        try {
            // Esta busca depende do índice de busca vetorial no Atlas
            // Por enquanto, faremos uma simulação ou busca simples até o índice estar ok
            // Escapa caracteres especiais de regex para evitar injeção
            const sanitizedPrompt = prompt.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const cached = await AISemanticCache.findOne({ 
                prompt: { $regex: new RegExp(sanitizedPrompt, 'i') } 
            }).sort({ createdAt: -1 });

            if (cached) {
                console.log("🎯 [Cache] Hit semântico encontrado!");
                return cached.answer;
            }
            return null;
        } catch (e) {
            console.error("⚠️ [Cache] Erro na busca semântica:", e.message);
            return null;
        }
    }

    async saveToCache(prompt, answer, embedding = [], disciplinaId = null, metadata = {}) {
        try {
            await AISemanticCache.create({
                prompt,
                answer,
                embedding,
                disciplinaId,
                metadata
            });
        } catch (e) {
            console.error("❌ [Cache] Erro ao salvar:", e.message);
        }
    }

    async callNvidia(prompt, systemPrompt = "", history = [], retryCount = 0) {
        this._ensureInitialized();
        const key = this.nvidiaKeys[this.currentKeyIndex];
        if (!key) throw new Error("Nenhuma chave NVIDIA configurada.");

        if (retryCount >= 5) {
            throw new Error("Limite de rotação NVIDIA atingido (Rate Limit persistente).");
        }

        try {
            const response = await axios.post(
                'https://integrate.api.nvidia.com/v1/chat/completions',
                {
                    model: "z-ai/glm5", 
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 16384, // Aumentado para suportar reasoning
                    extra_body: {
                        chat_template_kwargs: {
                            enable_thinking: false, // Desativado para máxima performance (conforme solicitado)
                            clear_thinking: true
                        }
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    httpsAgent: this.getNextProxyAgent(), // 📡 Aplica IP Shield
                    timeout: 60000 
                }
            );

            const choice = response.data.choices[0];
            const content = choice.message.content;
            const reasoning = choice.delta?.reasoning_content || ""; 

            // Retornamos um objeto com o raciocínio para capturarmos no logs
            return {
                content,
                reasoning,
                model: "nvidia/glm5"
            };
        } catch (error) {
            if (error.response?.status === 429) {
                console.warn(`⚠️ [NVIDIA] Rate limit na chave ${this.currentKeyIndex}. Tentando próxima... (Ref: ${retryCount + 1}/5)`);
                this.getNextNvidiaKey();
                return this.callNvidia(prompt, systemPrompt, history, retryCount + 1);
            }
            throw error;
        }
    }

    async callGemini(prompt, systemPrompt = "", history = [], retryCount = 0) {
        this._ensureInitialized();
        if (retryCount >= 5) {
            throw new Error("Limite de rotação Gemini atingido (Rate Limit persistente).");
        }

        // Formata o histórico: "Role: Contexto" para o Gemini Raw Prompt
        const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Usuário' : 'GIL'}: ${msg.content}`).join('\n');
        
        let fullPrompt = systemPrompt ? `${systemPrompt}\n\n` : "";
        if (formattedHistory) fullPrompt += `HISTÓRICO DA CONVERSA:\n${formattedHistory}\n\n`;
        fullPrompt += `PERGUNTA ATUAL DO ALUNO: ${prompt}`;
        
        // Tenta rotacionar chaves se houver erro de quota
        const keyData = geminiKeyManager.getAvailableKey();
        if (!keyData) {
            throw new Error("Todas as chaves Gemini estão em cooldown.");
        }

        try {
            // 📡 Gemini funciona melhor SEM proxy (Google bloqueia muitos IPs de datacenter)
            // Por isso, simplificamos a conexão para máxima velocidade e estabilidade.
            const genAI = new GoogleGenerativeAI(keyData.key);
            
            // Usamos o modelo gemini-flash-latest (confirmado na auditoria) para maior estabilidade de cota
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            
            const result = await model.generateContent(fullPrompt);
            const text = result.response.text();
            
            return {
                content: text,
                reasoning: null,
                model: "gemini-1.5-flash"
            };
        } catch (error) {
            console.error(`❌ [Gemini-Internal-Error] Chave ${keyData.index + 1}:`, error.message);
            
            if (error?.status === 429 || error?.response?.status === 429 || error.message?.includes('quota')) {
                console.warn(`🚨 [Gemini] Chave ${keyData.index + 1} exausta ou bloqueada. Rotacionando...`);
                geminiKeyManager.markKeyAsQuoted(keyData.index);
                return this.callGemini(prompt, systemPrompt, history, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Gera um questionário estruturado (JSON) para um tópico específico
     */
    async generateStructuredQuiz(topico, dificuldade) {
        this._ensureInitialized();
        const systemPrompt = `Você é um Criador de Simulados Pedagógicos. 
Sua tarefa é gerar 3 questões de múltipla escolha sobre o tópico [${topico}] no nível de dificuldade [${dificuldade}].
Responda EXCLUSIVAMENTE em formato JSON puro, seguindo este esquema:
{
  "titulo": "Desafio de ${topico}",
  "topico": "${topico}",
  "questoes": [
    {
      "pergunta": "Texto da pergunta?",
      "alternativas": ["A", "B", "C", "D"],
      "respostaCorreta": 0,
      "explicacao": "Por que esta é a correta?"
    }
  ]
}
Não adicione markdown ou textos explicativos fora do JSON.`;

        const prompt = `Gere o simulado de ${topico} agora.`;
        
        // Usamos Gemini para geração de JSON pela alta precisão de esquema
        const result = await this.callGemini(prompt, systemPrompt);
        
        try {
            // Limpa possíveis marcações de markdown do JSON
            const jsonStr = result.content.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("❌ [AI-Gen] Erro ao parsear JSON do Simulado:", e.message);
            throw new Error("Falha ao estruturar o simulado automático.");
        }
    }

    async ask(prompt, systemPrompt = "", options = {}) {
        this._ensureInitialized();
        const { disciplinaId = null, preferNvidia = false, history = [] } = options;

        // 1. Verificar Cache Semântico
        const cachedAnswer = await this.checkSemanticCache(prompt, disciplinaId);
        if (cachedAnswer) return cachedAnswer;

        let result;
        // 2. Chamar LLM (Nvidia ou Gemini)
        if (preferNvidia && this.nvidiaKeys.length > 0) {
            try {
                result = await this.callNvidia(prompt, systemPrompt, history);
            } catch (err) {
                console.error("❌ [NVIDIA] Falha total. Fallback para Gemini.", err.message);
                result = await this.callGemini(prompt, systemPrompt, history);
            }
        } else {
            try {
                result = await this.callGemini(prompt, systemPrompt, history);
            } catch (err) {
                console.warn("⚠️ [GEMINI] Falha. Tentando NVIDIA como backup...");
                result = await this.callNvidia(prompt, systemPrompt, history).catch(e => {
                    throw new Error("❌ Todas as IAs falharam. " + e.message);
                });
            }
        }

        // 3. Salvar no Cache (sem bloquear a resposta)
        this.saveToCache(prompt, result.content, [], disciplinaId, {
            model: result.model,
            hasReasoning: !!result.reasoning
        });

        return result.content;
    }
}

module.exports = new AIRotatorService();
