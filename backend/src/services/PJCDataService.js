// backend/src/services/PJCDataService.js
const crypto = require('crypto');
const User = require('../models/User');
const AIInteraction = require('../models/AIInteraction');

class PJCDataService {
    constructor() {
        // [A3 - Auditoria 3.3] Salt independente para garantir integridade científica na LGPD
        this.salt = process.env.PJC_HASH_SALT || 'pjc-2k26-default-scientific-salt';
    }

    getPseudonym(id) {
        if (!id) return 'ANONYMOUS';
        return 'PJC_STUDENT_' + crypto
            .createHash('sha256')
            .update(id.toString() + this.salt)
            .digest('hex')
            .slice(0, 10)
            .toUpperCase();
    }

    washText(text) {
        if (!text) return text;
        let washed = text;
        washed = washed.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '[CPF_MASKED]');
        washed = washed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_MASKED]');
        washed = washed.replace(/\d{2}\/\d{2}\/\d{4}/g, '[DATE_MASKED]');
        return washed;
    }

    /**
     * Exporta dados científicos com filtros multinível
     */
    async exportScientificData(disciplinaId, filters = {}) {
        const query = { disciplinaId };
        
        // Aplica filtros de Turma (via User collection) ou Ano se fornecidos
        let allowedUserIds = null;
        if (filters.turma) {
            const users = await User.find({ turma: filters.turma }).select('_id');
            allowedUserIds = users.map(u => u._id);
            query.userId = { $in: allowedUserIds };
        }

        const interactions = await AIInteraction.find(query)
            .sort({ createdAt: -1 })
            .lean();

        console.log(`📊 [PJC] Exportando ${interactions.length} registros (Filtros: ${JSON.stringify(filters)})`);

        return interactions.map(inter => ({
            timestamp: inter.createdAt,
            pseudonimo: this.getPseudonym(inter.userId),
            pergunta: this.washText(inter.pergunta),
            resposta: this.washText(inter.resposta),
            modo: inter.modo,
            nota_aluno: inter.avaliacaoAluno,
            
            // Dados Acadêmicos no Momento (Snapshot)
            media_n1: inter.snapshotNotas?.n1_media,
            media_n2: inter.snapshotNotas?.n2_media,
            score_enem: inter.snapshotNotas?.simulado_enem_score,
            saldo_pc: inter.snapshotNotas?.saldoPc,
            
            // Métricas Longitudinais (se existirem)
            rendimento_30d_n1: inter.rendimentoDepois?.n1_media,
            rendimento_30d_n2: inter.rendimentoDepois?.n2_media,
            
            metricas_rag: inter.metadata?.ragScore || 0
        }));
    }

    /**
     * Gera Análise de Lacunas Pedagógicas (Gaps) segmentada
     */
    async generateGapAnalysis(disciplinaId, filters = {}) {
        const query = { 
            disciplinaId,
            'metadata.ragScore': { $lt: 0.4 } // Perguntas que o material do prof não explicou bem
        };

        if (filters.turma) {
            const users = await User.find({ turma: filters.turma }).select('_id');
            query.userId = { $in: users.map(u => u._id) };
        }

        const interactions = await AIInteraction.find(query).select('pergunta modo createdAt').lean();

        // Agrupamento por Modo de IA para entender o tipo de dúvida
        const gaps = {
            TUTOR: [],
            SUPORTE: [],
            CONSULTOR: [],
            GERAL: []
        };

        interactions.forEach(i => {
            const mode = i.modo || 'GERAL';
            if (gaps[mode]) gaps[mode].push(this.washText(i.pergunta));
        });

        return {
            totalGaps: interactions.length,
            gapsByMode: gaps
        };
    }
}

module.exports = new PJCDataService();
