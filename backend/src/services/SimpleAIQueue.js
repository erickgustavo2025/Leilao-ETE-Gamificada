// backend/src/services/SimpleAIQueue.js
const { v4: uuidv4 } = require('uuid');

/**
 * 🤖 SIMPLE AI QUEUE V2 - PJC 2K26 (ELITE HARDENING)
 * Gerencia a concorrência para evitar rate-limits e garante UX fluida.
 */
class SimpleAIQueue {
    constructor(maxConcurrent = 10) {
        this.queue = [];
        this.running = 0;
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Adiciona uma requisição à fila e retorna uma Promise com o resultado
     * @param {Function} aiTask - Função que executa a chamada à IA
     * @param {String} userId - ID do usuário para rate-limit per-user
     * @returns {Promise<Object>} Resposta da IA
     */
    enqueue(aiTask, userId = 'anon') {
        const requestId = uuidv4();
        
        // 🛡️ [BLINDAGEM 3.3] Per-User Rate Limit
        const userTasks = this.queue.filter(t => t.userId === userId).length;
        if (userTasks >= 2) {
            console.warn(`[AI Queue] User ${userId} atingiu limite de concorrência.`);
            return Promise.reject(new Error('Você já tem muitas requisições de IA em curso. Aguarde alguns segundos.'));
        }

        return new Promise((resolve, reject) => {
            this.queue.push({
                id: requestId,
                userId,
                task: aiTask,
                resolve,
                reject,
                createdAt: Date.now()
            });
            
            console.log(`[AI Queue] Enfileirado: ${requestId}. Fila: ${this.queue.length}`);
            this.process();
        });
    }

    /**
     * Processa as tasks da fila respeitando o limite de concorrência
     */
    async process() {
        // Enquanto houver espaço livre e tarefas na fila, dispara!
        while (this.running < this.maxConcurrent && this.queue.length > 0) {
            this.running++;
            const { id, task, resolve, reject } = this.queue.shift();
            
            console.log(`[AI Queue] Iniciando Processamento: ${id} (Ativos: ${this.running}/${this.maxConcurrent})`);

            // Execução ASSÍNCRONA com Timeout de Segurança
            (async () => {
                const timeoutId = setTimeout(() => {
                    this.running--;
                    reject(new Error('Tempo limite da IA esgotado (Timeout).'));
                    this.process();
                }, 60000); // 60s max por slot

                try {
                    const result = await task();
                    clearTimeout(timeoutId);
                    resolve(result);
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error(`[AI Queue] Erro na task ${id}:`, error.message);
                    reject(error);
                } finally {
                    this.running--;
                    console.log(`[AI Queue] Finalizado: ${id}. Vaga liberada (Em curso: ${this.running})`);
                    this.process();
                }
            })();
        }
    }

    /**
     * Retorna estatísticas da fila (para logs/painel admin futuro)
     */
    getStats() {
        return {
            waiting: this.queue.length,
            running: this.running,
            capacity: this.maxConcurrent
        };
    }
}

// Exporta como Singleton para ser compartilhado por todo o backend
module.exports = new SimpleAIQueue();
