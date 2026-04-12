// backend/src/services/AIRotatorService.js
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const NodeCache = require('node-cache');

// Cache para evitar processamentos repetidos em feedbacks curtos (10 min)
const aiCache = new NodeCache({ stdTTL: 600 });

class AIRotatorService {
    constructor() {
        this.nvidiaKeys = [
            process.env.NVIDIA_API_KEY_1,
            process.env.NVIDIA_API_KEY_2
        ].filter(Boolean);
        
        this.currentKeyIndex = 0;
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.modelGemini = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    getNextNvidiaKey() {
        if (this.nvidiaKeys.length === 0) return null;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.nvidiaKeys.length;
        return this.nvidiaKeys[this.currentKeyIndex];
    }

    async callNvidia(prompt, systemPrompt = "") {
        const key = this.nvidiaKeys[this.currentKeyIndex];
        if (!key) throw new Error("Nenhuma chave NVIDIA configurada.");

        try {
            const response = await axios.post(
                'https://integrate.api.nvidia.com/v1/chat/completions',
                {
                    model: "nvidia_glm_5", // Nome fictício baseado no pedido, ajustável para o modelo real da NVIDIA
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                },
                {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10s timeout
                }
            );
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response?.status === 429) {
                console.warn("⚠️ [NVIDIA] Rate limit atingido. Rotacionando chave...");
                this.getNextNvidiaKey();
                return this.callNvidia(prompt, systemPrompt); // Tenta com a próxima
            }
            throw error;
        }
    }

    async callGemini(prompt, systemPrompt = "") {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUsuário: ${prompt}` : prompt;
        const result = await this.modelGemini.generateContent(fullPrompt);
        return result.response.text();
    }

    async ask(prompt, systemPrompt = "", preferNvidia = false) {
        const cacheKey = Buffer.from(prompt + systemPrompt).toString('base64').slice(0, 32);
        const cached = aiCache.get(cacheKey);
        if (cached) return cached;

        if (preferNvidia && this.nvidiaKeys.length > 0) {
            try {
                const res = await this.callNvidia(prompt, systemPrompt);
                aiCache.set(cacheKey, res);
                return res;
            } catch (err) {
                console.error("❌ [NVIDIA] Falha total. Usando Gemini como fallback.", err.message);
            }
        }

        // Default to Gemini or Fallback
        const res = await this.callGemini(prompt, systemPrompt);
        aiCache.set(cacheKey, res);
        return res;
    }
}

module.exports = new AIRotatorService();
