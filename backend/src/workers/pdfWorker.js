// backend/src/workers/pdfWorker.js
const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Worker para extração de texto de PDFs.
 * Executado em uma thread separada via Piscina para não travar o loop de eventos principal.
 */
module.exports = async ({ filePath }) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        
        // 🔒 [C2 - Blindagem] Timeout de 30s para evitar bloqueio infinito
        const pdfPromise = pdf(dataBuffer);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT: O processamento do PDF excedeu 30 segundos.')), 30000)
        );

        const data = await Promise.race([pdfPromise, timeoutPromise]);
        
        // Remove espaços excessivos e quebras de linha múltiplas para otimizar o contexto da IA
        const cleanText = data.text
            .replace(/\n+/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            success: true,
            text: cleanText,
            info: data.info,
            pages: data.numpages
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};
