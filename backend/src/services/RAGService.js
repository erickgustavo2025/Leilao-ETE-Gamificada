// backend/src/services/RAGService.js
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Piscina = require('piscina');
const { v4: uuidv4 } = require('uuid');
const DocumentEmbedding = require('../models/DocumentEmbedding');
const { embedContent } = require('../utils/geminiKeyManager');

// Configuração do Worker Pool para processamento pesado de PDFs (M1 - Auditoria)
const pdfPool = new Piscina({
    filename: path.resolve(__dirname, '../workers/pdfWorker.js')
});

const MATERIALS_MD_DIR = path.join(__dirname, '../../uploads/materials_md');

/**
 * Serviço responsável pela gestão de conhecimento vetorial (RAG)
 */
class RAGService {
    
    /**
     * Extrai texto bruto de buffers PDF, DOCX, MD ou TXT
     */
    async extractText(buffer, ext) {
        let text = '';
        try {
            if (ext === '.pdf') {
                // M1: Processamento paralelo via Piscina Worker para evitar bloqueio de I/O
                const tempPath = path.join(__dirname, `../../uploads/temp_${uuidv4()}.pdf`);
                
                // Garante que a pasta uploads existe
                const uploadsDir = path.dirname(tempPath);
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                fs.writeFileSync(tempPath, buffer);
                
                try {
                    const result = await pdfPool.run({ filePath: tempPath });
                    if (!result.success) throw new Error(result.error);
                    text = result.text;
                } finally {
                    // Limpeza de arquivo temporário (Sempre executar!)
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                }
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } else if (ext === '.md' || ext === '.txt') {
                text = buffer.toString('utf-8');
            }
            return text.trim();
        } catch (error) {
            console.error('Error extracting text:', error);
            throw new Error('Falha ao processar conteúdo do arquivo.');
        }
    }

    /**
     * Salva o texto extraído em formato .md para cache e referência futura
     */
    async saveToMarkdown(text, fileName, fileId) {
        if (!fs.existsSync(MATERIALS_MD_DIR)) {
            fs.mkdirSync(MATERIALS_MD_DIR, { recursive: true });
        }
        const safeName = `${fileId}_${fileName.replace(/\.[^/.]+$/, "")}.md`;
        const filePath = path.join(MATERIALS_MD_DIR, safeName);
        fs.writeFileSync(filePath, text, 'utf-8');
        return filePath;
    }

    /**
     * 🛡️ [BLINDAGEM 3.3] Limpa arquivos Markdown do disco para evitar leak de storage
     */
    async deleteMarkdown(fileId) {
        try {
            if (!fs.existsSync(MATERIALS_MD_DIR)) return;
            const files = fs.readdirSync(MATERIALS_MD_DIR);
            const targets = files.filter(f => f.startsWith(`${fileId}_`));
            
            for (const file of targets) {
                const fullPath = path.join(MATERIALS_MD_DIR, file);
                fs.unlinkSync(fullPath);
                console.log(`[RAG] Arquivo físico deletado: ${file}`);
            }
        } catch (err) {
            console.error(`[RAG] Erro ao deletar MD do fileId ${fileId}:`, err.message);
        }
    }

    /**
     * Fragmenta o texto em blocos menores respeitando parágrafos
     */
    splitText(text, maxLength = 1800) {
        if (!text) return [];
        const chunks = [];
        let currentChunk = '';
        const paragraphs = text.split(/\n\n+/);

        for (let paragraph of paragraphs) {
            if (!paragraph.trim()) continue;
            if ((currentChunk.length + paragraph.length + 2) <= maxLength) {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = paragraph;
            }
        }
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        return chunks;
    }

    /**
     * Indexa um documento: fragmenta, gera vetores e salva no MongoDB
     */
    async indexDocument(text, metadata) {
        const { sourceDocument, fileId, professorId, disciplinaId, categoria, ano, trimestre, topico } = metadata;
        const chunks = this.splitText(text);
        
        console.log(`🚀 Indexando ${chunks.length} chunks para ${sourceDocument} (Ano: ${ano}, Trim: ${trimestre})...`);

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await embedContent(chunks[i]);
            await DocumentEmbedding.create({
                chunkText: chunks[i],
                sourceDocument,
                fileId,
                professorId,
                disciplinaId,
                categoria,
                ano,
                trimestre,
                topico: topico || null,
                pageNumber: i + 1,
                embedding
            });
        }
        return chunks.length;
    }

    /**
     * Realiza busca vetorial no MongoDB Atlas
     */
    async vectorSearch(queryText, filters = {}, limit = 5) {
        try {
            const queryVector = await embedContent(queryText);
            
            // Pipelines do MongoDB Atlas Vector Search
            const pipeline = [
                {
                    $vectorSearch: {
                        index: "vector_index", // Nome deve coincidir com o index no Atlas
                        path: "embedding",
                        queryVector: queryVector,
                        numCandidates: 100,
                        limit: limit,
                        filter: {
                            $and: [
                                filters.disciplinaId ? { disciplinaId: filters.disciplinaId } : {},
                                filters.categoria ? { categoria: filters.categoria } : {},
                                filters.ano ? { ano: filters.ano } : {},
                                filters.trimestre ? { trimestre: filters.trimestre } : {},
                                filters.topico ? { topico: filters.topico } : {}
                            ].filter(f => Object.keys(f).length > 0)
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        chunkText: 1,
                        sourceDocument: 1,
                        categoria: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ];

            // Se filters estiver vazio, removemos o campo filter do pipeline
            if (pipeline[0].$vectorSearch.filter.$and.length === 0) {
                delete pipeline[0].$vectorSearch.filter;
            }

            const results = await DocumentEmbedding.aggregate(pipeline);
            return results;
        } catch (error) {
            console.error('Vector Search Error:', error);
            return []; // Fail silent para não quebrar a IA, apenas sem contexto
        }
    }
}

module.exports = new RAGService();
