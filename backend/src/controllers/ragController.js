// backend/src/controllers/ragController.js
const RAGService = require('../services/RAGService');
const DocumentEmbedding = require('../models/DocumentEmbedding');
const { v4: uuidv4 } = require('uuid');

/**
 * Controller para operações de RAG (Materiais do Professor)
 */
exports.uploadMaterial = async (req, res) => {
    try {
        const { disciplinaId, categoria, ano, trimestre, topico } = req.body;
        const professorId = req.user.id;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        if (!disciplinaId || !categoria || !ano || !trimestre) {
            return res.status(400).json({ error: 'Disciplina, Categoria, Ano e Trimestre são obrigatórios.' });
        }

        const ext = require('path').extname(file.originalname).toLowerCase();
        const fileId = uuidv4();

        // 1. Extração de Texto
        const text = await RAGService.extractText(file.buffer, ext);
        if (text.length < 50) {
            return res.status(400).json({ error: 'O arquivo contém pouco texto para ser processado.' });
        }

        // 2. Processamento Especial de EMENTA
        if (categoria === 'EMENTA') {
            console.log(`📋 Detectada Ementa para Disciplina ${disciplinaId}. Extraindo tópicos...`);
            // Esta função será chamada para atualizar o modelo Disciplina com os assuntos detectados
            await processEmentaTopics(disciplinaId, text, parseInt(trimestre));
        }

        // 3. Validação de Categoria (Sanity Check)
        const validation = validateCategoryFit(text, categoria);
        if (!validation.ok) {
            console.warn(`⚠️ Possível erro de categoria: ${validation.reason}`);
        }

        // 4. Salvar como .md para referência futura
        const mdPath = await RAGService.saveToMarkdown(text, file.originalname, fileId);

        // 5. Indexar Vetorialmente
        const chunkCount = await RAGService.indexDocument(text, {
            sourceDocument: file.originalname,
            fileId,
            professorId,
            disciplinaId,
            categoria,
            ano: parseInt(ano),
            trimestre: parseInt(trimestre),
            topico: topico || (categoria === 'EMENTA' ? 'CRONOGRAMA' : null)
        });

        res.json({
            success: true,
            message: `Material processado com sucesso! ${chunkCount} fragmentos gerados.`,
            fileId,
            mdPath: mdPath.split('uploads')[1] // retorna path relativo
        });

    } catch (error) {
        console.error('Upload Material Error:', error);
        res.status(500).json({ error: 'Erro interno ao processar o material.' });
    }
};

/**
 * Função Auxiliar: Extrai tópicos da ementa usando IA e salva na Disciplina
 */
async function processEmentaTopics(disciplinaId, text, trimestre) {
    try {
        const Disciplina = require('../models/Disciplina');
        const aiRotatorService = require('../services/AIRotatorService');

        const prompt = `Analise o texto da ementa abaixo e extraia uma lista de assuntos/tópicos principais abordados. 
        Retorne APENAS os nomes dos tópicos separados por vírgula, sem explicações.
        Exemplo: Citologia, Genética Mendeliana, Evolução das Espécies.
        
        TEXTO DA EMENTA:
        ${text.substring(0, 5000)}`;

        const response = await aiRotatorService.ask(prompt, "Você é um assistente pedagógico especializado em extrair cronogramas e ementas escolares.");
        
        const assuntos = response.split(',')
            .map(t => t.trim())
            .filter(t => t.length > 2 && t.length < 100);

        if (assuntos.length > 0) {
            const disciplina = await Disciplina.findById(disciplinaId);
            if (disciplina) {
                // Remove duplicatas e mescla com tópicos existentes do mesmo trimestre se houver
                const existingIndex = disciplina.ementaTopics.findIndex(t => t.trimestre === trimestre);
                if (existingIndex > -1) {
                    const newSet = new Set([...disciplina.ementaTopics[existingIndex].assuntos, ...assuntos]);
                    disciplina.ementaTopics[existingIndex].assuntos = Array.from(newSet);
                } else {
                    disciplina.ementaTopics.push({ trimestre, assuntos });
                }
                await disciplina.save();
                console.log(`✅ [PJC] ${assuntos.length} tópicos extraídos e salvos para a disciplina ${disciplina.nome}`);
            }
        }
    } catch (err) {
        console.error("❌ Erro ao processar tópicos da ementa:", err.message);
    }
}

/**
 * Retorna os tópicos da ementa para uma disciplina
 */
exports.getTopicsByDisciplina = async (req, res) => {
    try {
        const { disciplinaId } = req.params;
        const Disciplina = require('../models/Disciplina');
        const disciplina = await Disciplina.findById(disciplinaId).select('ementaTopics');
        
        if (!disciplina) return res.status(404).json({ error: 'Disciplina não encontrada' });
        
        res.json(disciplina.ementaTopics);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar tópicos.' });
    }
};

/**
 * Lista materiais indexados para a disciplina atual
 */
exports.getMaterialsByDisciplina = async (req, res) => {
    try {
        const { disciplinaId } = req.params;
        
        // Agrupamos por fileId para não retornar centenas de chunks
        const materials = await DocumentEmbedding.aggregate([
            { $match: { disciplinaId } },
            { 
                $group: { 
                    _id: "$fileId", 
                    sourceDocument: { $first: "$sourceDocument" },
                    categoria: { $first: "$categoria" },
                    ano: { $first: "$ano" },
                    trimestre: { $first: "$trimestre" },
                    topico: { $first: "$topico" },
                    createdAt: { $first: "$createdAt" },
                    totalChunks: { $sum: 1 }
                } 
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar materiais.' });
    }
};

/**
 * Deleta um material e todos os seus vetores associados
 */
exports.deleteMaterial = async (req, res) => {
    try {
        const { fileId } = req.params;
        const professorId = req.user.id;

        // 🛡️ [C4] Proteção contra IDOR: Filtra por autor ou privilégios de admin
        const query = { fileId };
        if (!['admin', 'dev'].includes(req.user.role)) {
            query.professorId = professorId;
        }

        const result = await DocumentEmbedding.deleteMany(query);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Material não encontrado ou você não tem permissão para deletá-lo.' });
        }

        // 🛡️ [BLINDAGEM 3.3] Remove arquivos Markdown vinculados para economizar espaço
        await RAGService.deleteMarkdown(fileId);

        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Delete Material Error:', error);
        res.status(500).json({ error: 'Erro ao deletar material.' });
    }
};

/**
 * Lógica simples de validação de categoria baseada em palavras-chave
 */
function validateCategoryFit(text, categoria) {
    const textLower = text.toLowerCase();
    
    if (categoria === 'GABARITO') {
        const keywords = ['resposta', 'gabarito', 'correto', 'alternativa', 'solução', 'resultado'];
        const hasKeywords = keywords.some(k => textLower.includes(k));
        if (!hasKeywords) return { ok: false, reason: 'Gabarito selecionado, mas palavras-chaves de resposta não encontradas.' };
    }

    if (categoria === 'EXERCICIOS') {
        const keywords = ['questão', 'exercício', 'resolva', 'enumere', 'calcule'];
        const hasKeywords = keywords.some(k => textLower.includes(k));
        if (!hasKeywords) return { ok: false, reason: 'Exercícios selecionado, mas enunciado de questões não detectado.' };
    }

    if (categoria === 'EMENTA') {
        const keywords = ['ementa', 'unidade', 'trimestre', 'objetivo', 'cronograma', 'competência', 'habilidades'];
        const hasKeywords = keywords.some(k => textLower.includes(k));
        if (!hasKeywords) return { ok: false, reason: 'Ementa selecionada, mas termos pedagógicos de cronograma não detectados.' };
    }

    return { ok: true };
}
