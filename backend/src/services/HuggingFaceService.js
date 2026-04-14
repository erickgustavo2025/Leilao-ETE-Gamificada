// backend/src/services/HuggingFaceService.js
const axios = require('axios');

class HuggingFaceService {
    constructor() {
        this.apiKey = process.env.HUGGINGFACE_API_KEY;
        this.model = "intfloat/multilingual-e5-large";
        this.apiUrl = `https://api-inference.huggingface.co/models/${this.model}`;
    }

    async getEmbedding(text) {
        if (!this.apiKey) {
            console.warn("⚠️ [HuggingFace] Sem chave de API no .env. Fallback desativado.");
            return null;
        }

        try {
            const response = await axios.post(
                this.apiUrl,
                { inputs: text },
                {
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                    timeout: 8000
                }
            );

            // O modelo E5 retorna um array de embeddings ou um array de arrays
            // Dependendo da chamada, podemos precisar extrair o primeiro elemento
            if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
                return response.data[0];
            }
            return response.data;
        } catch (error) {
            console.error("❌ [HuggingFace] Erro na vetorização:", error.message);
            return null;
        }
    }
}

module.exports = new HuggingFaceService();
