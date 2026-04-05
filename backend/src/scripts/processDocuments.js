// backend/src/scripts/processDocuments.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const DocumentEmbedding = require('../models/DocumentEmbedding');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processFile(filePath, categoria) {
    const dataBuffer = fs.readFileSync(filePath);
    const sourceDocument = path.basename(filePath);
    
    console.log(`\n📄 Processando: ${sourceDocument} (${categoria})`);

    let text = '';
    if (filePath.endsWith('.pdf')) {
        const data = await pdf(dataBuffer);
        text = data.text;
    } else {
        text = dataBuffer.toString();
    }

    // Chunking simples (500 tokens ≈ 2000 caracteres)
    const chunks = text.match(/[\s\S]{1,2000}/g) || [];
    console.log(`✂️ Gerados ${chunks.length} chunks.`);

    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    for (let i = 0; i < chunks.length; i++) {
        try {
            const result = await model.embedContent(chunks[i]);
            const embedding = result.embedding.values;

            await DocumentEmbedding.create({
                chunkText: chunks[i],
                sourceDocument,
                categoria,
                embedding,
                pageNumber: i + 1
            });
            process.stdout.write('.');
        } catch (err) {
            console.error(`\n❌ Erro no chunk ${i}: ${err.message}`);
        }
    }
    console.log(`\n✅ ${sourceDocument} concluído.`);
}

async function main() {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI não definida no .env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);

    // Mapear arquivos por categoria
    const baseDir = path.join(__dirname, '../../documentos');
    const documentos = [
        { pasta: path.join(baseDir, 'enem'),      categoria: 'ENEM_REDACAO' },
        { pasta: path.join(baseDir, 'financeiro'), categoria: 'FINANCEIRO'   },
        { pasta: path.join(baseDir, 'site'),       categoria: 'REGRAS_SITE'  },
    ];

    for (const { pasta, categoria } of documentos) {
        if (!fs.existsSync(pasta)) {
            console.log(`⚠️ Pasta não encontrada: ${pasta}`);
            continue;
        }
        const arquivos = fs.readdirSync(pasta);
        for (const arquivo of arquivos) {
            await processFile(path.join(pasta, arquivo), categoria);
        }
    }

    console.log('🏁 Processamento concluído.');
    process.exit(0);
}

main().catch(console.error);
