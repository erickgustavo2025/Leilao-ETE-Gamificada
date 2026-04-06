// backend/src/scripts/processDocuments.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const pdf = require('pdf-parse');
const mammoth = require('mammoth'); // 🛠️ Suporte a .docx
const { GoogleGenerativeAI } = require('@google/generative-ai');
const DocumentEmbedding = require('../models/DocumentEmbedding');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Função de Delay (Sleep) para respeitar o Rate Limit (15 RPM na conta gratuita)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Lógica de Chunking Inteligente (Recursive Split)
 */
function splitTextIntelligently(text, maxLength = 2000) {
    if (!text || text.trim().length === 0) return [];
    const chunks = [];
    let currentChunk = "";
    const paragraphs = text.split(/\n\n+/);

    for (let paragraph of paragraphs) {
        if (!paragraph.trim()) continue;
        if ((currentChunk.length + paragraph.length + 2) <= maxLength) {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            if (paragraph.length > maxLength) {
                const lines = paragraph.split(/\n/);
                for (let line of lines) {
                    if (!line.trim()) continue;
                    if ((currentChunk.length + line.length + 1) <= maxLength) {
                        currentChunk += (currentChunk ? "\n" : "") + line;
                    } else {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        if (line.length > maxLength) {
                            const words = line.split(/\s+/);
                            currentChunk = "";
                            for (let word of words) {
                                if ((currentChunk.length + word.length + 1) <= maxLength) {
                                    currentChunk += (currentChunk ? " " : "") + word;
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

/**
 * OCR de Emergência via Gemini 2.0 Flash (Caso o .docx ou PDF ainda venham vazios)
 */
async function performOCR(buffer, fileName, mimeType = 'application/pdf') {
    console.log(`\n🔍 Iniciando OCR Vision para: ${fileName}...`);
    try {
        const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await visionModel.generateContent([
            {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: mimeType
                }
            },
            "Transcreva todo o texto deste documento de forma fiel, mantendo a estrutura de parágrafos."
        ]);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error(`❌ Falha no OCR Vision: ${err.message}`);
        return "";
    }
}

async function processFile(filePath, categoria) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const sourceDocument = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        console.log(`\n📄 Processando: ${sourceDocument} (${categoria})`);

        let text = '';
        if (ext === '.pdf') {
            const originalWarn = console.warn;
            console.warn = () => { }; // Silencia avisos de fonte
            const data = await pdf(dataBuffer);
            text = data.text;
            console.warn = originalWarn;
        } else if (ext === '.docx') {
            // 🛠️ EXTRAÇÃO DE .DOCX USANDO MAMMOTH
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            text = result.value;
        } else if (ext === '.md' || ext === '.txt') {
            text = dataBuffer.toString();
        }

        // Se o texto vier vazio (mesmo em .docx ou .pdf), tenta o OCR Vision como último recurso
        if (!text || text.trim().length < 50) {
            console.warn(`⚠️ Conteúdo insuficiente detectado. Ativando OCR Vision...`);
            const mimeType = ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';
            text = await performOCR(dataBuffer, sourceDocument, mimeType);
            await sleep(4000);
        }

        if (!text || text.trim().length === 0) {
            console.log(`⚠️ Nenhum conteúdo extraído de ${sourceDocument}. Pulando...`);
            return;
        }

        const chunks = splitTextIntelligently(text, 2000);
        console.log(`✂️ Gerados ${chunks.length} chunks inteligentes.`);

        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

        for (let i = 0; i < chunks.length; i++) {
            let success = false;
            let retries = 0;
            while (!success && retries < 3) {
                try {
                    await sleep(4000 + (retries * 2000));
                    const result = await embeddingModel.embedContent(chunks[i]);
                    const embedding = result.embedding.values;

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
                    if (err.message.includes('429')) {
                        process.stdout.write('R');
                    } else {
                        console.error(`\n❌ Erro no chunk ${i}: ${err.message}`);
                        break;
                    }
                }
            }
        }
        console.log(`\n✅ ${sourceDocument} concluído.`);
    } catch (err) {
        console.error(`\n❌ Erro no arquivo ${filePath}: ${err.message}`);
    }
}

async function main() {
    if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
        console.error('❌ Verifique seu arquivo .env');
        process.exit(1);
    }

    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        const baseDir = path.join(__dirname, '../../documentos');
        const documentos = [
            { pasta: path.join(baseDir, 'enem'), categoria: 'ENEM_REDACAO' },
            { pasta: path.join(baseDir, 'financeiro'), categoria: 'FINANCEIRO' },
            { pasta: path.join(baseDir, 'site'), categoria: 'REGRAS_SITE' },
        ];

        for (const { pasta, categoria } of documentos) {
            if (!fs.existsSync(pasta)) continue;
            const arquivos = fs.readdirSync(pasta);
            for (const arquivo of arquivos) {
                const ext = path.extname(arquivo).toLowerCase();
                if (arquivo.startsWith('.') || !['.pdf', '.docx', '.md', '.txt'].includes(ext)) continue;
                await processFile(path.join(pasta, arquivo), categoria);
            }
        }

        console.log('\n🏁 Processamento de todos os documentos concluído.');
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main().catch(console.error);
