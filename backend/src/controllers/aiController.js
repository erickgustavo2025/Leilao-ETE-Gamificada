// backend/src/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const AIInteraction = require('../models/AIInteraction');
const DocumentEmbedding = require('../models/DocumentEmbedding');
const { SYSTEM_PROMPT_BASE, PAGE_CONTEXTS } = require('../config/aiSystemPrompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── HELPER: Produto Escalar 
const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);

// ── DETECT MODE (Seção 3.2)
const detectMode = (pergunta, path) => {
    const p = pergunta.toLowerCase();
    if (p.includes('enem') || p.includes('redação') || p.includes('estudar') || p.includes('matéria')) return 'TUTOR';
    if (p.includes('investir') || p.includes('ação') || p.includes('cripto') || p.includes('carteira') || path === '/gil-investe') return 'CONSULTOR';
    if (p.includes('como funciona') || p.includes('ajuda') || p.includes('erro') || p.includes('regra')) return 'SUPORTE';
    return 'GERAL';
};

exports.processAIRequest = async (req, res) => {
    try {
        const { pergunta, paginaOrigem } = req.body;
        const userId = req.user.id;

        // 1. Busca usuário com campos otimizados (Seção 3.2)
        const user = await User.findById(userId).select('nome turma saldoPc maxPcAchieved cargos notas investments');
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // 2. Detecta o modo
        const modo = detectMode(pergunta, paginaOrigem);
        let contextRAG = '';

        // 3. RAG Condicional (Só TUTOR ou CONSULTOR)
        if (modo === 'TUTOR' || modo === 'CONSULTOR') {
            const modelEmb = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const resEmb = await modelEmb.embedContent(pergunta);
            const queryVector = resEmb.embedding.values;

            // Busca chunks (Manual Dot Product para compatibilidade)
            const docs = await DocumentEmbedding.find({
                categoria: modo === 'TUTOR' ? { $regex: /ENEM/ } : 'FINANCEIRO'
            }).limit(50);

            const scored = docs.map(d => ({
                text: d.chunkText,
                score: dotProduct(queryVector, d.embedding)
            })).sort((a, b) => b.score - a.score).slice(0, 3);

            contextRAG = scored.map(s => s.text).join('\n\n');
        }

        // 4. Monta Prompt
        const pageCtx = PAGE_CONTEXTS[paginaOrigem] || '';
        const prompt = SYSTEM_PROMPT_BASE
            .replace('{PAGINA_ATUAL}', `${paginaOrigem}. ${pageCtx}`)
            .replace('{DADOS_ALUNO}', JSON.stringify({
                nome: user.nome,
                saldo: user.saldoPc,
                rank: user.maxPcAchieved,
                cargos: user.cargos,
                notas: user.notas
            })) + `\n\nCONHECIMENTO ADICIONAL (RAG):\n${contextRAG}\n\nPERGUNTA: ${pergunta}`;

        // 5. Chama Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const resposta = result.response.text();

        // 6. Snapshot Científico
        const snapshot = {
            n1_media: user.notas?.n1?.length ? user.notas.n1.reduce((a, b) => a + b, 0) / user.notas.n1.length : null,
            n2_media: user.notas?.n2?.length ? user.notas.n2.reduce((a, b) => a + b, 0) / user.notas.n2.length : null,
            redacao_media: user.notas?.redacoes?.length ? user.notas.redacoes.reduce((a, b) => a + b, 0) / user.notas.redacoes.length : null,
            simulado_enem_score: user.notas?.simulados?.length ? user.notas.simulados[user.notas.simulados.length - 1] : null,
            saldoPc: user.saldoPc,
            maxPcAchieved: user.maxPcAchieved,
            trimestre: `${new Date().getFullYear()}-T${Math.ceil((new Date().getMonth() + 1) / 4)}`
        };

        // 7. Salva Interação (Assíncrono sem await - Seção 3.2)
        AIInteraction.create({
            userId, pergunta, resposta, modo, paginaOrigem, snapshotNotas: snapshot
        }).catch(err => console.error('❌ Erro ao salvar interação:', err));

        res.json({ resposta, modo });

    } catch (error) {
        console.error('❌ Erro no Oráculo:', error);
        res.status(500).json({ error: 'Erro ao processar pergunta.' });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const { interactionId, avaliacao } = req.body;
        await AIInteraction.findOneAndUpdate(
            { _id: interactionId, userId: req.user._id },
            { avaliacaoAluno: avaliacao }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar feedback.' });
    }
};
