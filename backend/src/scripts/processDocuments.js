// backend/src/scripts/processDocuments.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // mantido SÓ para OCR Vision
const DocumentEmbedding = require('../models/DocumentEmbedding');
const { embedContent } = require('../utils/geminiKeyManager'); // ← rotação automática de chaves
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// genAI mantido APENAS para o OCR Vision (gemini-2.0-flash) — quota separada dos embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_1 || process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── DELAY ENTRE CHUNKS ──────────────────────────────────────────────
// Limite gratuito: 100 RPM por chave.
// Com 3 chaves em rotação = ~300 RPM teórico.
// 700ms garante ~85 req/min por chave — margem segura sem desperdiçar tempo.
const CHUNK_DELAY_MS = 700;

// ── CHUNKING INTELIGENTE (inalterado) ────────────────────────────────
function splitTextIntelligently(text, maxLength = 2000) {
    if (!text || text.trim().length === 0) return [];
    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n\n+/);

    for (let paragraph of paragraphs) {
        if (!paragraph.trim()) continue;
        if ((currentChunk.length + paragraph.length + 2) <= maxLength) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            if (paragraph.length > maxLength) {
                const lines = paragraph.split(/\n/);
                for (let line of lines) {
                    if (!line.trim()) continue;
                    if ((currentChunk.length + line.length + 1) <= maxLength) {
                        currentChunk += (currentChunk ? '\n' : '') + line;
                    } else {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        if (line.length > maxLength) {
                            const words = line.split(/\s+/);
                            currentChunk = '';
                            for (let word of words) {
                                if ((currentChunk.length + word.length + 1) <= maxLength) {
                                    currentChunk += (currentChunk ? ' ' : '') + word;
                                } else {
                                    if (currentChunk) chunks.push(currentChunk.trim());
                                    currentChunk = word;
                                }
                            }
                        } else {
                            currentChunk = line;
                        }
                    }
                }
            } else {
                currentChunk = paragraph;
            }
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks;
}

// ── OCR VISION (fallback para docs corrompidos/escaneados) ───────────
// Usa o genAI singleton com a chave primária — é raro ser chamado.
async function performOCR(buffer, fileName, mimeType = 'application/pdf') {
    console.log(`\n🔍 OCR Vision ativado para: ${fileName}...`);
    try {
        const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await visionModel.generateContent([
            { inlineData: { data: buffer.toString('base64'), mimeType } },
            'Transcreva todo o texto deste documento de forma fiel, mantendo a estrutura de parágrafos.'
        ]);
        return result.response.text();
    } catch (err) {
        console.error(`❌ OCR falhou: ${err.message}`);
        return '';
    }
}

// ── PROCESSAR UM ARQUIVO ─────────────────────────────────────────────
async function processFile(filePath, categoria) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const sourceDocument = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        console.log(`\n📄 Processando: ${sourceDocument} [${categoria}]`);

        let text = '';
        if (ext === '.pdf') {
            const originalWarn = console.warn;
            console.warn = () => {};
            const data = await pdf(dataBuffer);
            text = data.text;
            console.warn = originalWarn;
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            text = result.value;
        } else if (ext === '.md' || ext === '.txt') {
            text = dataBuffer.toString('utf-8');
        }

        // Fallback para OCR se o texto vier vazio
        if (!text || text.trim().length < 50) {
            console.warn(`⚠️  Texto insuficiente — ativando OCR Vision...`);
            const mimeType = ext === '.docx'
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/pdf';
            text = await performOCR(dataBuffer, sourceDocument, mimeType);
            await sleep(4000); // OCR tem quota mais restrita (20 RPD) — pausa longa
        }

        if (!text || text.trim().length < 50) {
            console.warn(`⚠️  ${sourceDocument} sem conteúdo após OCR. Pulando.`);
            return;
        }

        const chunks = splitTextIntelligently(text, 2000);
        console.log(`✂️  ${chunks.length} chunks gerados.`);

        for (let i = 0; i < chunks.length; i++) {
            await sleep(CHUNK_DELAY_MS); // throttle de RPM

            let success = false;
            let retries = 0;

            while (!success && retries < keys_length_fallback()) {
                try {
                    // embedContent já faz rotação de chave e cooldown automático
                    const embedding = await embedContent(chunks[i]);

                    await DocumentEmbedding.create({
                        chunkText: chunks[i],
                        sourceDocument,
                        categoria,
                        embedding,
                        pageNumber: i + 1
                    });

                    process.stdout.write('.');
                    success = true;
                } catch (err) {
                    retries++;
                    if (err.message.includes('429') || err.message.includes('cooldown')) {
                        // Todas as chaves em cooldown — espera 65s antes de tentar de novo
                        console.warn(`\n⏳ Todas as chaves em cooldown. Aguardando 65s... (chunk ${i + 1}/${chunks.length})`);
                        await sleep(65000);
                    } else {
                        console.error(`\n❌ Erro fatal no chunk ${i + 1}: ${err.message}`);
                        break; // erro não-recuperável, pula o chunk
                    }
                }
            }

            if (!success) {
                console.warn(`\n⚠️  Chunk ${i + 1} pulado após ${retries} tentativas.`);
            }
        }

        console.log(`\n✅ ${sourceDocument} concluído.`);
    } catch (err) {
        console.error(`\n❌ Erro ao processar ${path.basename(filePath)}: ${err.message}`);
    }
}

// Helper: quantas chaves existem (para limitar retries)
function keys_length_fallback() {
    const count = Object.keys(process.env).filter(k => k.match(/^GEMINI_KEY_\d+$/)).length;
    return Math.max(count, 1) + 1; // mínimo 2 tentativas mesmo com 1 chave
}

// ── PROCESS ALL: exportável para uso como módulo ────────────────────
// Assume que a conexão com o MongoDB JÁ EXISTE (chamado pelo cleanAndReindex).
// Quando rodado standalone, main() cuida do connect/disconnect.
async function processAll() {
    const baseDir = path.join(__dirname, '../../documentos');
    const documentos = [
        { pasta: path.join(baseDir, 'enem'),       categoria: 'ENEM_REDACAO' },
        { pasta: path.join(baseDir, 'financeiro'),  categoria: 'FINANCEIRO'   },
        { pasta: path.join(baseDir, 'site'),        categoria: 'REGRAS_SITE'  },
    ];

    for (const { pasta, categoria } of documentos) {
        if (!fs.existsSync(pasta)) {
            console.warn(`⚠️  Pasta não encontrada, pulando: ${pasta}`);
            continue;
        }
        const arquivos = fs.readdirSync(pasta);
        for (const arquivo of arquivos) {
            const ext = path.extname(arquivo).toLowerCase();
            if (arquivo.startsWith('.') || !['.pdf', '.docx', '.md', '.txt'].includes(ext)) continue;
            await processFile(path.join(pasta, arquivo), categoria);
        }
    }

    console.log('\n🏁 Re-indexação completa.');
}

// ── MAIN: standalone (node processDocuments.js) ──────────────────────
async function main() {
    const hasAnyKey = process.env.GEMINI_API_KEY ||
        Object.keys(process.env).some(k => k.match(/^GEMINI_KEY_\d+$/));

    if (!process.env.MONGO_URI || !hasAnyKey) {
        console.error('❌ Verifique MONGO_URI e pelo menos uma chave Gemini no .env');
        process.exit(1);
    }

    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado.');

        await processAll();
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Só roda main() quando chamado diretamente (não quando importado como módulo)
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { processAll };
